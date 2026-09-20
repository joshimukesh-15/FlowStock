"""FastAPI Route Dependencies for Tenant, User Authentication, and RBAC Context."""
from typing import List, Optional
from uuid import UUID
from fastapi import Depends, Header, HTTPException, status, Cookie
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.repositories.organization import organization_repo
from app.repositories.user import user_repo


async def get_current_tenant_id(
    x_organization_id: Optional[str] = Header(None, alias="X-Organization-Id"),
    db: AsyncSession = Depends(get_db),
) -> UUID:
    """Extract and validate tenant ID from HTTP header, with fallback to primary Acme tenant."""
    if x_organization_id:
        try:
            tenant_uuid = UUID(x_organization_id)
            org = await organization_repo.get_by_id(db, tenant_uuid)
            if org:
                return org.id
        except (ValueError, TypeError):
            pass

    # Prefer 'acme' demo tenant as standard default
    acme = await organization_repo.get_by_slug(db, "acme")
    if acme:
        return acme.id

    # Fallback to first available
    orgs = await organization_repo.list_all(db)
    if orgs:
        return orgs[0].id

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="No active organization found.",
    )


async def get_current_user(
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    access_token_cookie: Optional[str] = Cookie(None, alias="access_token"),
    tenant_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Authenticate and resolve the current tenant user.
    1. If Authorization Bearer token or HttpOnly access_token cookie is provided, decode JWT and look up user.
    2. If X-User-Id is provided, look up user and strictly verify tenant ownership (anti-masquerading).
    3. If X-User-Role is provided, look up or instantiate a user with that role in the tenant.
    4. Otherwise, default to the primary administrator of the tenant.
    """
    # 1. Bearer token or HttpOnly Cookie
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
    elif access_token_cookie:
        token = access_token_cookie.strip()

    if token:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id_str = payload.get("sub")
            if user_id_str:
                user = await user_repo.get_by_id(db, UUID(user_id_str))
                if user:
                    if user.organization_id != tenant_id:
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="Cross-tenant token masquerading detected: user does not belong to specified tenant.",
                        )
                    return user
        except (JWTError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication credentials.",
            )

    # 2. X-User-Id
    if x_user_id:
        try:
            user_uuid = UUID(x_user_id)
            user = await user_repo.get_by_id(db, user_uuid)
            if user:
                if user.organization_id != tenant_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Cross-tenant access forbidden: user does not belong to target organization.",
                    )
                return user
            # Fallback gracefully to tenant's primary user if ID does not exist in DB (stale ID from previous seed)
            stmt = select(User).where(User.organization_id == tenant_id)
            res = await db.execute(stmt)
            users = list(res.scalars().all())
            if users:
                admin_user = next((u for u in users if u.role == "admin"), users[0])
                return admin_user
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User '{x_user_id}' not found.",
            )
        except ValueError:
            pass

    # 3. X-User-Role (explicit role simulation or test mocking)
    if x_user_role:
        stmt = select(User).where(
            User.organization_id == tenant_id,
            User.role == x_user_role.lower(),
        )
        res = await db.execute(stmt)
        matched_user = res.scalar_one_or_none()
        if matched_user:
            return matched_user
        # If no seeded user exists with this role, return an ephemeral representation
        # for testing role restrictions
        return User(
            id=UUID("00000000-0000-0000-0000-000000000099"),
            name=f"Demo {x_user_role.capitalize()}",
            email=f"{x_user_role.lower()}@flowstock.local",
            role=x_user_role.lower(),
            organization_id=tenant_id,
        )

    # 4. Default: First user of tenant (typically admin)
    stmt = select(User).where(User.organization_id == tenant_id)
    res = await db.execute(stmt)
    users = list(res.scalars().all())
    if users:
        admin_user = next((u for u in users if u.role == "admin"), users[0])
        return admin_user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No active user found for tenant.",
    )


def require_roles(allowed_roles: List[str]):
    """FastAPI dependency factory to enforce RBAC permissions."""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role '{current_user.role}'. Required roles: {allowed_roles}",
            )
        return current_user
    return role_checker


# Standard RBAC convenience dependencies
require_admin = require_roles(["admin"])
require_warehouse_or_admin = require_roles(["admin", "warehouse_manager"])
require_sales_or_admin = require_roles(["admin", "sales_rep"])
require_operator = require_roles(["admin", "warehouse_manager", "sales_rep"])
require_viewer_or_above = require_roles(["admin", "warehouse_manager", "sales_rep", "viewer"])
