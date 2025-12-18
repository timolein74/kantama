from fastapi import APIRouter
from app.routes import auth, users, financiers, applications, assignments, info_requests, offers, contracts, notifications, files, ytj

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(financiers.router, prefix="/financiers", tags=["Financiers"])
api_router.include_router(applications.router, prefix="/applications", tags=["Applications"])
api_router.include_router(assignments.router, prefix="/assignments", tags=["Assignments"])
api_router.include_router(info_requests.router, prefix="/info-requests", tags=["Info Requests"])
api_router.include_router(offers.router, prefix="/offers", tags=["Offers"])
api_router.include_router(contracts.router, prefix="/contracts", tags=["Contracts"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(files.router, prefix="/files", tags=["Files"])
api_router.include_router(ytj.router, prefix="/ytj", tags=["YTJ - Company Info"])

