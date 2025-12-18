import asyncio
from sqlalchemy import select
from app.database import async_session_maker
from app.models.user import User
from app.utils.auth import get_password_hash

async def set_password():
    async with async_session_maker() as db:
        result = await db.execute(select(User).where(User.email == 't.leinonen@yahoo.com'))
        user = result.scalar_one_or_none()
        if user:
            user.password_hash = get_password_hash('test123')
            user.is_verified = True
            await db.commit()
            print('Password set to: test123')
        else:
            print('User not found')

asyncio.run(set_password())





