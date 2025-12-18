import asyncio
from sqlalchemy import select
from passlib.context import CryptContext
from app.database import async_session_maker
from app.models.user import User, UserRole
from app.models.financier import Financier

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

async def fix():
    async with async_session_maker() as db:
        # Financier
        r = await db.execute(select(Financier))
        if not r.scalar_one_or_none():
            db.add(Financier(name='Demo Rahoitus Oy', email='info@demo.fi', is_active=True))
            print('Created financier')
        
        # User
        r = await db.execute(select(User).where(User.email == 't.leinonen@yahoo.com'))
        u = r.scalar_one_or_none()
        if u:
            u.password_hash = pwd_context.hash('pass123')
            u.is_active = True
            u.is_verified = True
            print('Updated password')
        else:
            db.add(User(email='t.leinonen@yahoo.com', password_hash=pwd_context.hash('pass123'), role=UserRole.CUSTOMER, is_active=True, is_verified=True))
            print('Created user')
        
        await db.commit()
        print('Done!')

asyncio.run(fix())

