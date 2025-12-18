import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List
from jinja2 import Template
import logging

from app.config import settings


logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM_EMAIL
        self.from_name = settings.SMTP_FROM_NAME
        self.admin_email = settings.ADMIN_EMAIL
        self.frontend_url = settings.FRONTEND_URL
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        cc: Optional[List[str]] = None
    ) -> bool:
        """Send an email"""
        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = to_email
            
            if cc:
                message["Cc"] = ", ".join(cc)
            
            if text_content:
                message.attach(MIMEText(text_content, "plain"))
            message.attach(MIMEText(html_content, "html"))
            
            # In development, just log the email
            if settings.DEBUG and not self.smtp_user:
                logger.info(f"[EMAIL] To: {to_email}, Subject: {subject}")
                logger.info(f"[EMAIL] Content: {html_content[:500]}...")
                return True
            
            recipients = [to_email]
            if cc:
                recipients.extend(cc)
            
            await aiosmtplib.send(
                message,
                hostname=self.smtp_host,
                port=self.smtp_port,
                username=self.smtp_user,
                password=self.smtp_password,
                start_tls=True,
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False
    
    async def send_verification_email(self, email: str, token: str, first_name: Optional[str] = None):
        """Send account verification email"""
        verification_url = f"{self.frontend_url}/verify?token={token}"
        name = first_name or "Asiakas"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #1a365d 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }}
                .button {{ display: inline-block; background: #2563eb; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }}
                .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Kantama</h1>
                    <p>Yritysrahoitusta helposti</p>
                </div>
                <div class="content">
                    <h2>Tervetuloa, {name}!</h2>
                    <p>Kiitos rekisteröitymisestäsi Kantama-palveluun. Vahvista tilisi klikkaamalla alla olevaa painiketta:</p>
                    <center>
                        <a href="{verification_url}" class="button">Vahvista tili</a>
                    </center>
                    <p>Jos painike ei toimi, kopioi tämä linkki selaimeesi:</p>
                    <p style="word-break: break-all; color: #2563eb;">{verification_url}</p>
                    <p>Linkki on voimassa 24 tuntia.</p>
                </div>
                <div class="footer">
                    <p>© 2025 Kantama. Kaikki oikeudet pidätetään.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        await self.send_email(
            to_email=email,
            subject="Vahvista Kantama-tilisi",
            html_content=html_content
        )
    
    async def send_application_submitted_to_financier(
        self,
        financier_email: str,
        financier_name: str,
        application_ref: str,
        company_name: str,
        application_type: str,
        equipment_price: float
    ):
        """Notify financier about new application"""
        app_url = f"{self.frontend_url}/financier/applications"
        type_fi = "Leasing" if application_type == "LEASING" else "Sale-Leaseback"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #1a365d 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }}
                .info-box {{ background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2563eb; }}
                .button {{ display: inline-block; background: #2563eb; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }}
                .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Kantama</h1>
                    <p>Uusi hakemus käsiteltäväksi</p>
                </div>
                <div class="content">
                    <h2>Hei {financier_name},</h2>
                    <p>Uusi rahoitushakemus on lähetetty käsiteltäväksenne.</p>
                    <div class="info-box">
                        <p><strong>Hakemuksen numero:</strong> {application_ref}</p>
                        <p><strong>Yritys:</strong> {company_name}</p>
                        <p><strong>Tyyppi:</strong> {type_fi}</p>
                        <p><strong>Summa:</strong> {equipment_price:,.2f} €</p>
                    </div>
                    <center>
                        <a href="{app_url}" class="button">Avaa hakemus</a>
                    </center>
                </div>
                <div class="footer">
                    <p>© 2025 Kantama. Kaikki oikeudet pidätetään.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        await self.send_email(
            to_email=financier_email,
            subject=f"Uusi rahoitushakemus: {application_ref}",
            html_content=html_content
        )
    
    async def send_info_request_to_customer(
        self,
        customer_email: str,
        customer_name: str,
        application_ref: str,
        message: str,
        requested_items: Optional[List[str]] = None
    ):
        """Send info request notification to customer"""
        app_url = f"{self.frontend_url}/dashboard/applications"
        items_html = ""
        if requested_items:
            items_html = "<ul>" + "".join(f"<li>{item}</li>" for item in requested_items) + "</ul>"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #1a365d 0%, #f59e0b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }}
                .message-box {{ background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b; }}
                .button {{ display: inline-block; background: #2563eb; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }}
                .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Kantama</h1>
                    <p>Lisätietopyyntö</p>
                </div>
                <div class="content">
                    <h2>Hei {customer_name},</h2>
                    <p>Rahoittaja pyytää lisätietoja hakemukseenne <strong>{application_ref}</strong> liittyen.</p>
                    <div class="message-box">
                        <p><strong>Viesti:</strong></p>
                        <p>{message}</p>
                        {items_html}
                    </div>
                    <center>
                        <a href="{app_url}" class="button">Vastaa lisätietopyyntöön</a>
                    </center>
                </div>
                <div class="footer">
                    <p>© 2025 Kantama. Kaikki oikeudet pidätetään.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        await self.send_email(
            to_email=customer_email,
            subject=f"Lisätietopyyntö: {application_ref}",
            html_content=html_content,
            cc=[self.admin_email]
        )
    
    async def send_offer_to_customer(
        self,
        customer_email: str,
        customer_name: str,
        application_ref: str,
        monthly_payment: float,
        term_months: int,
        notes: Optional[str] = None
    ):
        """Send offer notification to customer"""
        app_url = f"{self.frontend_url}/dashboard/applications"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }}
                .offer-box {{ background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border: 2px solid #10b981; }}
                .price {{ font-size: 32px; font-weight: bold; color: #059669; }}
                .button {{ display: inline-block; background: #059669; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }}
                .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Kantama</h1>
                    <p>Rahoitustarjous saatavilla!</p>
                </div>
                <div class="content">
                    <h2>Hei {customer_name},</h2>
                    <p>Olemme saaneet rahoitustarjouksen hakemukseenne <strong>{application_ref}</strong>.</p>
                    <div class="offer-box">
                        <center>
                            <p>Kuukausierä</p>
                            <p class="price">{monthly_payment:,.2f} €/kk</p>
                            <p>Sopimuskausi: {term_months} kuukautta</p>
                        </center>
                    </div>
                    {f'<p><strong>Viesti:</strong> {notes}</p>' if notes else ''}
                    <center>
                        <a href="{app_url}" class="button">Avaa tarjous Kantamaissa</a>
                    </center>
                </div>
                <div class="footer">
                    <p>© 2025 Kantama. Kaikki oikeudet pidätetään.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        await self.send_email(
            to_email=customer_email,
            subject=f"Rahoitustarjous: {application_ref}",
            html_content=html_content,
            cc=[self.admin_email]
        )
    
    async def send_offer_accepted_notification(
        self,
        to_email: str,
        recipient_name: str,
        application_ref: str,
        company_name: str,
        monthly_payment: float,
        term_months: int,
        is_financier: bool = False
    ):
        """Notify about accepted offer"""
        portal_url = f"{self.frontend_url}/{'financier' if is_financier else 'dashboard'}/applications"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }}
                .success-icon {{ font-size: 48px; }}
                .info-box {{ background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #10b981; }}
                .button {{ display: inline-block; background: #2563eb; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }}
                .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Kantama</h1>
                    <p class="success-icon">✓</p>
                    <p>Tarjous hyväksytty!</p>
                </div>
                <div class="content">
                    <h2>Hei {recipient_name},</h2>
                    <p>{'Asiakas on hyväksynyt tarjouksenne' if is_financier else 'Olet hyväksynyt rahoitustarjouksen'}.</p>
                    <div class="info-box">
                        <p><strong>Hakemuksen numero:</strong> {application_ref}</p>
                        <p><strong>Yritys:</strong> {company_name}</p>
                        <p><strong>Kuukausierä:</strong> {monthly_payment:,.2f} €/kk</p>
                        <p><strong>Sopimuskausi:</strong> {term_months} kuukautta</p>
                    </div>
                    <p>{'Seuraava vaihe: Lähetä sopimus asiakkaalle allekirjoitettavaksi.' if is_financier else 'Rahoittaja lähettää pian sopimuksen allekirjoitettavaksi.'}</p>
                    <center>
                        <a href="{portal_url}" class="button">{'Lähetä sopimus' if is_financier else 'Avaa hakemus'}</a>
                    </center>
                </div>
                <div class="footer">
                    <p>© 2025 Kantama. Kaikki oikeudet pidätetään.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        await self.send_email(
            to_email=to_email,
            subject=f"Tarjous hyväksytty: {application_ref}",
            html_content=html_content,
            cc=[self.admin_email] if is_financier else None
        )
    
    async def send_contract_to_customer(
        self,
        customer_email: str,
        customer_name: str,
        application_ref: str,
        message: Optional[str] = None
    ):
        """Notify customer about contract ready for signing"""
        app_url = f"{self.frontend_url}/dashboard/applications"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }}
                .info-box {{ background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #7c3aed; }}
                .button {{ display: inline-block; background: #7c3aed; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }}
                .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Kantama</h1>
                    <p>Sopimus allekirjoitettavaksi</p>
                </div>
                <div class="content">
                    <h2>Hei {customer_name},</h2>
                    <p>Sopimus hakemukseenne <strong>{application_ref}</strong> on valmis allekirjoitettavaksi.</p>
                    {f'<div class="info-box"><p><strong>Viesti rahoittajalta:</strong></p><p>{message}</p></div>' if message else ''}
                    <p>Voit ladata sopimuksen, allekirjoittaa sen ja palauttaa sen Kantama-portaalissa.</p>
                    <center>
                        <a href="{app_url}" class="button">Allekirjoita sopimus</a>
                    </center>
                </div>
                <div class="footer">
                    <p>© 2025 Kantama. Kaikki oikeudet pidätetään.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        await self.send_email(
            to_email=customer_email,
            subject=f"Sopimus allekirjoitettavaksi: {application_ref}",
            html_content=html_content,
            cc=[self.admin_email]
        )
    
    async def send_admin_notification(
        self,
        subject: str,
        event_type: str,
        application_ref: str,
        details: dict
    ):
        """Send notification to admin email"""
        details_html = "".join(f"<p><strong>{k}:</strong> {v}</p>" for k, v in details.items())
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #1a365d 0%, #2563eb 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }}
                .event-type {{ background: #2563eb; color: white; padding: 5px 12px; border-radius: 4px; display: inline-block; margin-bottom: 15px; }}
                .details {{ background: white; padding: 15px; border-radius: 8px; }}
                .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Kantama Admin</h2>
                </div>
                <div class="content">
                    <span class="event-type">{event_type}</span>
                    <h3>Hakemus: {application_ref}</h3>
                    <div class="details">
                        {details_html}
                    </div>
                </div>
                <div class="footer">
                    <p>Tämä on automaattinen ilmoitus Kantama-järjestelmästä.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        await self.send_email(
            to_email=self.admin_email,
            subject=f"[Kantama] {subject}",
            html_content=html_content
        )


    async def send_welcome_email(
        self,
        email: str,
        company_name: str,
        password: Optional[str] = None
    ):
        """Send welcome email with login instructions"""
        login_url = f"{self.frontend_url}/login"
        
        password_section = ""
        if password:
            password_section = f"""
            <div class="info-box" style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 4px;">
                <p><strong>⚠️ Väliaikainen salasanasi:</strong></p>
                <p style="font-family: monospace; font-size: 18px; background: white; padding: 10px; border-radius: 4px;">{password}</p>
                <p style="font-size: 12px; color: #92400e;">Suosittelemme vaihtamaan salasanan ensimmäisen kirjautumisen jälkeen.</p>
            </div>
            """
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #1a365d 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }}
                .button {{ display: inline-block; background: #2563eb; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }}
                .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }}
                .info-box {{ background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2563eb; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Kantama</h1>
                    <p>Tervetuloa rahoituspalveluun!</p>
                </div>
                <div class="content">
                    <h2>Hei {company_name}!</h2>
                    <p>Kiitos rahoitushakemuksestasi. Olemme vastaanottaneet hakemuksesi ja se on nyt käsittelyssä.</p>
                    
                    <div class="info-box">
                        <p><strong>Kirjautumistiedot:</strong></p>
                        <p>Sähköposti: <strong>{email}</strong></p>
                    </div>
                    
                    {password_section}
                    
                    <p>Voit seurata hakemuksesi tilaa ja vastata mahdollisiin lisätietopyyntöihin kirjautumalla palveluun:</p>
                    
                    <center>
                        <a href="{login_url}" class="button">Kirjaudu sisään</a>
                    </center>
                    
                    <p>Otamme sinuun yhteyttä mahdollisimman pian.</p>
                </div>
                <div class="footer">
                    <p>© 2025 Kantama. Kaikki oikeudet pidätetään.</p>
                    <p>Tämä on automaattinen viesti, älä vastaa tähän sähköpostiin.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        await self.send_email(
            to_email=email,
            subject="Tervetuloa Kantama-palveluun!",
            html_content=html_content
        )


email_service = EmailService()

