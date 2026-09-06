"""Shipment Business Logic Service."""
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID, uuid4
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.shipment import Shipment, ShipmentEvent
from app.repositories.shipment import shipment_repo
from app.repositories.order import order_repo
from app.schemas.shipment import (
    ShipmentCreate,
    ShipmentEventCreate,
    ShipmentStatusUpdate,
)


class ShipmentService:
    async def create_shipment(
        self, db: AsyncSession, organization_id: UUID, obj_in: ShipmentCreate
    ) -> Shipment:
        # Validate order exists in tenant
        order = await order_repo.get_order_detail(
            db, organization_id=organization_id, order_id=obj_in.order_id
        )
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sales order not found in this organization.",
            )

        if order.status not in ["CONFIRMED", "FULFILLED"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot create shipment for order in '{order.status}' status. Order must be CONFIRMED or FULFILLED.",
            )

        # Generate unique shipment number
        shipment_number = f"SHP-{str(uuid4())[:6].upper()}"

        # Resolve tracking number if not provided
        carrier_prefixes = {
            "Blue Dart": "BD",
            "Delhivery": "DLH",
            "DTDC": "DTDC",
            "Gati KWE": "GATI",
            "India Post": "IP",
        }
        prefix = carrier_prefixes.get(obj_in.carrier, "TRK")
        tracking_number = (
            obj_in.tracking_number.strip()
            if obj_in.tracking_number and obj_in.tracking_number.strip()
            else f"{prefix}-{str(uuid4())[:8].upper()}"
        )

        # Resolve destination and origin addresses
        dest_addr = (
            obj_in.destination_address.strip()
            if obj_in.destination_address and obj_in.destination_address.strip()
            else (
                order.customer.shipping_address
                or order.customer.billing_address
                or f"Consignee {order.customer.name}"
            )
        )

        origin_addr = (
            obj_in.origin_address.strip()
            if obj_in.origin_address and obj_in.origin_address.strip()
            else (
                f"{order.warehouse.name} ({order.warehouse.location})"
                if order.warehouse and order.warehouse.location
                else "Central Fulfillment Facility"
            )
        )

        shipment = Shipment(
            organization_id=organization_id,
            order_id=order.id,
            shipment_number=shipment_number,
            carrier=obj_in.carrier,
            tracking_number=tracking_number,
            status="PENDING",
            shipping_cost=obj_in.shipping_cost,
            origin_address=origin_addr,
            destination_address=dest_addr,
            estimated_delivery=obj_in.estimated_delivery,
            notes=obj_in.notes,
        )

        initial_event = ShipmentEvent(
            status="PENDING",
            location=origin_addr,
            description=f"Shipment manifested and assigned to {obj_in.carrier} (AWB: {tracking_number})",
        )
        shipment.events.append(initial_event)
        db.add(shipment)
        await db.commit()

        return await shipment_repo.get_shipment_detail(
            db, organization_id=organization_id, shipment_id=shipment.id
        )

    async def get_shipment(
        self, db: AsyncSession, organization_id: UUID, shipment_id: UUID
    ) -> Shipment:
        shipment = await shipment_repo.get_shipment_detail(
            db, organization_id=organization_id, shipment_id=shipment_id
        )
        if not shipment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shipment not found in this organization.",
            )
        return shipment

    async def list_shipments(
        self,
        db: AsyncSession,
        organization_id: UUID,
        status_filter: Optional[str] = None,
        order_id: Optional[UUID] = None,
    ) -> List[Shipment]:
        return await shipment_repo.list_shipments(
            db, organization_id=organization_id, status=status_filter, order_id=order_id
        )

    async def dispatch_shipment(
        self,
        db: AsyncSession,
        organization_id: UUID,
        shipment_id: UUID,
        update_in: Optional[ShipmentStatusUpdate] = None,
    ) -> Shipment:
        shipment = await self.get_shipment(db, organization_id, shipment_id)
        if shipment.status != "PENDING":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot dispatch shipment in '{shipment.status}' status. Must be 'PENDING'.",
            )

        location = (
            update_in.location
            if update_in and update_in.location
            else shipment.origin_address or "Dispatch Hub"
        )
        desc = (
            update_in.description
            if update_in and update_in.description
            else f"Handed over to {shipment.carrier} linehaul transit."
        )

        shipment.status = "IN_TRANSIT"
        await db.commit()

        event = ShipmentEvent(
            shipment_id=shipment.id,
            status="IN_TRANSIT",
            location=location,
            description=desc,
        )
        db.add(event)
        await db.commit()

        return await shipment_repo.get_shipment_detail(
            db, organization_id=organization_id, shipment_id=shipment.id
        )

    async def mark_out_for_delivery(
        self,
        db: AsyncSession,
        organization_id: UUID,
        shipment_id: UUID,
        update_in: Optional[ShipmentStatusUpdate] = None,
    ) -> Shipment:
        shipment = await self.get_shipment(db, organization_id, shipment_id)
        if shipment.status not in ["IN_TRANSIT", "PENDING"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot mark shipment out for delivery in '{shipment.status}' status.",
            )

        location = (
            update_in.location
            if update_in and update_in.location
            else "Destination Delivery Center"
        )
        desc = (
            update_in.description
            if update_in and update_in.description
            else "Package out for final delivery with local courier agent."
        )

        shipment.status = "OUT_FOR_DELIVERY"
        await db.commit()

        event = ShipmentEvent(
            shipment_id=shipment.id,
            status="OUT_FOR_DELIVERY",
            location=location,
            description=desc,
        )
        db.add(event)
        await db.commit()

        return await shipment_repo.get_shipment_detail(
            db, organization_id=organization_id, shipment_id=shipment.id
        )

    async def deliver_shipment(
        self,
        db: AsyncSession,
        organization_id: UUID,
        shipment_id: UUID,
        update_in: Optional[ShipmentStatusUpdate] = None,
    ) -> Shipment:
        shipment = await self.get_shipment(db, organization_id, shipment_id)
        if shipment.status in ["DELIVERED", "CANCELLED"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot mark delivered: shipment is already '{shipment.status}'.",
            )

        location = (
            update_in.location
            if update_in and update_in.location
            else shipment.destination_address
        )
        desc = (
            update_in.description
            if update_in and update_in.description
            else "Package successfully delivered to recipient and POD signed."
        )

        shipment.status = "DELIVERED"
        shipment.actual_delivery = datetime.now(timezone.utc)
        await db.commit()

        event = ShipmentEvent(
            shipment_id=shipment.id,
            status="DELIVERED",
            location=location,
            description=desc,
        )
        db.add(event)
        await db.commit()

        from app.services.audit import audit_service
        from app.services.notification import notification_service

        await audit_service.log_action(
            db,
            organization_id=organization_id,
            action="SHIPMENT_DELIVERED",
            entity_type="Shipment",
            entity_id=shipment.id,
            entity_name=shipment.tracking_number,
            details=f"Consignment delivered via {shipment.carrier} to {location}. Signed POD recorded.",
        )
        await notification_service.create_notification(
            db,
            organization_id=organization_id,
            title=f"Shipment Delivered: #{shipment.tracking_number}",
            message=f"Consignment #{shipment.tracking_number} delivered via {shipment.carrier}.",
            type="SUCCESS",
            link="/shipments",
        )

        return await shipment_repo.get_shipment_detail(
            db, organization_id=organization_id, shipment_id=shipment.id
        )

    async def cancel_shipment(
        self,
        db: AsyncSession,
        organization_id: UUID,
        shipment_id: UUID,
        update_in: Optional[ShipmentStatusUpdate] = None,
    ) -> Shipment:
        shipment = await self.get_shipment(db, organization_id, shipment_id)
        if shipment.status == "DELIVERED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Delivered shipment cannot be cancelled.",
            )
        if shipment.status == "CANCELLED":
            return shipment

        location = (
            update_in.location
            if update_in and update_in.location
            else "Logistics Operations Desk"
        )
        desc = (
            update_in.description
            if update_in and update_in.description
            else "Shipment delivery cancelled and delivery order voided."
        )

        shipment.status = "CANCELLED"
        await db.commit()

        event = ShipmentEvent(
            shipment_id=shipment.id,
            status="CANCELLED",
            location=location,
            description=desc,
        )
        db.add(event)
        await db.commit()

        return await shipment_repo.get_shipment_detail(
            db, organization_id=organization_id, shipment_id=shipment.id
        )

    async def add_checkpoint_event(
        self,
        db: AsyncSession,
        organization_id: UUID,
        shipment_id: UUID,
        event_in: ShipmentEventCreate,
    ) -> ShipmentEvent:
        shipment = await self.get_shipment(db, organization_id, shipment_id)
        return await shipment_repo.add_event(
            db,
            shipment_id=shipment.id,
            status=event_in.status,
            location=event_in.location,
            description=event_in.description,
        )


shipment_service = ShipmentService()
