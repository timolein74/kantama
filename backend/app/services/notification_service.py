from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Optional, Dict, Any
from datetime import datetime

from app.models.notification import Notification
from app.models.user import User
from app.services.email_service import email_service


class NotificationService:
    
    async def create_notification(
        self,
        db: AsyncSession,
        user_id: int,
        title: str,
        message: str,
        notification_type: str,
        reference_type: Optional[str] = None,
        reference_id: Optional[int] = None,
        action_url: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None,
        send_email: bool = False,
        email_content: Optional[Dict] = None
    ) -> Notification:
        """Create an in-app notification"""
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            reference_type=reference_type,
            reference_id=reference_id,
            action_url=action_url,
            data=data
        )
        
        db.add(notification)
        await db.commit()
        await db.refresh(notification)
        
        return notification
    
    async def get_user_notifications(
        self,
        db: AsyncSession,
        user_id: int,
        unread_only: bool = False,
        limit: int = 50
    ) -> list[Notification]:
        """Get notifications for a user"""
        query = select(Notification).where(Notification.user_id == user_id)
        
        if unread_only:
            query = query.where(Notification.is_read == False)
        
        query = query.order_by(Notification.created_at.desc()).limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def mark_as_read(
        self,
        db: AsyncSession,
        notification_id: int,
        user_id: int
    ) -> bool:
        """Mark a notification as read"""
        result = await db.execute(
            update(Notification)
            .where(Notification.id == notification_id, Notification.user_id == user_id)
            .values(is_read=True, read_at=datetime.utcnow())
        )
        await db.commit()
        return result.rowcount > 0
    
    async def mark_all_as_read(
        self,
        db: AsyncSession,
        user_id: int
    ) -> int:
        """Mark all notifications as read for a user"""
        result = await db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
            .values(is_read=True, read_at=datetime.utcnow())
        )
        await db.commit()
        return result.rowcount
    
    async def get_unread_count(
        self,
        db: AsyncSession,
        user_id: int
    ) -> int:
        """Get count of unread notifications"""
        result = await db.execute(
            select(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
        )
        return len(result.scalars().all())
    
    # Convenience methods for common notification types
    
    async def notify_application_submitted(
        self,
        db: AsyncSession,
        user_id: int,
        application_id: int,
        reference_number: str
    ):
        """Notify about successful application submission"""
        await self.create_notification(
            db=db,
            user_id=user_id,
            title="Hakemus lähetetty",
            message=f"Hakemuksenne {reference_number} on vastaanotettu. Seuraamme käsittelyn etenemistä.",
            notification_type="APPLICATION_SUBMITTED",
            reference_type="application",
            reference_id=application_id,
            action_url=f"/dashboard/applications/{application_id}"
        )
    
    async def notify_sent_to_financier(
        self,
        db: AsyncSession,
        customer_id: int,
        financier_user_ids: list[int],
        application_id: int,
        reference_number: str,
        financier_name: str
    ):
        """Notify when application is sent to financier"""
        # Notify customer
        await self.create_notification(
            db=db,
            user_id=customer_id,
            title="Hakemus käsittelyssä",
            message=f"Hakemuksenne {reference_number} on lähetetty rahoittajalle {financier_name} käsittelyyn.",
            notification_type="SUBMITTED_TO_FINANCIER",
            reference_type="application",
            reference_id=application_id,
            action_url=f"/dashboard/applications/{application_id}"
        )
        
        # Notify financier users
        for user_id in financier_user_ids:
            await self.create_notification(
                db=db,
                user_id=user_id,
                title="Uusi hakemus",
                message=f"Uusi rahoitushakemus {reference_number} odottaa käsittelyä.",
                notification_type="NEW_APPLICATION",
                reference_type="application",
                reference_id=application_id,
                action_url=f"/financier/applications/{application_id}"
            )
    
    async def notify_info_requested(
        self,
        db: AsyncSession,
        customer_id: int,
        application_id: int,
        reference_number: str,
        message: str
    ):
        """Notify customer about info request"""
        await self.create_notification(
            db=db,
            user_id=customer_id,
            title="Lisätietopyyntö",
            message=f"Rahoittaja pyytää lisätietoja hakemukseenne {reference_number}.",
            notification_type="INFO_REQUESTED",
            reference_type="application",
            reference_id=application_id,
            action_url=f"/dashboard/applications/{application_id}"
        )
    
    async def notify_info_provided(
        self,
        db: AsyncSession,
        financier_user_ids: list[int],
        application_id: int,
        reference_number: str
    ):
        """Notify financier that customer provided info"""
        for user_id in financier_user_ids:
            await self.create_notification(
                db=db,
                user_id=user_id,
                title="Lisätiedot toimitettu",
                message=f"Asiakas on toimittanut lisätietoja hakemukseen {reference_number}.",
                notification_type="INFO_PROVIDED",
                reference_type="application",
                reference_id=application_id,
                action_url=f"/financier/applications/{application_id}"
            )
    
    async def notify_offer_sent(
        self,
        db: AsyncSession,
        customer_id: int,
        application_id: int,
        reference_number: str,
        monthly_payment: float
    ):
        """Notify customer about new offer"""
        await self.create_notification(
            db=db,
            user_id=customer_id,
            title="Rahoitustarjous saatavilla",
            message=f"Uusi rahoitustarjous hakemukseenne {reference_number}: {monthly_payment:,.2f} €/kk",
            notification_type="OFFER_SENT",
            reference_type="application",
            reference_id=application_id,
            action_url=f"/dashboard/applications/{application_id}"
        )
    
    async def notify_offer_accepted(
        self,
        db: AsyncSession,
        financier_user_ids: list[int],
        application_id: int,
        reference_number: str,
        company_name: str
    ):
        """Notify financier that offer was accepted"""
        for user_id in financier_user_ids:
            await self.create_notification(
                db=db,
                user_id=user_id,
                title="Tarjous hyväksytty",
                message=f"Asiakas {company_name} on hyväksynyt tarjouksen hakemukseen {reference_number}.",
                notification_type="OFFER_ACCEPTED",
                reference_type="application",
                reference_id=application_id,
                action_url=f"/financier/applications/{application_id}"
            )
    
    async def notify_contract_sent(
        self,
        db: AsyncSession,
        customer_id: int,
        application_id: int,
        reference_number: str
    ):
        """Notify customer about contract ready for signing"""
        await self.create_notification(
            db=db,
            user_id=customer_id,
            title="Sopimus allekirjoitettavaksi",
            message=f"Sopimus hakemukseenne {reference_number} on valmis allekirjoitettavaksi.",
            notification_type="CONTRACT_SENT",
            reference_type="application",
            reference_id=application_id,
            action_url=f"/dashboard/applications/{application_id}"
        )
    
    async def notify_contract_signed(
        self,
        db: AsyncSession,
        financier_user_ids: list[int],
        application_id: int,
        reference_number: str,
        company_name: str
    ):
        """Notify financier that contract was signed"""
        for user_id in financier_user_ids:
            await self.create_notification(
                db=db,
                user_id=user_id,
                title="Sopimus allekirjoitettu",
                message=f"Asiakas {company_name} on allekirjoittanut sopimuksen {reference_number}.",
                notification_type="CONTRACT_SIGNED",
                reference_type="application",
                reference_id=application_id,
                action_url=f"/financier/applications/{application_id}"
            )


notification_service = NotificationService()

