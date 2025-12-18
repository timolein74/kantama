"""Create test user and application"""
import asyncio
from app.database import async_session_maker
from app.models import User, Application, Financier
from app.models.user import UserRole
from app.models.application import ApplicationType, ApplicationStatus
from app.utils.auth import get_password_hash

async def create_test_data():
    async with async_session_maker() as db:
        # Create financier first
        financier = Financier(
            name='Release Finland Oy',
            business_id='1234567-8',
            email='info@release.fi',
            is_active=True
        )
        db.add(financier)
        await db.commit()
        await db.refresh(financier)
        print(f'Created financier: {financier.name} (ID: {financier.id})')
        
        # Create user t.leinonen@yahoo.com
        user = User(
            email='t.leinonen@yahoo.com',
            password_hash=get_password_hash('pass123'),
            role=UserRole.CUSTOMER,
            first_name='Timo',
            last_name='Leinonen',
            company_name='Testi Oy',
            business_id='1234567-8',
            is_active=True,
            is_verified=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        print(f'Created user: {user.email} (ID: {user.id})')
        
        # Create application
        app = Application(
            reference_number='LEA-2025-00001',
            application_type=ApplicationType.LEASING,
            status=ApplicationStatus.SUBMITTED,
            customer_id=user.id,
            company_name='Testi Oy',
            business_id='1234567-8',
            contact_email='t.leinonen@yahoo.com',
            contact_phone='+358 40 123 4567',
            equipment_price=50000,
            requested_term_months=36,
            additional_info='Testi hakemus'
        )
        db.add(app)
        await db.commit()
        await db.refresh(app)
        print(f'Created application: {app.reference_number} (ID: {app.id})')
        print('Done!')

if __name__ == '__main__':
    asyncio.run(create_test_data())

