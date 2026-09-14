"""Automatic Seed Data for Seamless College Demonstration."""
from app.core.database import get_active_engine, AsyncSessionLocal
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
    """Ensure database schema exists and seed initial demo organizations, catalog, warehouses & stock."""
    engine = await get_active_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Ensure password_hash column exists on users table in legacy databases
        from sqlalchemy import text
        try:
            if "sqlite" in engine.dialect.name:
                pragma_res = await conn.execute(text("PRAGMA table_info(users)"))
                cols = [r[1] for r in pragma_res.fetchall()]
                if "password_hash" not in cols:
                    await conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"))
            elif "postgresql" in engine.dialect.name:
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)"))
            from app.core.security import get_password_hash
            default_hash = get_password_hash("admin123")
            await conn.execute(
                text("UPDATE users SET password_hash = :hash WHERE password_hash IS NULL"),
                {"hash": default_hash},
            )
        except Exception:
            pass

    async with AsyncSessionLocal() as session:
        # --- Seed Acme Logistics Ltd ---
        acme = await organization_repo.get_by_slug(session, "acme")
        if not acme:
            acme = await organization_repo.create(
                session,
                obj_in=OrganizationCreate(
                    name="Acme Logistics Ltd",
                    slug="acme",
                    currency="INR",
                ),
            )
            await user_repo.create_user(
                session,
                obj_in=UserCreate(
                    name="Alice Admin",
                    email="alice@acme.local",
                    role="admin",
                ),
                organization_id=acme.id,
            )
        elif acme.currency != "INR":
            acme.currency = "INR"
            await session.commit()

        # Seed RBAC users for Acme (admin, warehouse_manager, sales_rep, viewer)
        acme_users = [
            ("Alice Admin", "alice@acme.local", "admin"),
            ("Ramesh Warehouse", "ramesh@acme.local", "warehouse_manager"),
            ("Vikram Sales", "vikram@acme.local", "sales_rep"),
            ("Pooja Auditor", "pooja@acme.local", "viewer"),
        ]
        existing_acme_users = await user_repo.list_by_organization(session, acme.id)
        existing_acme_emails = {u.email for u in existing_acme_users}
        for u_name, u_email, u_role in acme_users:
            if u_email not in existing_acme_emails:
                await user_repo.create_user(
                    session,
                    obj_in=UserCreate(name=u_name, email=u_email, role=u_role),
                    organization_id=acme.id,
                )

        # Warehouses for Acme
        wh_acme_main = await warehouse_repo.get_by_code(session, organization_id=acme.id, code="WH-ACME-01")
        if not wh_acme_main:
            wh_acme_main = await warehouse_repo.create_warehouse(
                session,
                obj_in=WarehouseCreate(
                    name="Acme Central DC",
                    code="WH-ACME-01",
                    location="Chicago Logistics Park, IL",
                    is_default=True,
                ),
                organization_id=acme.id,
            )

        wh_acme_east = await warehouse_repo.get_by_code(session, organization_id=acme.id, code="WH-ACME-02")
        if not wh_acme_east:
            wh_acme_east = await warehouse_repo.create_warehouse(
                session,
                obj_in=WarehouseCreate(
                    name="Acme East Coast Depot",
                    code="WH-ACME-02",
                    location="Port of Newark, NJ",
                    is_default=False,
                ),
                organization_id=acme.id,
            )

        cat_wh = await category_repo.get_by_name(session, organization_id=acme.id, name="Warehouse Equipment")
        if not cat_wh:
            cat_wh = await category_repo.create(
                session,
                obj_in=CategoryCreate(name="Warehouse Equipment", description="Material handling gear"),
                organization_id=acme.id,
            )

        cat_pkg = await category_repo.get_by_name(session, organization_id=acme.id, name="Packaging Supplies")
        if not cat_pkg:
            cat_pkg = await category_repo.create(
                session,
                obj_in=CategoryCreate(name="Packaging Supplies", description="Boxes, shrink wrap, and tape"),
                organization_id=acme.id,
            )

        p_plt = await product_repo.get_by_sku(session, organization_id=acme.id, sku="SKU-PLT-01")
        if not p_plt:
            p_plt = await product_repo.create_product(
                session,
                obj_in=ProductCreate(
                    name="Industrial Hydraulic Pallet Jack 2.5T",
                    sku="SKU-PLT-01",
                    description="Heavy duty 2500kg capacity manual hydraulic pallet truck",
                    unit="pcs",
                    price=380.00,
                    cost_price=240.00,
                    reorder_point=5,
                    category_id=cat_wh.id,
                ),
                organization_id=acme.id,
            )

        p_bin = await product_repo.get_by_sku(session, organization_id=acme.id, sku="SKU-BIN-02")
        if not p_bin:
            p_bin = await product_repo.create_product(
                session,
                obj_in=ProductCreate(
                    name="Heavy Duty Storage Bin (Stackable)",
                    sku="SKU-BIN-02",
                    description="60-liter industrial blue polypropylene storage tote",
                    unit="pcs",
                    price=24.50,
                    cost_price=12.00,
                    reorder_point=25,
                    category_id=cat_wh.id,
                ),
                organization_id=acme.id,
            )

        p_flm = await product_repo.get_by_sku(session, organization_id=acme.id, sku="SKU-FLM-03")
        if not p_flm:
            p_flm = await product_repo.create_product(
                session,
                obj_in=ProductCreate(
                    name="High-Tack Pallet Stretch Film (500mm)",
                    sku="SKU-FLM-03",
                    description="23-micron clear cast stretch wrap roll",
                    unit="roll",
                    price=18.00,
                    cost_price=9.50,
                    reorder_point=50,
                    category_id=cat_pkg.id,
                ),
                organization_id=acme.id,
            )

        cat_elec = await category_repo.get_by_name(session, organization_id=acme.id, name="Electronics & Accessories")
        if not cat_elec:
            cat_elec = await category_repo.create(
                session,
                obj_in=CategoryCreate(name="Electronics & Accessories", description="OEM charging adapters and peripherals"),
                organization_id=acme.id,
            )

        p_samsung_chg = await product_repo.get_by_sku(session, organization_id=acme.id, sku="SMS-ACC-45W")
        if not p_samsung_chg:
            p_samsung_chg = await product_repo.create_product(
                session,
                obj_in=ProductCreate(
                    name="Samsung 45W USB-C Super Fast Charger 2.0",
                    sku="SMS-ACC-45W",
                    description="Official Samsung Power Delivery 3.0 Type-C fast wall adapter",
                    unit="pcs",
                    price=2999.00,
                    cost_price=1650.00,
                    reorder_point=25,
                    category_id=cat_elec.id,
                ),
                organization_id=acme.id,
            )

        # Seed initial stock movements for Acme in WH-ACME-01
        if (await inventory_repo.get_stock_level(session, organization_id=acme.id, product_id=p_plt.id, warehouse_id=wh_acme_main.id)) < 15:
            await inventory_repo.record_movement(
                session,
                organization_id=acme.id,
                product_id=p_plt.id,
                warehouse_id=wh_acme_main.id,
                movement_type="IN",
                quantity_change=25,
                reference="Initial Stock Receiving",
            )

        if (await inventory_repo.get_stock_level(session, organization_id=acme.id, product_id=p_bin.id, warehouse_id=wh_acme_main.id)) < 20:
            await inventory_repo.record_movement(
                session,
                organization_id=acme.id,
                product_id=p_bin.id,
                warehouse_id=wh_acme_main.id,
                movement_type="IN",
                quantity_change=60,
                reference="Bulk Supplier Inbound",
            )

        if (await inventory_repo.get_stock_level(session, organization_id=acme.id, product_id=p_flm.id, warehouse_id=wh_acme_main.id)) < 10:
            await inventory_repo.record_movement(
                session,
                organization_id=acme.id,
                product_id=p_flm.id,
                warehouse_id=wh_acme_main.id,
                movement_type="IN",
                quantity_change=15,
                reference="Initial Inbound",
            )

        if (await inventory_repo.get_stock_level(session, organization_id=acme.id, product_id=p_samsung_chg.id, warehouse_id=wh_acme_main.id)) < 20:
            await inventory_repo.record_movement(
                session,
                organization_id=acme.id,
                product_id=p_samsung_chg.id,
                warehouse_id=wh_acme_main.id,
                movement_type="IN",
                quantity_change=85,
                reference="Samsung India Direct Factory Inbound",
            )

        # Seed a demo transfer for Acme if none exist
        acme_transfers = await transfer_repo.list_transfers(session, organization_id=acme.id)
        if not acme_transfers:
            demo_transfer = StockTransfer(
                organization_id=acme.id,
                transfer_number="TRF-DEMO-01",
                source_warehouse_id=wh_acme_main.id,
                destination_warehouse_id=wh_acme_east.id,
                product_id=p_plt.id,
                quantity=3,
                status="REQUESTED",
                notes="Replenishment for East Coast region",
            )
            session.add(demo_transfer)
            await session.commit()

        # Seed Customers for Acme
        c_summit = await customer_repo.get_by_email(session, organization_id=acme.id, email="procurement@summiteng.in")
        if not c_summit:
            c_summit = await customer_repo.create_customer(
                session,
                obj_in=CustomerCreate(
                    name="Summit Industrial & Engineering Ltd",
                    email="procurement@summiteng.in",
                    phone="+91 98200 12345",
                    company="Summit Group",
                    billing_address="Unit 402, Trade Centre, BKC, Mumbai, MH",
                    shipping_address="Plot 12, MIDC Industrial Area, Taloja, Navi Mumbai, MH",
                ),
                organization_id=acme.id,
            )

        c_apex_infra = await customer_repo.get_by_email(session, organization_id=acme.id, email="orders@apexinfra.in")
        if not c_apex_infra:
            c_apex_infra = await customer_repo.create_customer(
                session,
                obj_in=CustomerCreate(
                    name="Apex Infrastructure Projects",
                    email="orders@apexinfra.in",
                    phone="+91 98450 67890",
                    company="Apex Builders & Infra",
                    billing_address="7th Floor, Prestige Tower, MG Road, Bengaluru, KA",
                    shipping_address="Site Office, Whitefield Tech Corridor, Bengaluru, KA",
                ),
                organization_id=acme.id,
            )

        # Seed an initial CONFIRMED order for Acme if none exist
        acme_orders = await order_repo.list_orders(session, organization_id=acme.id)
        if not acme_orders:
            order_in = SalesOrderCreate(
                customer_id=c_summit.id,
                warehouse_id=wh_acme_main.id,
                notes="Urgent site delivery for Taloja plant",
                items=[
                    OrderItemCreate(product_id=p_bin.id, quantity=5, unit_price=24.50),
                    OrderItemCreate(product_id=p_flm.id, quantity=2, unit_price=18.00),
                ],
            )
            new_order = await order_service.create_order(session, organization_id=acme.id, obj_in=order_in)
            await order_service.confirm_order(session, organization_id=acme.id, order_id=new_order.id)

        # Seed Suppliers for Acme
        s_tata = await supplier_repo.get_by_email(session, organization_id=acme.id, email="orders@tatasteel-fab.in")
        if not s_tata:
            s_tata = await supplier_repo.create_supplier(
                session,
                obj_in=SupplierCreate(
                    name="Tata Steel Fabrication Division",
                    email="orders@tatasteel-fab.in",
                    phone="+91 98300 44556",
                    company="Tata Steel Industrial Products",
                    address="Works Site, Jamshedpur, Jharkhand",
                    payment_terms="Net 45",
                ),
                organization_id=acme.id,
            )

        s_kaveri = await supplier_repo.get_by_email(session, organization_id=acme.id, email="supplies@kaveripackaging.in")
        if not s_kaveri:
            s_kaveri = await supplier_repo.create_supplier(
                session,
                obj_in=SupplierCreate(
                    name="Kaveri Packaging Solutions Ltd",
                    email="supplies@kaveripackaging.in",
                    phone="+91 94430 77889",
                    company="Kaveri Polymers & Packaging",
                    address="SIPCOT Industrial Complex, Phase II, Hosur, TN",
                    payment_terms="Net 30",
                ),
                organization_id=acme.id,
            )

        s_samsung = await supplier_repo.get_by_email(session, organization_id=acme.id, email="b2b.orders@samsung.com")
        if not s_samsung:
            s_samsung = await supplier_repo.create_supplier(
                session,
                obj_in=SupplierCreate(
                    name="Samsung India Electronics Pvt Ltd",
                    email="b2b.orders@samsung.com",
                    phone="+91 124 488 1234",
                    company="Samsung Electronics Group",
                    address="DLF Cyber City, Building 10, Tower C, Gurugram, HR",
                    payment_terms="Net 30",
                ),
                organization_id=acme.id,
            )

        # Seed an initial ISSUED purchase order for Acme if none exist
        acme_pos = await purchase_order_repo.list_pos(session, organization_id=acme.id)
        if not acme_pos:
            po_in = PurchaseOrderCreate(
                supplier_id=s_kaveri.id,
                destination_warehouse_id=wh_acme_main.id,
                notes="Quarterly pallet stretch wrap restocking",
                items=[
                    PurchaseOrderItemCreate(product_id=p_flm.id, quantity=30, unit_cost=9.50),
                ],
            )
            new_po = await purchase_order_service.create_po(session, organization_id=acme.id, obj_in=po_in)
            await purchase_order_service.issue_po(session, organization_id=acme.id, po_id=new_po.id)

        # Seed initial shipments for Acme if none exist
        acme_shipments = await shipment_repo.list_shipments(session, organization_id=acme.id)
        if not acme_shipments:
            acme_orders_list = await order_repo.list_orders(session, organization_id=acme.id)
            if acme_orders_list:
                target_order = acme_orders_list[0]
                # 1. Seed Delivered Shipment via Blue Dart
                shp1 = await shipment_service.create_shipment(
                    session,
                    organization_id=acme.id,
                    obj_in=ShipmentCreate(
                        order_id=target_order.id,
                        carrier="Blue Dart",
                        tracking_number="BD-88231045",
                        shipping_cost=1450.00,
                        origin_address=f"{wh_acme_main.name}, Bhiwandi, MH",
                        destination_address=target_order.customer.shipping_address or "Taloja MIDC, Navi Mumbai, MH",
                        notes="Priority hydraulic parts consignment",
                    ),
                )
                await shipment_service.dispatch_shipment(
                    session,
                    organization_id=acme.id,
                    shipment_id=shp1.id,
                    update_in=ShipmentStatusUpdate(
                        location="Bhiwandi Sorting Hub, Mumbai",
                        description="Picked up and manifested for linehaul transit",
                    ),
                )
                await shipment_service.mark_out_for_delivery(
                    session,
                    organization_id=acme.id,
                    shipment_id=shp1.id,
                    update_in=ShipmentStatusUpdate(
                        location="Panvel Local Delivery Hub, Navi Mumbai",
                        description="Out for delivery with delivery agent",
                    ),
                )
                await shipment_service.deliver_shipment(
                    session,
                    organization_id=acme.id,
                    shipment_id=shp1.id,
                    update_in=ShipmentStatusUpdate(
                        location="Taloja Plant Gate 2, Navi Mumbai, MH",
                        description="Delivered to stores receiving dock. Received by Mr. Rajesh K.",
                    ),
                )

                # 2. Seed In-Transit Shipment via Delhivery
                shp2 = await shipment_service.create_shipment(
                    session,
                    organization_id=acme.id,
                    obj_in=ShipmentCreate(
                        order_id=target_order.id,
                        carrier="Delhivery",
                        tracking_number="DLH-55421098",
                        shipping_cost=850.00,
                        origin_address=f"{wh_acme_east.name}, Pune, MH",
                        destination_address="Nashik MIDC Logistics Zone, Nashik, MH",
                        notes="Secondary restock shipment",
                    ),
                )
                await shipment_service.dispatch_shipment(
                    session,
                    organization_id=acme.id,
                    shipment_id=shp2.id,
                    update_in=ShipmentStatusUpdate(
                        location="Pune Express Sorting Gateway",
                        description="In transit on linehaul container to Nashik Distribution Hub",
                    ),
                )

        # Seed initial invoices and payments for Acme if none exist
        acme_invoices = await invoice_repo.list_invoices(session, organization_id=acme.id)
        if not acme_invoices:
            acme_orders_list = await order_repo.list_orders(session, organization_id=acme.id)
            target_order = next((o for o in acme_orders_list if o.status in ["CONFIRMED", "FULFILLED"]), None)
            if target_order:
                # 1. Fully Paid Tax Invoice for Summit Packaging
                inv1 = await invoice_service.create_invoice_from_order(
                    session,
                    organization_id=acme.id,
                    order_id=target_order.id,
                    tax_rate=18.0,
                )
                await invoice_service.record_payment(
                    session,
                    organization_id=acme.id,
                    obj_in=PaymentCreate(
                        invoice_id=inv1.id,
                        amount=inv1.total_amount,
                        payment_method="BANK_TRANSFER",
                        reference="UTR-HDFC00998231",
                        notes="Electronic wire settlement received in HDFC Current A/c",
                    ),
                )

                # 2. Partially Paid Tax Invoice for Apex Infrastructure
                inv2 = await invoice_service.create_invoice(
                    session,
                    organization_id=acme.id,
                    obj_in=InvoiceCreate(
                        customer_id=c_apex_infra.id,
                        tax_rate=18.0,
                        notes="Site machinery consumables and pallet wrapping contract",
                        items=[
                            InvoiceItemCreate(
                                description="Industrial Hydraulic Pallet Jack 2.5T",
                                quantity=2,
                                unit_price=380.00,
                                product_id=p_plt.id,
                            ),
                            InvoiceItemCreate(
                                description="High-Tack Pallet Stretch Film (500mm)",
                                quantity=10,
                                unit_price=18.00,
                                product_id=p_flm.id,
                            ),
                        ],
                    ),
                )
                await invoice_service.record_payment(
                    session,
                    organization_id=acme.id,
                    obj_in=PaymentCreate(
                        invoice_id=inv2.id,
                        amount=500.00,
                        payment_method="UPI",
                        reference="UPI-9923847101",
                        notes="Advance token transfer received",
                    ),
                )

        # --- Seed Apex Wholesalers ---
        apex = await organization_repo.get_by_slug(session, "apex")
        if not apex:
            apex = await organization_repo.create(
                session,
                obj_in=OrganizationCreate(
                    name="Apex Wholesalers",
                    slug="apex",
                    currency="INR",
                ),
            )
            await user_repo.create_user(
                session,
                obj_in=UserCreate(
                    name="Bob Manager",
                    email="bob@apex.local",
                    role="warehouse_manager",
                ),
                organization_id=apex.id,
            )
        elif apex.currency != "INR":
            apex.currency = "INR"
            await session.commit()

        # Seed RBAC users for Apex
        apex_users = [
            ("Sunil Admin", "sunil@apex.local", "admin"),
            ("Bob Manager", "bob@apex.local", "warehouse_manager"),
            ("Kavita Sales", "kavita@apex.local", "sales_rep"),
            ("Deepak Auditor", "deepak@apex.local", "viewer"),
        ]
        existing_apex_users = await user_repo.list_by_organization(session, apex.id)
        existing_apex_emails = {u.email for u in existing_apex_users}
        for u_name, u_email, u_role in apex_users:
            if u_email not in existing_apex_emails:
                await user_repo.create_user(
                    session,
                    obj_in=UserCreate(name=u_name, email=u_email, role=u_role),
                    organization_id=apex.id,
                )

        # Warehouses for Apex
        wh_apx_main = await warehouse_repo.get_by_code(session, organization_id=apex.id, code="WH-APX-01")
        if not wh_apx_main:
            wh_apx_main = await warehouse_repo.create_warehouse(
                session,
                obj_in=WarehouseCreate(
                    name="Apex Metro Hub",
                    code="WH-APX-01",
                    location="Berlin Logistics Center, DE",
                    is_default=True,
                ),
                organization_id=apex.id,
            )

        wh_apx_port = await warehouse_repo.get_by_code(session, organization_id=apex.id, code="WH-APX-02")
        if not wh_apx_port:
            wh_apx_port = await warehouse_repo.create_warehouse(
                session,
                obj_in=WarehouseCreate(
                    name="Apex Port Center",
                    code="WH-APX-02",
                    location="Hamburg Port Terminal, DE",
                    is_default=False,
                ),
                organization_id=apex.id,
            )

        cat_bev = await category_repo.get_by_name(session, organization_id=apex.id, name="Beverages & Roasts")
        if not cat_bev:
            cat_bev = await category_repo.create(
                session,
                obj_in=CategoryCreate(name="Beverages & Roasts", description="Wholesale beverage supplies"),
                organization_id=apex.id,
            )

        p_cf = await product_repo.get_by_sku(session, organization_id=apex.id, sku="APX-CF-101")
        if not p_cf:
            p_cf = await product_repo.create_product(
                session,
                obj_in=ProductCreate(
                    name="Artisan Dark Roast Coffee Beans 1kg",
                    sku="APX-CF-101",
                    description="Single-origin organic espresso beans",
                    unit="bag",
                    price=28.00,
                    cost_price=14.50,
                    reorder_point=30,
                    category_id=cat_bev.id,
                ),
                organization_id=apex.id,
            )

        p_tea = await product_repo.get_by_sku(session, organization_id=apex.id, sku="APX-TEA-102")
        if not p_tea:
            p_tea = await product_repo.create_product(
                session,
                obj_in=ProductCreate(
                    name="Organic Sencha Green Tea 500g",
                    sku="APX-TEA-102",
                    description="Loose leaf Japanese green tea wholesale pouch",
                    unit="pouch",
                    price=19.50,
                    cost_price=8.00,
                    reorder_point=20,
                    category_id=cat_bev.id,
                ),
                organization_id=apex.id,
            )

        if (await inventory_repo.get_stock_level(session, organization_id=apex.id, product_id=p_cf.id)) == 0:
            await inventory_repo.record_movement(
                session,
                organization_id=apex.id,
                product_id=p_cf.id,
                warehouse_id=wh_apx_main.id,
                movement_type="IN",
                quantity_change=120,
                reference="Roastery Receiving",
            )

        if (await inventory_repo.get_stock_level(session, organization_id=apex.id, product_id=p_tea.id)) == 0:
            await inventory_repo.record_movement(
                session,
                organization_id=apex.id,
                product_id=p_tea.id,
                warehouse_id=wh_apx_main.id,
                movement_type="IN",
                quantity_change=8,
                reference="Direct Import Batch",
            )

        # Seed Customers for Apex
        c_tokai = await customer_repo.get_by_email(session, organization_id=apex.id, email="sourcing@bluetokai.in")
        if not c_tokai:
            c_tokai = await customer_repo.create_customer(
                session,
                obj_in=CustomerCreate(
                    name="Blue Tokai Artisanal Roasters",
                    email="sourcing@bluetokai.in",
                    phone="+91 91100 54321",
                    company="Blue Tokai Coffee",
                    billing_address="Plot 24, Saidulajab, Saket, New Delhi, DL",
                    shipping_address="Central Roastery, Okhla Phase III, New Delhi, DL",
                ),
                organization_id=apex.id,
            )

        # Seed an initial CONFIRMED order for Apex if none exist
        apex_orders = await order_repo.list_orders(session, organization_id=apex.id)
        if not apex_orders:
            apex_order_in = SalesOrderCreate(
                customer_id=c_tokai.id,
                warehouse_id=wh_apx_main.id,
                notes="Weekly wholesale roast bean shipment",
                items=[
                    OrderItemCreate(product_id=p_cf.id, quantity=10, unit_price=28.00),
                ],
            )
            new_apex_order = await order_service.create_order(session, organization_id=apex.id, obj_in=apex_order_in)
            await order_service.confirm_order(session, organization_id=apex.id, order_id=new_apex_order.id)

        # Seed Suppliers for Apex
        s_coorg = await supplier_repo.get_by_email(session, organization_id=apex.id, email="estate@coorgcoffee.in")
        if not s_coorg:
            s_coorg = await supplier_repo.create_supplier(
                session,
                obj_in=SupplierCreate(
                    name="Coorg Specialty Coffee Estates",
                    email="estate@coorgcoffee.in",
                    phone="+91 94801 22334",
                    company="Coorg Plantation Group",
                    address="Siddapur Road, Madikeri, Kodagu, KA",
                    payment_terms="Immediate",
                ),
                organization_id=apex.id,
            )

        s_darjeeling = await supplier_repo.get_by_email(session, organization_id=apex.id, email="tea@darjeelingorganic.in")
        if not s_darjeeling:
            s_darjeeling = await supplier_repo.create_supplier(
                session,
                obj_in=SupplierCreate(
                    name="Darjeeling Organic Tea Growers",
                    email="tea@darjeelingorganic.in",
                    phone="+91 97330 88990",
                    company="Makaibari Tea Consortium",
                    address="Tea Garden Road, Kurseong, Darjeeling, WB",
                    payment_terms="Net 15",
                ),
                organization_id=apex.id,
            )

        # Seed an initial ISSUED PO for Apex if none exist
        apex_pos = await purchase_order_repo.list_pos(session, organization_id=apex.id)
        if not apex_pos:
            apex_po_in = PurchaseOrderCreate(
                supplier_id=s_coorg.id,
                destination_warehouse_id=wh_apx_main.id,
                notes="Seasonal Arabica parchment delivery",
                items=[
                    PurchaseOrderItemCreate(product_id=p_cf.id, quantity=40, unit_cost=14.00),
                ],
            )
            new_apex_po = await purchase_order_service.create_po(session, organization_id=apex.id, obj_in=apex_po_in)
            await purchase_order_service.issue_po(session, organization_id=apex.id, po_id=new_apex_po.id)

        # Seed initial shipment for Apex if none exist
        apex_shipments = await shipment_repo.list_shipments(session, organization_id=apex.id)
        if not apex_shipments:
            apex_all_orders = await order_repo.list_orders(session, organization_id=apex.id)
            if apex_all_orders:
                target_apex_order = apex_all_orders[0]
                shp_apx = await shipment_service.create_shipment(
                    session,
                    organization_id=apex.id,
                    obj_in=ShipmentCreate(
                        order_id=target_apex_order.id,
                        carrier="DTDC",
                        tracking_number="DTDC-99214088",
                        shipping_cost=650.00,
                        origin_address=f"{wh_apx_main.name}, Bengaluru, KA",
                        destination_address=c_tokai.shipping_address or "Okhla Phase III, New Delhi, DL",
                        notes="Roasted bean cartons - fragile packaging",
                    ),
                )
                await shipment_service.dispatch_shipment(
                    session,
                    organization_id=apex.id,
                    shipment_id=shp_apx.id,
                    update_in=ShipmentStatusUpdate(
                        location="Nelamangala Gateway Hub, Bengaluru",
                        description="Dispatched on express linehaul to Delhi Hub",
                    ),
                )
                await shipment_service.mark_out_for_delivery(
                    session,
                    organization_id=apex.id,
                    shipment_id=shp_apx.id,
                    update_in=ShipmentStatusUpdate(
                        location="Okhla Delivery Hub, South Delhi",
                        description="Out for delivery with courier agent",
                    ),
                )
        # Seed initial invoice for Apex if none exist
        apex_invoices = await invoice_repo.list_invoices(session, organization_id=apex.id)
        if not apex_invoices:
            apex_all_orders = await order_repo.list_orders(session, organization_id=apex.id)
            target_apex_order = next((o for o in apex_all_orders if o.status in ["CONFIRMED", "FULFILLED"]), None)
            if target_apex_order:
                await invoice_service.create_invoice_from_order(
                    session,
                    organization_id=apex.id,
                    order_id=target_apex_order.id,
                    tax_rate=18.0,
                )

        # Seed initial notification for Apex if none exist
        apex_notifs = await notification_repo.list_notifications(session, organization_id=apex.id, limit=5)
        if not apex_notifs:
            await notification_service.create_notification(
                session,
                organization_id=apex.id,
                title="Order Out for Delivery: #DTDC-99214088",
                message="Consignment #DTDC-99214088 is out for delivery with local courier agent.",
                type="INFO",
                link="/shipments",
            )

        # --- Seed Samsung Electronics India Ltd ---
        samsung = await organization_repo.get_by_slug(session, "samsung")
        if not samsung:
            samsung = await organization_repo.create(
                session,
                obj_in=OrganizationCreate(
                    name="Samsung Electronics India Ltd",
                    slug="samsung",
                    currency="INR",
                ),
            )
            await user_repo.create_user(
                session,
                obj_in=UserCreate(
                    name="Min-Jun Park",
                    email="director@samsung.local",
                    role="admin",
                ),
                organization_id=samsung.id,
            )
        elif samsung.currency != "INR":
            samsung.currency = "INR"
            await session.commit()

        # Seed RBAC users for Samsung
        samsung_users = [
            ("Min-Jun Park", "director@samsung.local", "admin"),
            ("Karan Sharma", "karan.s@samsung.local", "warehouse_manager"),
            ("Ananya Rao", "ananya.r@samsung.local", "sales_rep"),
            ("Rajesh Nair", "rajesh.n@samsung.local", "viewer"),
        ]
        existing_samsung_users = await user_repo.list_by_organization(session, samsung.id)
        existing_samsung_emails = {u.email for u in existing_samsung_users}
        for u_name, u_email, u_role in samsung_users:
            if u_email not in existing_samsung_emails:
                await user_repo.create_user(
                    session,
                    obj_in=UserCreate(name=u_name, email=u_email, role=u_role),
                    organization_id=samsung.id,
                )

        # Warehouses for Samsung
        wh_sms_noida = await warehouse_repo.get_by_code(session, organization_id=samsung.id, code="WH-SMS-01")
        if not wh_sms_noida:
            wh_sms_noida = await warehouse_repo.create_warehouse(
                session,
                obj_in=WarehouseCreate(
                    name="Samsung Noida Mega Plant & Central DC",
                    code="WH-SMS-01",
                    location="B-1, Sector 81, Phase II, Noida, UP",
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
                    is_default=False,
                ),
                organization_id=samsung.id,
            )

        # Product Categories for Samsung
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

        cat_semi = await category_repo.get_by_name(session, organization_id=samsung.id, name="Semiconductors & Storage")
        if not cat_semi:
            cat_semi = await category_repo.create(
                session,
                obj_in=CategoryCreate(name="Semiconductors & Storage", description="NVMe SSDs, V-NAND memory modules and microcontrollers"),
                organization_id=samsung.id,
            )

        cat_appl = await category_repo.get_by_name(session, organization_id=samsung.id, name="Bespoke AI Home Appliances")
        if not cat_appl:
            cat_appl = await category_repo.create(
                session,
                obj_in=CategoryCreate(name="Bespoke AI Home Appliances", description="AI WindFree Inverter ACs and smart refrigerators"),
                organization_id=samsung.id,
            )

        # Products for Samsung
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

        p_ssd = await product_repo.get_by_sku(session, organization_id=samsung.id, sku="SMS-SSD-2TB")
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
                    category_id=cat_semi.id,
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

        # Seed Initial Stock Movements for Samsung in WH-SMS-01 (Noida)
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

        if (await inventory_repo.get_stock_level(session, organization_id=samsung.id, product_id=p_ssd.id, warehouse_id=wh_sms_noida.id)) < 100:
            await inventory_repo.record_movement(
                session,
                organization_id=samsung.id,
                product_id=p_ssd.id,
                warehouse_id=wh_sms_noida.id,
                movement_type="IN",
                quantity_change=300,
                reference="Semiconductor Inbound Hwaseong Fab",
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

        # Seed demo transfers for Samsung
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

        # Seed Customers for Samsung
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

        # Seed Suppliers for Samsung
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

        # Seed Purchase Orders for Samsung
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
                        PurchaseOrderItemCreate(product_id=p_ssd.id, quantity=100, unit_cost=12000.00),
                    ],
                ),
            )
            await purchase_order_service.issue_po(session, organization_id=samsung.id, po_id=po_sms_1.id)

        # Seed Sales Orders for Samsung
        samsung_orders = await order_repo.list_orders(session, organization_id=samsung.id)
        if not samsung_orders:
            # Order 1: Reliance Digital
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

            # Order 2: Croma
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

            # Seed Shipments for Samsung
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

            # Seed Invoices for Samsung
            inv_ril = await invoice_service.create_invoice_from_order(
                session,
                organization_id=samsung.id,
                order_id=order_ril.id,
                tax_rate=18.0,
            )
            # Record partial payment for Reliance invoice
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
            # Record full payment for Croma invoice
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

        # Seed Notifications and Audit Logs for Samsung
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
                user_name="Karan Sharma",
            )
            await audit_service.log_action(
                session,
                organization_id=samsung.id,
                action="ORDER_CONFIRMED",
                entity_type="Order",
                entity_name="Reliance Retail B2B Order",
                details="Confirmed enterprise order for 30x S24 Ultra and 8x Neo QLED 8K. Reserved in WH-SMS-01.",
                user_name="Ananya Rao",
            )
            await audit_service.log_action(
                session,
                organization_id=samsung.id,
                action="PAYMENT_RECORDED",
                entity_type="Payment",
                entity_name="UTR-RIL-HDFC-990812",
                details="Advance payment of ₹35,00,000.00 posted against Reliance Retail Tax Invoice.",
                user_name="Min-Jun Park",
            )

        print("Demo seed with warehouses, transfers, customers, suppliers, POs, shipments, invoices, notifications, and audit logs complete.")


if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_demo_data())
