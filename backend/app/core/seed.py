"""Automatic Seed Data for Enterprise Demonstration with Samsung Multi-Tenant Ecosystem."""
from sqlalchemy import text, select
from app.core.database import get_active_engine, AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.base import Base
from app.models.organization import Organization
from app.models.user import User
from app.models.catalog import Category, Product
from app.models.warehouse import Warehouse
from app.models.inventory import InventoryMovement
from app.models.transfer import StockTransfer
from app.models.customer import Customer
from app.models.order import SalesOrder, OrderItem
from app.models.supplier import Supplier
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
from app.models.shipment import Shipment, ShipmentEvent
from app.models.invoice import Invoice, InvoiceItem, Payment
from app.repositories.organization import organization_repo
from app.repositories.user import user_repo
from app.repositories.catalog import category_repo, product_repo
from app.repositories.warehouse import warehouse_repo
from app.repositories.inventory import inventory_repo
from app.repositories.transfer import transfer_repo
from app.repositories.customer import customer_repo
from app.repositories.order import order_repo
from app.repositories.supplier import supplier_repo
from app.repositories.purchase_order import purchase_order_repo
from app.repositories.shipment import shipment_repo
from app.repositories.invoice import invoice_repo, payment_repo
from app.repositories.audit import audit_repo
from app.repositories.notification import notification_repo
from app.services.order import order_service
from app.services.purchase_order import purchase_order_service
from app.services.shipment import shipment_service
from app.services.invoice import invoice_service
from app.services.audit import audit_service
from app.services.notification import notification_service
from app.schemas.organization import OrganizationCreate, UserCreate
from app.schemas.catalog import CategoryCreate, ProductCreate
from app.schemas.warehouse import WarehouseCreate
from app.schemas.customer import CustomerCreate
from app.schemas.order import SalesOrderCreate, OrderItemCreate
from app.schemas.supplier import SupplierCreate
from app.schemas.purchase_order import PurchaseOrderCreate, PurchaseOrderItemCreate
from app.schemas.shipment import ShipmentCreate, ShipmentStatusUpdate
from app.schemas.invoice import InvoiceCreate, InvoiceItemCreate, PaymentCreate
from app.schemas.audit import AuditLogCreate
from app.schemas.notification import NotificationCreate


async def seed_demo_data():
    """Ensure database schema exists and seed Samsung multi-tenant demo organizations, catalog, warehouses & stock."""
    engine = await get_active_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        try:
            if "sqlite" in engine.dialect.name:
                pragma_res = await conn.execute(text("PRAGMA table_info(users)"))
                cols = [r[1] for r in pragma_res.fetchall()]
                if "password_hash" not in cols:
                    await conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"))
                pragma_wh = await conn.execute(text("PRAGMA table_info(warehouses)"))
                wh_cols = [r[1] for r in pragma_wh.fetchall()]
                if wh_cols and "capacity" not in wh_cols:
                    await conn.execute(text("ALTER TABLE warehouses ADD COLUMN capacity INTEGER DEFAULT 2500"))
                if wh_cols and "location" not in wh_cols:
                    await conn.execute(text("ALTER TABLE warehouses ADD COLUMN location VARCHAR(150) DEFAULT 'Default Facility'"))
            elif "postgresql" in engine.dialect.name:
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)"))
                await conn.execute(text("ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 2500"))
                await conn.execute(text("ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS location VARCHAR(150) DEFAULT 'Default Facility'"))
            default_hash = get_password_hash("admin123")
            await conn.execute(
                text("UPDATE users SET password_hash = :hash WHERE password_hash IS NULL"),
                {"hash": default_hash},
            )
        except Exception:
            pass

    async with AsyncSessionLocal() as session:
        default_hash = get_password_hash("admin123")

        # --- Purge legacy Acme and Apex data if present ---
        legacy_res = await session.execute(
            select(Organization).where(Organization.slug.in_(["acme", "apex"]))
        )
        for legacy_org in legacy_res.scalars().all():
            await session.delete(legacy_org)
        await session.commit()

        # =========================================================================
        # 1. SEED TENANT 1: Samsung Electronics Ltd (slug: samsung)
        # =========================================================================
        samsung = await organization_repo.get_by_slug(session, "samsung")
        if not samsung:
            samsung = await organization_repo.create(
                session,
                obj_in=OrganizationCreate(
                    name="Samsung Electronics Ltd",
                    slug="samsung",
                    currency="INR",
                ),
            )
        elif samsung.name != "Samsung Electronics Ltd" or samsung.currency != "INR":
            samsung.name = "Samsung Electronics Ltd"
            samsung.currency = "INR"
            await session.commit()

        # Seed RBAC users for Samsung Electronics
        samsung_users = [
            ("Alice Admin", "alice@samsung.com", "admin"),
            ("Ramesh Warehouse", "ramesh@samsung.com", "warehouse_manager"),
            ("Vikram Sales", "vikram@samsung.com", "sales_rep"),
            ("Pooja Auditor", "pooja@samsung.com", "viewer"),
        ]
        existing_samsung_users = await user_repo.list_by_organization(session, samsung.id)
        existing_samsung_emails = {u.email for u in existing_samsung_users}
        for u_name, u_email, u_role in samsung_users:
            if u_email not in existing_samsung_emails:
                u = User(
                    name=u_name,
                    email=u_email,
                    role=u_role,
                    password_hash=default_hash,
                    organization_id=samsung.id,
                )
                session.add(u)
        await session.commit()

        # Warehouses for Samsung Electronics
        wh_sms_noida = await warehouse_repo.get_by_code(session, organization_id=samsung.id, code="WH-SMS-01")
        if not wh_sms_noida:
            wh_sms_noida = await warehouse_repo.create_warehouse(
                session,
                obj_in=WarehouseCreate(
                    name="Samsung Noida Mega Plant & Central DC",
                    code="WH-SMS-01",
                    location="B-1, Sector 81, Phase II, Noida, UP",
                    capacity=1000,
                    is_default=True,
                ),
                organization_id=samsung.id,
            )

        wh_sms_south = await warehouse_repo.get_by_code(session, organization_id=samsung.id, code="WH-SMS-02")
        if not wh_sms_south:
            wh_sms_south = await warehouse_repo.create_warehouse(
                session,
                obj_in=WarehouseCreate(
                    name="Samsung Sriperumbudur Regional Depot",
                    code="WH-SMS-02",
                    location="Plot A-2, SIPCOT Hi-Tech SEZ, Sriperumbudur, TN",
                    capacity=500,
                    is_default=False,
                ),
                organization_id=samsung.id,
            )

        wh_sms_west = await warehouse_repo.get_by_code(session, organization_id=samsung.id, code="WH-SMS-03")
        if not wh_sms_west:
            wh_sms_west = await warehouse_repo.create_warehouse(
                session,
                obj_in=WarehouseCreate(
                    name="Samsung Bhiwandi Logistics Hub",
                    code="WH-SMS-03",
                    location="Mankoli Integrated Logistics Corridor, Bhiwandi, MH",
                    capacity=250,
                    is_default=False,
                ),
                organization_id=samsung.id,
            )

        # Categories for Samsung Electronics
        cat_mobile = await category_repo.get_by_name(session, organization_id=samsung.id, name="Smartphones & Foldables")
        if not cat_mobile:
            cat_mobile = await category_repo.create(
                session,
                obj_in=CategoryCreate(name="Smartphones & Foldables", description="Galaxy S Series, Z Fold & Flip flagships"),
                organization_id=samsung.id,
            )

        cat_display = await category_repo.get_by_name(session, organization_id=samsung.id, name="Neo QLED Displays & Smart TVs")
        if not cat_display:
            cat_display = await category_repo.create(
                session,
                obj_in=CategoryCreate(name="Neo QLED Displays & Smart TVs", description="8K/4K Quantum Matrix displays and gaming monitors"),
                organization_id=samsung.id,
            )

        cat_appl = await category_repo.get_by_name(session, organization_id=samsung.id, name="Bespoke AI Home Appliances")
        if not cat_appl:
            cat_appl = await category_repo.create(
                session,
                obj_in=CategoryCreate(name="Bespoke AI Home Appliances", description="AI WindFree Inverter ACs and smart refrigerators"),
                organization_id=samsung.id,
            )

        cat_acc = await category_repo.get_by_name(session, organization_id=samsung.id, name="Mobile Peripherals & Accessories")
        if not cat_acc:
            cat_acc = await category_repo.create(
                session,
                obj_in=CategoryCreate(name="Mobile Peripherals & Accessories", description="OEM charging adapters and wireless audio peripherals"),
                organization_id=samsung.id,
            )

        # Products for Samsung Electronics
        p_s24 = await product_repo.get_by_sku(session, organization_id=samsung.id, sku="SMS-S24U-512")
        if not p_s24:
            p_s24 = await product_repo.create_product(
                session,
                obj_in=ProductCreate(
                    name="Samsung Galaxy S24 Ultra 5G (512GB Titanium Black)",
                    sku="SMS-S24U-512",
                    description="AI flagship smartphone with Snapdragon 8 Gen 3, Titanium frame, 200MP camera & S-Pen",
                    unit="pcs",
                    price=139999.00,
                    cost_price=105000.00,
                    reorder_point=25,
                    category_id=cat_mobile.id,
                ),
                organization_id=samsung.id,
            )

        p_fold6 = await product_repo.get_by_sku(session, organization_id=samsung.id, sku="SMS-ZF6-256")
        if not p_fold6:
            p_fold6 = await product_repo.create_product(
                session,
                obj_in=ProductCreate(
                    name="Samsung Galaxy Z Fold6 5G (256GB Silver Shadow)",
                    sku="SMS-ZF6-256",
                    description="Dual-display AI foldable smartphone with Armor Aluminum hinge and IP48 water resistance",
                    unit="pcs",
                    price=164999.00,
                    cost_price=125000.00,
                    reorder_point=15,
                    category_id=cat_mobile.id,
                ),
                organization_id=samsung.id,
            )

        p_qled = await product_repo.get_by_sku(session, organization_id=samsung.id, sku="SMS-QLED-65")
        if not p_qled:
            p_qled = await product_repo.create_product(
                session,
                obj_in=ProductCreate(
                    name="Samsung 65\" Neo QLED 8K Smart TV (QN900D)",
                    sku="SMS-QLED-65",
                    description="Infinity Air Design with NQ8 AI Gen3 Processor and Quantum Matrix Pro",
                    unit="pcs",
                    price=279990.00,
                    cost_price=195000.00,
                    reorder_point=10,
                    category_id=cat_display.id,
                ),
                organization_id=samsung.id,
            )

        p_ac = await product_repo.get_by_sku(session, organization_id=samsung.id, sku="SMS-AC-15T")
        if not p_ac:
            p_ac = await product_repo.create_product(
                session,
                obj_in=ProductCreate(
                    name="Samsung Bespoke AI 1.5 Ton 5-Star WindFree Inverter AC",
                    sku="SMS-AC-15T",
                    description="Gentle cooling with 23,000 micro-holes and SmartThings AI Energy optimization",
                    unit="pcs",
                    price=48990.00,
                    cost_price=34500.00,
                    reorder_point=20,
                    category_id=cat_appl.id,
                ),
                organization_id=samsung.id,
            )

        p_chg = await product_repo.get_by_sku(session, organization_id=samsung.id, sku="SMS-ACC-45W")
        if not p_chg:
            p_chg = await product_repo.create_product(
                session,
                obj_in=ProductCreate(
                    name="Samsung 45W USB-C Super Fast Charger 2.0",
                    sku="SMS-ACC-45W",
                    description="Official Samsung Power Delivery 3.0 Type-C fast wall adapter",
                    unit="pcs",
                    price=2999.00,
                    cost_price=1650.00,
                    reorder_point=30,
                    category_id=cat_acc.id,
                ),
                organization_id=samsung.id,
            )

        p_buds = await product_repo.get_by_sku(session, organization_id=samsung.id, sku="SMS-BUDS-3P")
        if not p_buds:
            p_buds = await product_repo.create_product(
                session,
                obj_in=ProductCreate(
                    name="Samsung Galaxy Buds3 Pro (Silver)",
                    sku="SMS-BUDS-3P",
                    description="Hi-Fi wireless earbuds with Blade Lights and adaptive ANC",
                    unit="pcs",
                    price=19999.00,
                    cost_price=12000.00,
                    reorder_point=50,
                    category_id=cat_acc.id,
                ),
                organization_id=samsung.id,
            )

        # Initial Stock Movements for Samsung Electronics in WH-SMS-01 (Noida)
        if (await inventory_repo.get_stock_level(session, organization_id=samsung.id, product_id=p_s24.id, warehouse_id=wh_sms_noida.id)) < 50:
            await inventory_repo.record_movement(
                session,
                organization_id=samsung.id,
                product_id=p_s24.id,
                warehouse_id=wh_sms_noida.id,
                movement_type="IN",
                quantity_change=150,
                reference="Noida Plant Production Lot #S24U-088",
            )

        if (await inventory_repo.get_stock_level(session, organization_id=samsung.id, product_id=p_fold6.id, warehouse_id=wh_sms_noida.id)) < 30:
            await inventory_repo.record_movement(
                session,
                organization_id=samsung.id,
                product_id=p_fold6.id,
                warehouse_id=wh_sms_noida.id,
                movement_type="IN",
                quantity_change=80,
                reference="Import Shipment Korea Gumi Factory",
            )

        if (await inventory_repo.get_stock_level(session, organization_id=samsung.id, product_id=p_qled.id, warehouse_id=wh_sms_noida.id)) < 20:
            await inventory_repo.record_movement(
                session,
                organization_id=samsung.id,
                product_id=p_qled.id,
                warehouse_id=wh_sms_noida.id,
                movement_type="IN",
                quantity_change=40,
                reference="Display Manufacturing Batch #QN900D",
            )

        if (await inventory_repo.get_stock_level(session, organization_id=samsung.id, product_id=p_ac.id, warehouse_id=wh_sms_noida.id)) < 25:
            await inventory_repo.record_movement(
                session,
                organization_id=samsung.id,
                product_id=p_ac.id,
                warehouse_id=wh_sms_noida.id,
                movement_type="IN",
                quantity_change=75,
                reference="Sriperumbudur Factory Inbound",
            )

        if (await inventory_repo.get_stock_level(session, organization_id=samsung.id, product_id=p_chg.id, warehouse_id=wh_sms_noida.id)) < 50:
            await inventory_repo.record_movement(
                session,
                organization_id=samsung.id,
                product_id=p_chg.id,
                warehouse_id=wh_sms_noida.id,
                movement_type="IN",
                quantity_change=200,
                reference="Direct Factory Accessory Inbound",
            )

        if (await inventory_repo.get_stock_level(session, organization_id=samsung.id, product_id=p_buds.id, warehouse_id=wh_sms_noida.id)) == 0:
            await inventory_repo.record_movement(
                session,
                organization_id=samsung.id,
                product_id=p_buds.id,
                warehouse_id=wh_sms_noida.id,
                movement_type="IN",
                quantity_change=15,
                reference="Accessory Depot Initial Intake",
            )

        # Stock Transfers for Samsung Electronics
        samsung_transfers = await transfer_repo.list_transfers(session, organization_id=samsung.id)
        if not samsung_transfers:
            trf1 = StockTransfer(
                organization_id=samsung.id,
                transfer_number="TRF-SMS-001",
                source_warehouse_id=wh_sms_noida.id,
                destination_warehouse_id=wh_sms_west.id,
                product_id=p_s24.id,
                quantity=30,
                status="IN_TRANSIT",
                notes="West Zone festival launch stock via BlueDart Aviation Cargo flight BLU-402",
            )
            trf2 = StockTransfer(
                organization_id=samsung.id,
                transfer_number="TRF-SMS-002",
                source_warehouse_id=wh_sms_noida.id,
                destination_warehouse_id=wh_sms_south.id,
                product_id=p_qled.id,
                quantity=12,
                status="RECEIVED",
                notes="South India regional depot buffer inventory fulfilled",
            )
            session.add_all([trf1, trf2])
            await session.commit()

        # Customers for Samsung Electronics
        c_reliance = await customer_repo.get_by_email(session, organization_id=samsung.id, email="b2b.procurement@reliancedigital.in")
        if not c_reliance:
            c_reliance = await customer_repo.create_customer(
                session,
                obj_in=CustomerCreate(
                    name="Reliance Retail Digital Ltd",
                    email="b2b.procurement@reliancedigital.in",
                    phone="+91 98201 55667",
                    company="Reliance Retail Ventures",
                    billing_address="Reliance Corporate Park, Thane-Belapur Road, Ghansoli, Navi Mumbai, MH",
                    shipping_address="Reliance Retail Central DC, Bhiwandi Logistics Corridor, MH",
                ),
                organization_id=samsung.id,
            )

        c_croma = await customer_repo.get_by_email(session, organization_id=samsung.id, email="vendor.ops@croma.com")
        if not c_croma:
            c_croma = await customer_repo.create_customer(
                session,
                obj_in=CustomerCreate(
                    name="Croma (Infiniti Retail - Tata Group)",
                    email="vendor.ops@croma.com",
                    phone="+91 99300 77889",
                    company="Tata Digital Enterprise",
                    billing_address="Unit 701, Parkus Tower, Vikhroli West, Mumbai, MH",
                    shipping_address="Tata Croma Regional Logistics Center, Nelamangala, Bengaluru, KA",
                ),
                organization_id=samsung.id,
            )

        c_amazon = await customer_repo.get_by_email(session, organization_id=samsung.id, email="india-inbound-ce@amazon.in")
        if not c_amazon:
            c_amazon = await customer_repo.create_customer(
                session,
                obj_in=CustomerCreate(
                    name="Amazon India Seller Services Pvt Ltd",
                    email="india-inbound-ce@amazon.in",
                    phone="+91 91222 33445",
                    company="Amazon Electronics Fulfillment",
                    billing_address="World Trade Centre, Brigade Gateway, Malleshwaram, Bengaluru, KA",
                    shipping_address="Amazon Fulfillment Centre DEL4, Tauru Road, Gurugram, HR",
                ),
                organization_id=samsung.id,
            )

        # Suppliers for Samsung Electronics
        s_qualcomm = await supplier_repo.get_by_email(session, organization_id=samsung.id, email="snapdragon.supply@qualcomm.com")
        if not s_qualcomm:
            s_qualcomm = await supplier_repo.create_supplier(
                session,
                obj_in=SupplierCreate(
                    name="Qualcomm India Pvt Ltd",
                    email="snapdragon.supply@qualcomm.com",
                    phone="+91 98490 11223",
                    company="Qualcomm Global OEM Solutions",
                    address="Raheja Mindspace IT Park, Hitec City, Hyderabad, TS",
                    payment_terms="Net 45",
                ),
                organization_id=samsung.id,
            )

        s_corning = await supplier_repo.get_by_email(session, organization_id=samsung.id, email="display.glass@corning.co.in")
        if not s_corning:
            s_corning = await supplier_repo.create_supplier(
                session,
                obj_in=SupplierCreate(
                    name="Corning Technologies India Pvt Ltd",
                    email="display.glass@corning.co.in",
                    phone="+91 94440 33445",
                    company="Corning Specialty Materials",
                    address="Plot A-1, SIPCOT Industrial Park, Vallam Vadagal, Sriperumbudur, TN",
                    payment_terms="Net 30",
                ),
                organization_id=samsung.id,
            )

        s_sdi = await supplier_repo.get_by_email(session, organization_id=samsung.id, email="battery.oem@samsungsdi.com")
        if not s_sdi:
            s_sdi = await supplier_repo.create_supplier(
                session,
                obj_in=SupplierCreate(
                    name="Samsung SDI Battery Division",
                    email="battery.oem@samsungsdi.com",
                    phone="+82 31 8000 1234",
                    company="Samsung SDI Global",
                    address="150-20, Gongse-ro, Giheung-gu, Yongin-si, Gyeonggi-do, South Korea",
                    payment_terms="Net 60",
                ),
                organization_id=samsung.id,
            )

        # Purchase Orders for Samsung Electronics
        samsung_pos = await purchase_order_repo.list_pos(session, organization_id=samsung.id)
        if not samsung_pos:
            po_sms_1 = await purchase_order_service.create_po(
                session,
                organization_id=samsung.id,
                obj_in=PurchaseOrderCreate(
                    supplier_id=s_qualcomm.id,
                    destination_warehouse_id=wh_sms_noida.id,
                    notes="Snapdragon 8 Gen 3 Mobile Platforms for Galaxy S24 Series production run",
                    items=[
                        PurchaseOrderItemCreate(product_id=p_s24.id, quantity=50, unit_cost=105000.00),
                    ],
                ),
            )
            await purchase_order_service.issue_po(session, organization_id=samsung.id, po_id=po_sms_1.id)

        # Sales Orders for Samsung Electronics
        samsung_orders = await order_repo.list_orders(session, organization_id=samsung.id)
        if not samsung_orders:
            order_ril = await order_service.create_order(
                session,
                organization_id=samsung.id,
                obj_in=SalesOrderCreate(
                    customer_id=c_reliance.id,
                    warehouse_id=wh_sms_noida.id,
                    notes="Quarterly allocation for Reliance Digital flagship retail stores",
                    items=[
                        OrderItemCreate(product_id=p_s24.id, quantity=30, unit_price=139999.00),
                        OrderItemCreate(product_id=p_qled.id, quantity=8, unit_price=279990.00),
                    ],
                ),
            )
            await order_service.confirm_order(session, organization_id=samsung.id, order_id=order_ril.id)

            order_crm = await order_service.create_order(
                session,
                organization_id=samsung.id,
                obj_in=SalesOrderCreate(
                    customer_id=c_croma.id,
                    warehouse_id=wh_sms_noida.id,
                    notes="Galaxy Z Fold6 launch delivery to Croma Tier-1 outlets across metros",
                    items=[
                        OrderItemCreate(product_id=p_fold6.id, quantity=20, unit_price=164999.00),
                    ],
                ),
            )
            await order_service.confirm_order(session, organization_id=samsung.id, order_id=order_crm.id)

            # Shipments for Samsung Electronics
            shp_crm = await shipment_service.create_shipment(
                session,
                organization_id=samsung.id,
                obj_in=ShipmentCreate(
                    order_id=order_crm.id,
                    carrier="BlueDart Aviation Express",
                    tracking_number="BLU-99201488",
                    shipping_cost=8500.00,
                    origin_address=f"{wh_sms_noida.name}, Sector 81, Noida, UP",
                    destination_address=c_croma.shipping_address or "Nelamangala, Bengaluru, KA",
                    notes="High-value insured electronic devices - Tamper-evident seals applied",
                ),
            )
            await shipment_service.dispatch_shipment(
                session,
                organization_id=samsung.id,
                shipment_id=shp_crm.id,
                update_in=ShipmentStatusUpdate(
                    location="Indira Gandhi International Airport Cargo Terminal, New Delhi",
                    description="Loaded on dedicated freighter flight to Bengaluru Kempegowda Hub",
                ),
            )
            await shipment_service.mark_out_for_delivery(
                session,
                organization_id=samsung.id,
                shipment_id=shp_crm.id,
                update_in=ShipmentStatusUpdate(
                    location="Nelamangala Air Express Hub, Bengaluru",
                    description="Out for scheduled delivery to Tata Croma Logistics Center with secure armed escort",
                ),
            )

            # Invoices for Samsung Electronics
            inv_ril = await invoice_service.create_invoice_from_order(
                session,
                organization_id=samsung.id,
                order_id=order_ril.id,
                tax_rate=18.0,
            )
            await invoice_service.record_payment(
                session,
                organization_id=samsung.id,
                obj_in=PaymentCreate(
                    invoice_id=inv_ril.id,
                    amount=3500000.00,
                    payment_method="BANK_TRANSFER",
                    reference="UTR-RIL-HDFC-990812",
                    notes="Advance payment received via RTGS from Reliance Retail Treasury",
                ),
            )

            inv_crm = await invoice_service.create_invoice_from_order(
                session,
                organization_id=samsung.id,
                order_id=order_crm.id,
                tax_rate=18.0,
            )
            await invoice_service.record_payment(
                session,
                organization_id=samsung.id,
                obj_in=PaymentCreate(
                    invoice_id=inv_crm.id,
                    amount=inv_crm.total_amount,
                    payment_method="BANK_TRANSFER",
                    reference="UTR-TATA-ICICI-772109",
                    notes="Full tax invoice settlement via ICICI Corporate Banking",
                ),
            )

        # Notifications for Samsung Electronics
        samsung_notifs = await notification_repo.list_notifications(session, organization_id=samsung.id, limit=5)
        if not samsung_notifs:
            await notification_service.create_notification(
                session,
                organization_id=samsung.id,
                title="Stock Transit Dispatched: TRF-SMS-001",
                message="Consignment of 30x Galaxy S24 Ultra dispatched from Noida Mega Plant to Bhiwandi Hub.",
                type="INFO",
                link="/warehouses",
            )
            await notification_service.create_notification(
                session,
                organization_id=samsung.id,
                title="High Value Payment Received: ₹35,00,000.00",
                message="Received RTGS advance from Reliance Retail Digital (Ref: UTR-RIL-HDFC-990812).",
                type="SUCCESS",
                link="/invoices",
            )
            await notification_service.create_notification(
                session,
                organization_id=samsung.id,
                title="Consignment Out for Delivery: #BLU-99201488",
                message="Galaxy Z Fold6 flagship shipment to Tata Croma is out for delivery in Bengaluru.",
                type="INFO",
                link="/shipments",
            )

        samsung_audits = await audit_repo.list_audits(session, organization_id=samsung.id, limit=5)
        if not samsung_audits:
            await audit_service.log_action(
                session,
                organization_id=samsung.id,
                action="PRODUCTION_INBOUND",
                entity_type="Inventory",
                entity_name="SMS-S24U-512",
                details="150 units of Samsung Galaxy S24 Ultra 5G received from Noida Factory Line #4.",
                user_name="Ramesh Warehouse",
            )
            await audit_service.log_action(
                session,
                organization_id=samsung.id,
                action="ORDER_CONFIRMED",
                entity_type="Order",
                entity_name="Reliance Retail B2B Order",
                details="Confirmed enterprise order for 30x S24 Ultra and 8x Neo QLED 8K. Reserved in WH-SMS-01.",
                user_name="Vikram Sales",
            )
            await audit_service.log_action(
                session,
                organization_id=samsung.id,
                action="PAYMENT_RECORDED",
                entity_type="Payment",
                entity_name="UTR-RIL-HDFC-990812",
                details="Advance payment of ₹35,00,000.00 posted against Reliance Retail Tax Invoice.",
                user_name="Alice Admin",
            )

        # =========================================================================
        # 2. SEED TENANT 2: Samsung Semiconductor Ltd (slug: samsung-semi)
        # =========================================================================
        semi = await organization_repo.get_by_slug(session, "samsung-semi")
        if not semi:
            semi = await organization_repo.create(
                session,
                obj_in=OrganizationCreate(
                    name="Samsung Semiconductor Ltd",
                    slug="samsung-semi",
                    currency="INR",
                ),
            )
        elif semi.name != "Samsung Semiconductor Ltd" or semi.currency != "INR":
            semi.name = "Samsung Semiconductor Ltd"
            semi.currency = "INR"
            await session.commit()

        # Seed RBAC users for Samsung Semiconductor
        semi_users = [
            ("Sunil Admin", "sunil@samsung-semi.com", "admin"),
            ("Bob Manager", "bob@samsung-semi.com", "warehouse_manager"),
            ("Kavita Sales", "kavita@samsung-semi.com", "sales_rep"),
            ("Deepak Auditor", "deepak@samsung-semi.com", "viewer"),
        ]
        existing_semi_users = await user_repo.list_by_organization(session, semi.id)
        existing_semi_emails = {u.email for u in existing_semi_users}
        for u_name, u_email, u_role in semi_users:
            if u_email not in existing_semi_emails:
                u = User(
                    name=u_name,
                    email=u_email,
                    role=u_role,
                    password_hash=default_hash,
                    organization_id=semi.id,
                )
                session.add(u)
        await session.commit()

        # Warehouses for Samsung Semiconductor
        wh_semi_fab = await warehouse_repo.get_by_code(session, organization_id=semi.id, code="WH-SEMI-01")
        if not wh_semi_fab:
            wh_semi_fab = await warehouse_repo.create_warehouse(
                session,
                obj_in=WarehouseCreate(
                    name="Samsung Giheung Fab & Global Depot",
                    code="WH-SEMI-01",
                    location="Giheung Semiconductor Complex, Yongin-si, Korea",
                    capacity=2000,
                    is_default=True,
                ),
                organization_id=semi.id,
            )

        wh_semi_hub = await warehouse_repo.get_by_code(session, organization_id=semi.id, code="WH-SEMI-02")
        if not wh_semi_hub:
            wh_semi_hub = await warehouse_repo.create_warehouse(
                session,
                obj_in=WarehouseCreate(
                    name="Samsung Hwaseong EUV Cleanroom Hub",
                    code="WH-SEMI-02",
                    location="Hwaseong Nano City, Gyeonggi-do, Korea",
                    capacity=1200,
                    is_default=False,
                ),
                organization_id=semi.id,
            )

        # Categories for Samsung Semiconductor
        cat_ssd = await category_repo.get_by_name(session, organization_id=semi.id, name="V-NAND Flash & Storage")
        if not cat_ssd:
            cat_ssd = await category_repo.create(
                session,
                obj_in=CategoryCreate(name="V-NAND Flash & Storage", description="High-throughput PCIe Gen 4/5 internal & datacenter SSDs"),
                organization_id=semi.id,
            )

        cat_dram = await category_repo.get_by_name(session, organization_id=semi.id, name="LPDDR5X & HBM Memory")
        if not cat_dram:
            cat_dram = await category_repo.create(
                session,
                obj_in=CategoryCreate(name="LPDDR5X & HBM Memory", description="High-bandwidth memory chips for AI accelerators & mobile platforms"),
                organization_id=semi.id,
            )

        cat_soc = await category_repo.get_by_name(session, organization_id=semi.id, name="System LSI & Processors")
        if not cat_soc:
            cat_soc = await category_repo.create(
                session,
                obj_in=CategoryCreate(name="System LSI & Processors", description="Advanced 4nm GAA application processors and modems"),
                organization_id=semi.id,
            )

        cat_oled = await category_repo.get_by_name(session, organization_id=semi.id, name="OLED Display Panels")
        if not cat_oled:
            cat_oled = await category_repo.create(
                session,
                obj_in=CategoryCreate(name="OLED Display Panels", description="Dynamic AMOLED 2X flexible mobile displays"),
                organization_id=semi.id,
            )

        # Products for Samsung Semiconductor
        p_ssd = await product_repo.get_by_sku(session, organization_id=semi.id, sku="SMS-SSD-2TB")
        if not p_ssd:
            p_ssd = await product_repo.create_product(
                session,
                obj_in=ProductCreate(
                    name="Samsung 990 PRO NVMe M.2 SSD 2TB PCIe 4.0",
                    sku="SMS-SSD-2TB",
                    description="7,450 MB/s sequential read high-throughput internal solid state drive",
                    unit="pcs",
                    price=18499.00,
                    cost_price=12200.00,
                    reorder_point=50,
                    category_id=cat_ssd.id,
                ),
                organization_id=semi.id,
            )

        p_ram = await product_repo.get_by_sku(session, organization_id=semi.id, sku="SMS-RAM-16G")
        if not p_ram:
            p_ram = await product_repo.create_product(
                session,
                obj_in=ProductCreate(
                    name="Samsung 16GB LPDDR5X 8533Mbps DRAM Die",
                    sku="SMS-RAM-16G",
                    description="Ultra-low power high speed mobile memory die for flagship devices",
                    unit="pcs",
                    price=6499.00,
                    cost_price=3800.00,
                    reorder_point=100,
                    category_id=cat_dram.id,
                ),
                organization_id=semi.id,
            )

        p_soc = await product_repo.get_by_sku(session, organization_id=semi.id, sku="SMS-SOC-2400")
        if not p_soc:
            p_soc = await product_repo.create_product(
                session,
                obj_in=ProductCreate(
                    name="Samsung Exynos 2400 Deca-Core AP Module",
                    sku="SMS-SOC-2400",
                    description="4nm GAA process deca-core application processor with Xclipse 940 GPU",
                    unit="pcs",
                    price=12999.00,
                    cost_price=8500.00,
                    reorder_point=75,
                    category_id=cat_soc.id,
                ),
                organization_id=semi.id,
            )

        p_disp = await product_repo.get_by_sku(session, organization_id=semi.id, sku="SMS-DISP-AMOLED")
        if not p_disp:
            p_disp = await product_repo.create_product(
                session,
                obj_in=ProductCreate(
                    name="Samsung Dynamic AMOLED 2X 120Hz 6.7\" Display",
                    sku="SMS-DISP-AMOLED",
                    description="LTPO adaptive refresh rate flexible OLED display panel with 2600 nits brightness",
                    unit="pcs",
                    price=9800.00,
                    cost_price=6100.00,
                    reorder_point=40,
                    category_id=cat_oled.id,
                ),
                organization_id=semi.id,
            )

        # Stock Movements for Samsung Semiconductor
        if (await inventory_repo.get_stock_level(session, organization_id=semi.id, product_id=p_ssd.id, warehouse_id=wh_semi_fab.id)) == 0:
            await inventory_repo.record_movement(
                session,
                organization_id=semi.id,
                product_id=p_ssd.id,
                warehouse_id=wh_semi_fab.id,
                movement_type="IN",
                quantity_change=400,
                reference="Giheung Fab Production Lot #SSD-990-P",
            )

        if (await inventory_repo.get_stock_level(session, organization_id=semi.id, product_id=p_ram.id, warehouse_id=wh_semi_fab.id)) == 0:
            await inventory_repo.record_movement(
                session,
                organization_id=semi.id,
                product_id=p_ram.id,
                warehouse_id=wh_semi_fab.id,
                movement_type="IN",
                quantity_change=1000,
                reference="Hwaseong Line 17 Cleanroom Wafer Packaging",
            )

        if (await inventory_repo.get_stock_level(session, organization_id=semi.id, product_id=p_soc.id, warehouse_id=wh_semi_fab.id)) == 0:
            await inventory_repo.record_movement(
                session,
                organization_id=semi.id,
                product_id=p_soc.id,
                warehouse_id=wh_semi_fab.id,
                movement_type="IN",
                quantity_change=300,
                reference="Foundry Fabrication Batch #EXY-2400",
            )

        if (await inventory_repo.get_stock_level(session, organization_id=semi.id, product_id=p_disp.id, warehouse_id=wh_semi_fab.id)) == 0:
            await inventory_repo.record_movement(
                session,
                organization_id=semi.id,
                product_id=p_disp.id,
                warehouse_id=wh_semi_fab.id,
                movement_type="IN",
                quantity_change=250,
                reference="Asan Display Complex Fab 8 Inbound",
            )

        # Customers for Samsung Semiconductor
        c_lenovo = await customer_repo.get_by_email(session, organization_id=semi.id, email="procurement@lenovo.in")
        if not c_lenovo:
            c_lenovo = await customer_repo.create_customer(
                session,
                obj_in=CustomerCreate(
                    name="Lenovo Global Technology India Pvt Ltd",
                    email="procurement@lenovo.in",
                    phone="+91 80 4012 3456",
                    company="Lenovo PC & Data Center Group",
                    billing_address="Vatika Business Park, Sector 49, Sohna Road, Gurugram, HR",
                    shipping_address="Lenovo Manufacturing Plant, SIPCOT Industrial Complex, Puducherry",
                ),
                organization_id=semi.id,
            )

        c_dell = await customer_repo.get_by_email(session, organization_id=semi.id, email="oem.components@dell.com")
        if not c_dell:
            c_dell = await customer_repo.create_customer(
                session,
                obj_in=CustomerCreate(
                    name="Dell International Services India Pvt Ltd",
                    email="oem.components@dell.com",
                    phone="+91 80 6695 0000",
                    company="Dell Client Solutions Enterprise",
                    billing_address="Divyashree Greens, Koramangala Inner Ring Road, Bengaluru, KA",
                    shipping_address="Dell Manufacturing Facility, Sriperumbudur SEZ, Chennai, TN",
                ),
                organization_id=semi.id,
            )

        # Suppliers for Samsung Semiconductor
        s_asml = await supplier_repo.get_by_email(session, organization_id=semi.id, email="euv.systems@asml.com")
        if not s_asml:
            s_asml = await supplier_repo.create_supplier(
                session,
                obj_in=SupplierCreate(
                    name="ASML Netherlands Lithography B.V.",
                    email="euv.systems@asml.com",
                    phone="+31 40 268 3000",
                    company="ASML Advanced High-NA Systems",
                    address="De Run 6501, 5504 DR Veldhoven, The Netherlands",
                    payment_terms="Net 60",
                ),
                organization_id=semi.id,
            )

        s_shinetsu = await supplier_repo.get_by_email(session, organization_id=semi.id, email="silicon.wafers@shinetsu.co.jp")
        if not s_shinetsu:
            s_shinetsu = await supplier_repo.create_supplier(
                session,
                obj_in=SupplierCreate(
                    name="Shin-Etsu Silicon Wafer Corp",
                    email="silicon.wafers@shinetsu.co.jp",
                    phone="+81 3 3246 5111",
                    company="Shin-Etsu Chemical Semiconductor Materials",
                    address="2-6-1, Ohtemachi, Chiyoda-ku, Tokyo, Japan",
                    payment_terms="Net 45",
                ),
                organization_id=semi.id,
            )

        # Purchase Orders for Samsung Semiconductor
        semi_pos = await purchase_order_repo.list_pos(session, organization_id=semi.id)
        if not semi_pos:
            semi_po_in = PurchaseOrderCreate(
                supplier_id=s_shinetsu.id,
                destination_warehouse_id=wh_semi_fab.id,
                notes="Quarterly 300mm ultra-pure polished monocrystalline silicon wafers batch",
                items=[
                    PurchaseOrderItemCreate(product_id=p_ssd.id, quantity=100, unit_cost=12200.00),
                ],
            )
            new_semi_po = await purchase_order_service.create_po(session, organization_id=semi.id, obj_in=semi_po_in)
            await purchase_order_service.issue_po(session, organization_id=semi.id, po_id=new_semi_po.id)

        # Sales Orders for Samsung Semiconductor
        semi_orders = await order_repo.list_orders(session, organization_id=semi.id)
        if not semi_orders:
            semi_order_in = SalesOrderCreate(
                customer_id=c_lenovo.id,
                warehouse_id=wh_semi_fab.id,
                notes="OEM supply agreement for 990 PRO enterprise NVMe SSDs for ThinkPad series",
                items=[
                    OrderItemCreate(product_id=p_ssd.id, quantity=80, unit_price=18499.00),
                    OrderItemCreate(product_id=p_ram.id, quantity=200, unit_price=6499.00),
                ],
            )
            new_semi_order = await order_service.create_order(session, organization_id=semi.id, obj_in=semi_order_in)
            await order_service.confirm_order(session, organization_id=semi.id, order_id=new_semi_order.id)

            # Shipments for Samsung Semiconductor
            shp_semi = await shipment_service.create_shipment(
                session,
                organization_id=semi.id,
                obj_in=ShipmentCreate(
                    order_id=new_semi_order.id,
                    carrier="DHL Global Forwarding Air Express",
                    tracking_number="DHL-88192011",
                    shipping_cost=12000.00,
                    origin_address=f"{wh_semi_fab.name}, Yongin-si, Korea",
                    destination_address=c_lenovo.shipping_address or "Puducherry Plant, India",
                    notes="Direct customs-cleared air freight - Temp and shock monitored",
                ),
            )
            await shipment_service.dispatch_shipment(
                session,
                organization_id=semi.id,
                shipment_id=shp_semi.id,
                update_in=ShipmentStatusUpdate(
                    location="Incheon International Airport Cargo Center, Seoul",
                    description="Export customs clearance completed. Air pallet loaded on Flight KE-0523",
                ),
            )

            # Invoices for Samsung Semiconductor
            inv_lenovo = await invoice_service.create_invoice_from_order(
                session,
                organization_id=semi.id,
                order_id=new_semi_order.id,
                tax_rate=18.0,
            )
            await invoice_service.record_payment(
                session,
                organization_id=semi.id,
                obj_in=PaymentCreate(
                    invoice_id=inv_lenovo.id,
                    amount=inv_lenovo.total_amount,
                    payment_method="BANK_TRANSFER",
                    reference="SWIFT-LENOVO-HSBC-449102",
                    notes="Full tax invoice wire remittance received via HSBC Corporate Treasury",
                ),
            )

        # Notifications for Samsung Semiconductor
        semi_notifs = await notification_repo.list_notifications(session, organization_id=semi.id, limit=5)
        if not semi_notifs:
            await notification_service.create_notification(
                session,
                organization_id=semi.id,
                title="Consignment Dispatched: #DHL-88192011",
                message="Export air pallet of 990 PRO SSDs and LPDDR5X RAM cleared customs at Incheon Hub.",
                type="INFO",
                link="/shipments",
            )
            await notification_service.create_notification(
                session,
                organization_id=semi.id,
                title="Wire Remittance Confirmed: SWIFT-LENOVO-HSBC",
                message="Settlement received in full for Lenovo Global Technology component procurement.",
                type="SUCCESS",
                link="/invoices",
            )

        semi_audits = await audit_repo.list_audits(session, organization_id=semi.id, limit=5)
        if not semi_audits:
            await audit_service.log_action(
                session,
                organization_id=semi.id,
                action="FAB_INBOUND",
                entity_type="Inventory",
                entity_name="SMS-SSD-2TB",
                details="400 units of Samsung 990 PRO 2TB received from Giheung Fab Cleanroom.",
                user_name="Bob Manager",
            )
            await audit_service.log_action(
                session,
                organization_id=semi.id,
                action="ORDER_CONFIRMED",
                entity_type="Order",
                entity_name="Lenovo OEM Component Supply",
                details="Confirmed enterprise purchase of 80x 990 PRO SSDs and 200x LPDDR5X modules.",
                user_name="Kavita Sales",
            )
            await audit_service.log_action(
                session,
                organization_id=semi.id,
                action="PAYMENT_RECORDED",
                entity_type="Payment",
                entity_name="SWIFT-LENOVO-HSBC-449102",
                details="Full wire settlement posted against Lenovo Tax Invoice.",
                user_name="Sunil Admin",
            )

        print("Samsung multi-tenant demo seed complete: Samsung Electronics Ltd & Samsung Semiconductor Ltd.")


if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_demo_data())
