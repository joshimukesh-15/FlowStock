import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.core.seed import seed_demo_data
from app.core.scheduler import start_background_scheduler, stop_background_scheduler

logger = logging.getLogger("flowstock.startup")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Ensure storage paths exist
    os.makedirs(settings.STORAGE_LOCAL_PATH, exist_ok=True)
    # Seed initial demo organizations and users (non-fatal if database is temporarily unreachable)
    try:
        await seed_demo_data()
    except Exception as exc:
        logger.warning(
            "Initial database seed skipped on startup (%s). Application will continue running.",
            exc,
        )
    # Start native async background scheduler
    start_background_scheduler(interval_seconds=300)
    yield
    # Stop background scheduler on shutdown
    stop_background_scheduler()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FlowStock ? Multi-Tenant B2B SaaS Operations Platform",
    version="0.1.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.DEBUG else None,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "version": "0.1.0",
        "docs": "/docs",
    }
