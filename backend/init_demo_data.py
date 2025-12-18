"""Initialize demo data for testing"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext

from app.database import async_session_maker, engine, Base
from app.models.user import User, UserRole
from app.models.financier import Financier

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

async def init_demo_data():
    async with async_session_maker() as db:
        # 1. Create Financier company
        financier = Financier(
            name="Demo Rahoitus Oy",
            email="info@demorahoitus.fi",
            phone="+358 9 123 4567",
            address="Rahoituskatu 1, 00100 Helsinki",
            business_id="1234567-8",
            is_active=True,
            notes="Demo-rahoittaja testausta varten"
        )
        db.add(financier)
        await db.flush()  # Get the financier ID
        
        print(f"✓ Created financier: {financier.name} (ID: {financier.id})")
        
        # 2. Create Admin user
        admin = User(
            email="admin@Kantama.fi",
            password_hash=hash_password("admin123"),
            role=UserRole.ADMIN,
            first_name="Admin",
            last_name="User",
            is_active=True,
            is_verified=True
        )
        db.add(admin)
        print(f"✓ Created admin: {admin.email}")
        
        # 3. Create Financier user (linked to financier company)
        financier_user = User(
            email="demo.financier@Kantama.fi",
            password_hash=hash_password("demo123"),
            role=UserRole.FINANCIER,
            first_name="Demo",
            last_name="Rahoittaja",
            financier_id=financier.id,
            is_active=True,
            is_verified=True
        )
        db.add(financier_user)
        print(f"✓ Created financier user: {financier_user.email}")
        
        # 4. Create Customer user (t.leinonen@yahoo.com)
        customer = User(
            email="t.leinonen@yahoo.com",
            password_hash=hash_password("pass123"),
            role=UserRole.CUSTOMER,
            first_name="Timo",
            last_name="Leinonen",
            phone="+358 40 123 4567",
            company_name="Leinonen Oy",
            business_id="2345678-9",
            is_active=True,
            is_verified=True
        )
        db.add(customer)
        print(f"✓ Created customer: {customer.email}")
        
        # 5. Create another demo customer
        demo_customer = User(
            email="demo.customer@Kantama.fi",
            password_hash=hash_password("demo123"),
            role=UserRole.CUSTOMER,
            first_name="Demo",
            last_name="Asiakas",
            is_active=True,
            is_verified=True
        )
        db.add(demo_customer)
        print(f"✓ Created demo customer: {demo_customer.email}")
        
        await db.commit()
        print("\n✅ All demo data created successfully!")
        print("\nLogin credentials:")
        print("  Admin: admin@Kantama.fi / admin123")
        print("  Financier: demo.financier@Kantama.fi / demo123")
        print("  Customer: t.leinonen@yahoo.com / pass123")
        print("  Customer: demo.customer@Kantama.fi / demo123")

if __name__ == "__main__":
    asyncio.run(init_demo_data())

