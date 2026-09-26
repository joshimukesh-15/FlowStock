"""Warehouse & Inter-Warehouse Transfer Service."""
from typing import List
from uuid import UUID, uuid4
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.warehouse import Warehouse
from app.models.transfer import StockTransfer
from app.repositories.warehouse import warehouse_repo
from app.repositories.transfer import transfer_repo
from app.repositories.catalog import product_repo
from app.repositories.inventory import inventory_repo
from app.schemas.warehouse import WarehouseCreate, WarehouseUpdate, WarehouseRead
from app.schemas.transfer import StockTransferCreate


class WarehouseService:
    # --- Warehouses ---
    async def list_warehouses(self, db: AsyncSession, organization_id: UUID) -> List[WarehouseRead]:
        warehouses = await warehouse_repo.list_by_tenant(db, organization_id=organization_id)
        stock_map = await warehouse_repo.get_warehouse_stock_map(db, organization_id=organization_id)

        result: List[WarehouseRead] = []
        for wh in warehouses:
            curr = max(0, stock_map.get(wh.id, 0))
            cap = wh.capacity if wh.capacity and wh.capacity > 0 else 2500
            pct = round((curr / cap) * 100.0, 1)
            result.append(
                WarehouseRead(
                    id=wh.id,
                    organization_id=wh.organization_id,
                    name=wh.name,
                    code=wh.code,
                    location=wh.location,
                    capacity=cap,
                    is_default=wh.is_default,
                    current_stock=curr,
                    utilization_pct=pct,
                    created_at=wh.created_at,
                    updated_at=wh.updated_at,
                )
            )
        return result

    async def get_warehouse_model(self, db: AsyncSession, organization_id: UUID, id: UUID) -> Warehouse:
        wh = await warehouse_repo.get_by_tenant(db, id=id, organization_id=organization_id)
        if not wh:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Warehouse with id '{id}' not found.",
            )
        return wh

    async def get_warehouse(self, db: AsyncSession, organization_id: UUID, id: UUID) -> WarehouseRead:
        wh = await self.get_warehouse_model(db, organization_id, id)
        stock_map = await warehouse_repo.get_warehouse_stock_map(db, organization_id=organization_id)
        curr = max(0, stock_map.get(wh.id, 0))
        cap = wh.capacity if wh.capacity and wh.capacity > 0 else 2500
        pct = round((curr / cap) * 100.0, 1)
        return WarehouseRead(
            id=wh.id,
            organization_id=wh.organization_id,
            name=wh.name,
            code=wh.code,
            location=wh.location,
            capacity=cap,
            is_default=wh.is_default,
            current_stock=curr,
            utilization_pct=pct,
            created_at=wh.created_at,
            updated_at=wh.updated_at,
        )

    async def create_warehouse(
        self, db: AsyncSession, organization_id: UUID, obj_in: WarehouseCreate
    ) -> WarehouseRead:
        existing = await warehouse_repo.get_by_code(
            db, organization_id=organization_id, code=obj_in.code
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Warehouse with code '{obj_in.code}' already exists in this organization.",
            )
        wh = await warehouse_repo.create_warehouse(
            db, obj_in=obj_in, organization_id=organization_id
        )
        cap = wh.capacity if wh.capacity and wh.capacity > 0 else 2500
        return WarehouseRead(
            id=wh.id,
            organization_id=wh.organization_id,
            name=wh.name,
            code=wh.code,
            location=wh.location,
            capacity=cap,
            is_default=wh.is_default,
            current_stock=0,
            utilization_pct=0.0,
            created_at=wh.created_at,
            updated_at=wh.updated_at,
        )

    async def update_warehouse(
        self, db: AsyncSession, organization_id: UUID, id: UUID, obj_in: WarehouseUpdate
    ) -> WarehouseRead:
        wh = await self.get_warehouse_model(db, organization_id, id)
        if obj_in.code and obj_in.code.strip().upper() != wh.code:
            existing = await warehouse_repo.get_by_code(
                db, organization_id=organization_id, code=obj_in.code
            )
            if existing and existing.id != wh.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Warehouse with code '{obj_in.code}' already exists in this organization.",
                )
        updated_wh = await warehouse_repo.update_warehouse(db, warehouse=wh, obj_in=obj_in)
        stock_map = await warehouse_repo.get_warehouse_stock_map(db, organization_id=organization_id)
        curr = max(0, stock_map.get(updated_wh.id, 0))
        cap = updated_wh.capacity if updated_wh.capacity and updated_wh.capacity > 0 else 2500
        pct = round((curr / cap) * 100.0, 1)
        return WarehouseRead(
            id=updated_wh.id,
            organization_id=updated_wh.organization_id,
            name=updated_wh.name,
            code=updated_wh.code,
            location=updated_wh.location,
            capacity=cap,
            is_default=updated_wh.is_default,
            current_stock=curr,
            utilization_pct=pct,
            created_at=updated_wh.created_at,
            updated_at=updated_wh.updated_at,
        )

    # --- Transfer State Machine ---
    async def list_transfers(self, db: AsyncSession, organization_id: UUID) -> List[StockTransfer]:
        return await transfer_repo.list_transfers(db, organization_id=organization_id)

    async def create_transfer(
        self, db: AsyncSession, organization_id: UUID, obj_in: StockTransferCreate
    ) -> StockTransfer:
        if obj_in.source_warehouse_id == obj_in.destination_warehouse_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Source and destination warehouses cannot be the same.",
            )

        # Validate source and destination warehouses
        src_wh = await self.get_warehouse(db, organization_id, obj_in.source_warehouse_id)
        dest_wh = await self.get_warehouse(db, organization_id, obj_in.destination_warehouse_id)

        # Validate product
        product = await product_repo.get_by_tenant(
            db, id=obj_in.product_id, organization_id=organization_id
        )
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found in this organization.",
            )

        transfer_number = f"TRF-{str(uuid4())[:6].upper()}"

        transfer = StockTransfer(
            organization_id=organization_id,
            transfer_number=transfer_number,
            source_warehouse_id=src_wh.id,
            destination_warehouse_id=dest_wh.id,
            product_id=product.id,
            quantity=obj_in.quantity,
            status="REQUESTED",
            notes=obj_in.notes,
        )
        db.add(transfer)
        await db.commit()
        await db.refresh(transfer)
        return await transfer_repo.get_by_tenant(db, id=transfer.id, organization_id=organization_id)

    async def dispatch_transfer(
        self, db: AsyncSession, organization_id: UUID, transfer_id: UUID
    ) -> StockTransfer:
        transfer = await transfer_repo.get_by_tenant(
            db, id=transfer_id, organization_id=organization_id
        )
        if not transfer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Stock transfer not found.",
            )
        if transfer.status != "REQUESTED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot dispatch transfer in '{transfer.status}' status. Must be 'REQUESTED'.",
            )

        # Verify source warehouse has sufficient stock
        source_stock = await inventory_repo.get_stock_level(
            db,
            organization_id=organization_id,
            product_id=transfer.product_id,
            warehouse_id=transfer.source_warehouse_id,
        )
        if source_stock < transfer.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock in {transfer.source_warehouse.name}. "
                    f"Available: {source_stock}, Requested transfer: {transfer.quantity}."
                ),
            )

        # Append OUT movement from source warehouse
        await inventory_repo.record_movement(
            db,
            organization_id=organization_id,
            product_id=transfer.product_id,
            warehouse_id=transfer.source_warehouse_id,
            movement_type="OUT",
            quantity_change=-transfer.quantity,
            reference=f"Transfer {transfer.transfer_number} Dispatched",
            notes=f"Dispatched to {transfer.destination_warehouse.name}",
        )

        transfer.status = "IN_TRANSIT"
        db.add(transfer)
        await db.commit()
        await db.refresh(transfer)
        return transfer

    async def receive_transfer(
        self, db: AsyncSession, organization_id: UUID, transfer_id: UUID
    ) -> StockTransfer:
        transfer = await transfer_repo.get_by_tenant(
            db, id=transfer_id, organization_id=organization_id
        )
        if not transfer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Stock transfer not found.",
            )
        if transfer.status != "IN_TRANSIT":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot receive transfer in '{transfer.status}' status. Must be 'IN_TRANSIT'.",
            )

        # Append IN movement to destination warehouse
        await inventory_repo.record_movement(
            db,
            organization_id=organization_id,
            product_id=transfer.product_id,
            warehouse_id=transfer.destination_warehouse_id,
            movement_type="IN",
            quantity_change=+transfer.quantity,
            reference=f"Transfer {transfer.transfer_number} Received",
            notes=f"Received from {transfer.source_warehouse.name}",
        )

        transfer.status = "RECEIVED"
        db.add(transfer)
        await db.commit()
        await db.refresh(transfer)
        return transfer

    async def cancel_transfer(
        self, db: AsyncSession, organization_id: UUID, transfer_id: UUID
    ) -> StockTransfer:
        transfer = await transfer_repo.get_by_tenant(
            db, id=transfer_id, organization_id=organization_id
        )
        if not transfer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Stock transfer not found.",
            )
        if transfer.status != "REQUESTED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel transfer in '{transfer.status}' status. Only 'REQUESTED' transfers can be cancelled.",
            )

        transfer.status = "CANCELLED"
        db.add(transfer)
        await db.commit()
        await db.refresh(transfer)
        return transfer


warehouse_service = WarehouseService()
