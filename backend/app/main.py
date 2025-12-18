from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db
from app.routes import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    await create_admin_user()
    yield
    # Shutdown


async def create_admin_user():
    """Create default admin user if not exists"""
    from app.database import async_session_maker
    from app.models.user import User, UserRole
    from app.utils.auth import get_password_hash
    from sqlalchemy import select
    
    async with async_session_maker() as db:
        result = await db.execute(
            select(User).where(User.role == UserRole.ADMIN)
        )
        admin = result.scalar_one_or_none()
        
        if not admin:
            admin = User(
                email="admin@Kantama.fi",
                password_hash=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                first_name="Admin",
                last_name="Kantama",
                is_active=True,
                is_verified=True
            )
            db.add(admin)
            await db.commit()
            print("Created default admin user: admin@Kantama.fi / admin123")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Kantama - Yritysrahoitusportaali",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        settings.FRONTEND_URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}

