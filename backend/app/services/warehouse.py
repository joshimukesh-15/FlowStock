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
from app.schemas.warehouse import WarehouseCreate
from app.schemas.transfer import StockTransferCreate


class WarehouseService:
    # --- Warehouses ---
    async def list_warehouses(self, db: AsyncSession, organization_id: UUID) -> List[Warehouse]:
        return await warehouse_repo.list_by_tenant(db, organization_id=organization_id)

    async def get_warehouse(self, db: AsyncSession, organization_id: UUID, id: UUID) -> Warehouse:
        wh = await warehouse_repo.get_by_tenant(db, id=id, organization_id=organization_id)
        if not wh:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Warehouse with id '{id}' not found.",
            )
        return wh

    async def create_warehouse(
        self, db: AsyncSession, organization_id: UUID, obj_in: WarehouseCreate
    ) -> Warehouse:
        existing = await warehouse_repo.get_by_code(
            db, organization_id=organization_id, code=obj_in.code
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Warehouse with code '{obj_in.code}' already exists in this organization.",
            )
        return await warehouse_repo.create_warehouse(
            db, obj_in=obj_in, organization_id=organization_id
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
