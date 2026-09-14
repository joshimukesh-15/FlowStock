"""Authentication Endpoints: Signup, Login, and Token Validation."""
from fastapi import APIRouter, Depends, HTTPException, status, Header
from typing import Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError, jwt

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User
from app.models.organization import Organization
from app.schemas.auth import SignupRequest, LoginRequest, TokenResponse, AuthUserRead, AuthOrgRead

router = APIRouter()


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user and organization."""
    # Check if email already exists
    stmt = select(User).where(User.email == payload.email)
    existing = await db.execute(stmt)
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )

    # Check if org slug already exists
    stmt = select(Organization).where(Organization.slug == payload.org_slug)
    existing_org = await db.execute(stmt)
    if existing_org.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An organization with this slug already exists.",
        )

    # Create organization
    org = Organization(name=payload.org_name, slug=payload.org_slug, currency=payload.currency)
    db.add(org)
    await db.flush()

    # Create user with hashed password
    user = User(
        name=payload.name,
        email=payload.email,
        role="admin",
        password_hash=get_password_hash(payload.password),
        organization_id=org.id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    await db.refresh(org)

    # Generate JWT
    token = create_access_token(subject=str(user.id), extra_claims={"org_id": str(org.id)})

    return TokenResponse(
        access_token=token,
        user=AuthUserRead.model_validate(user),
        organization=AuthOrgRead.model_validate(org),
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user with email and password."""
    stmt = select(User).where(User.email == payload.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # Load the user's organization
    stmt = select(Organization).where(Organization.id == user.organization_id)
    result = await db.execute(stmt)
    org = result.scalar_one_or_none()

    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User's organization not found.",
        )

    token = create_access_token(subject=str(user.id), extra_claims={"org_id": str(org.id)})

    return TokenResponse(
        access_token=token,
        user=AuthUserRead.model_validate(user),
        organization=AuthOrgRead.model_validate(org),
    )


@router.get("/me", response_model=TokenResponse)
async def get_me(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: AsyncSession = Depends(get_db),
):
    """Validate token and return current user + organization."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header.",
        )

    token = authorization[7:].strip()
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token.")

    stmt = select(User).where(User.id == UUID(user_id_str))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")

    stmt = select(Organization).where(Organization.id == user.organization_id)
    result = await db.execute(stmt)
    org = result.scalar_one_or_none()

    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")

    return TokenResponse(
        access_token=token,
        user=AuthUserRead.model_validate(user),
        organization=AuthOrgRead.model_validate(org),
    )
