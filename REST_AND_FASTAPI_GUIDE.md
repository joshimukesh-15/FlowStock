# 🚀 RESTful API & FastAPI: The High-Yield Learning Roadmap

> **The 80/20 Rule**: You don't need to know every RFC or advanced theory. Master these **core checklist items** to build and understand 95% of production backend APIs.

---

## 📋 Table of Contents
1. [What You Need vs. What You Can Skip](#-what-you-need-vs-what-you-can-skip)
2. [Phase 1: RESTful API Essentials](#1-restful-api-essentials-checklist)
3. [Phase 2: FastAPI Core Fundamentals](#2-fastapi-core-fundamentals-checklist)
4. [Phase 3: Database, Auth & Architecture](#3-database-auth--architecture-checklist)
5. [Phase 4: FlowStock Codebase Study Guide](#4-flowstock-codebase-study-guide)
6. [7-Day Practical Learning Plan](#5-7-day-practical-learning-plan)

---

## 🎯 What You Need vs. What You Can Skip

| ✅ Must Learn (High Yield) | ❌ Skip for Now (Low Yield / Fluff) |
| :--- | :--- |
| 5 HTTP Verbs (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) | Academic REST concepts (HATEOAS, XML, SOAP) |
| 8 Status Codes (`200`, `201`, `204`, `400`, `401`, `403`, `404`, `422`, `500`) | Obscure status codes (`418`, `302/307` deep theory) |
| JSON Request & Response Bodies | GraphQL or gRPC (learn REST first) |
| URL Resource Naming (plural nouns) | Over-complicated caching headers (`ETag`, `Vary`) |
| FastAPI `APIRouter` & Path Operations | Raw ASGI server implementations |
| Pydantic Schemas (`BaseModel`, `Field`, `ConfigDict`) | Complex metaclass programming |
| Dependency Injection (`Depends`) | Complex custom metaclasses / middleware chains |
| `async def` vs `def` with database operations | Premature microservice orchestration |
| JWT Authentication & Password Hashing | Complex OAuth2 federation (Google/GitHub SSO) |

---

## 1. RESTful API Essentials (Checklist)

### A. HTTP Methods & Semantics
- [ ] **`GET`**: Retrieve data. Must be **safe** (never modifies data) and **idempotent** (calling it 1 time or 100 times gives the same result).
  - *Example*: `GET /api/v1/products`
- [ ] **`POST`**: Create a new resource or trigger an action. Not idempotent.
  - *Example*: `POST /api/v1/orders`
- [ ] **`PUT`**: Replace an entire resource with new data. Idempotent.
  - *Example*: `PUT /api/v1/products/{id}`
- [ ] **`PATCH`**: Update only specific fields of a resource (partial update).
  - *Example*: `PATCH /api/v1/notifications/{id}/read`
- [ ] **`DELETE`**: Remove a resource. Idempotent.
  - *Example*: `DELETE /api/v1/products/{id}`

### B. The 8 HTTP Status Codes You Actually Use
- [ ] **`200 OK`**: Standard success (GET, PUT, PATCH).
- [ ] **`201 Created`**: Resource created successfully (POST).
- [ ] **`204 No Content`**: Success, but nothing returned in response body (DELETE).
- [ ] **`400 Bad Request`**: Client sent invalid data or violated a business rule (e.g., trying to withdraw more stock than on hand).
- [ ] **`401 Unauthorized`**: Missing or invalid authentication token (user not logged in).
- [ ] **`403 Forbidden`**: User is logged in, but lacks permission/role (e.g., Viewer trying to delete a Warehouse).
- [ ] **`404 Not Found`**: Resource does not exist.
- [ ] **`422 Unprocessable Entity`**: Request format/types invalid (FastAPI auto-generates this via Pydantic).
- [ ] **`500 Internal Server Error`**: Backend crashed due to an unhandled exception or code bug.

### C. Clean URL Structure Rules
- [ ] **Use plural nouns, never verbs**:
  - ✅ `/api/v1/products`
  - ❌ `/api/v1/getProducts`
  - ❌ `/api/v1/create_new_order`
- [ ] **Represent hierarchy with sub-resources**:
  - ✅ `GET /api/v1/warehouses/{id}/inventory`
- [ ] **Use query parameters for search, filtering, and pagination**:
  - ✅ `GET /api/v1/products?category=Smartphones&page=1&limit=20`

---

## 2. FastAPI Core Fundamentals (Checklist)

### A. Routing & Path Operations
- [ ] Know how to initialize FastAPI:
  ```python
  from fastapi import FastAPI
  app = FastAPI(title="My API")
  ```
- [ ] Know how to modularize with `APIRouter`:
  ```python
  from fastapi import APIRouter
  router = APIRouter(prefix="/products", tags=["Products"])

  @router.get("/")
  async def list_products():
      return [{"id": 1, "name": "Galaxy S24"}]
  ```
- [ ] Know the difference between:
  - **Path Parameters**: `/products/{product_id}`
  - **Query Parameters**: `/products?search=phone&limit=10`
  - **Request Body**: JSON payload sent via `POST`/`PUT`

### B. Pydantic Models (Data Validation & Serialization)
- [ ] **Request Model**: Validate incoming data types and required fields:
  ```python
  from pydantic import BaseModel, Field

  class ProductCreate(BaseModel):
      name: str = Field(min_length=2, max_length=100)
      price: float = Field(gt=0, description="Price must be positive")
      sku: str
  ```
- [ ] **Response Model**: Control what data leaves the server (hide passwords/sensitive data):
  ```python
  class ProductResponse(ProductCreate):
      id: str
      class Config:
          from_attributes = True  # Converts SQLAlchemy ORM object to JSON
  ```

### C. Dependency Injection (`Depends`) — FastAPI's Greatest Feature
- [ ] Understand that `Depends` runs helper logic *before* your endpoint function:
  ```python
  from fastapi import Depends

  async def get_db_session():
      db = SessionLocal()
      try:
          yield db
      finally:
          await db.close()

  @router.get("/items")
  async def get_items(db = Depends(get_db_session)):
      return await db.query(Item).all()
  ```
- [ ] Use `Depends` for:
  - Opening & closing database connections per request.
  - Validating JWT tokens and fetching the current logged-in user.
  - Enforcing tenant or RBAC role permissions.

### D. Error Handling
- [ ] Use `HTTPException` to return clean error responses:
  ```python
  from fastapi import HTTPException, status

  if not product:
      raise HTTPException(
          status_code=status.HTTP_404_NOT_FOUND,
          detail="Product not found"
      )
  ```

### E. Async vs. Sync
- [ ] Use `async def` when performing non-blocking I/O (database queries, network calls).
- [ ] Use `def` (standard sync) for CPU-bound tasks or non-async libraries (FastAPI automatically runs sync functions in a threadpool).

---

## 3. Database, Auth & Architecture (Checklist)

### A. Async SQLAlchemy ORM
- [ ] Understand the 3-layer architecture:
  1. **Endpoints (`/endpoints`)**: Receive HTTP request, call service/repo, return schema.
  2. **Schemas (`/schemas`)**: Pydantic models for validation and serialization.
  3. **Models (`/models`)**: Database tables defined in Python via SQLAlchemy.
  4. **Repositories/Services (`/repositories`)**: Actual database queries (`select()`, `insert()`).

### B. Authentication & Security
- [ ] **Password Hashing**: Never store plain text passwords; use `bcrypt` / `passlib`.
- [ ] **JWT (JSON Web Token)**:
  - User logs in with email + password -> Server verifies and returns an `access_token`.
  - Frontend stores token in `localStorage` or cookie.
  - Frontend sends token in every request: `Authorization: Bearer <token>`.
  - Server decodes token, extracts user ID, and verifies expiration.

---

## 4. FlowStock Codebase Study Guide

Your FlowStock project is an enterprise-grade reference. Read these exact files to see how theory is applied in production:

| Concept | File to Read in FlowStock | What to Look For |
| :--- | :--- | :--- |
| **API Endpoints** | [`backend/app/api/v1/endpoints/products.py`](backend/app/api/v1/endpoints/products.py) | How CRUD routes, query filters, and status codes are written. |
| **Dependency Injection** | [`backend/app/api/deps.py`](backend/app/api/deps.py) | How `get_db`, `get_current_tenant_id`, and `get_current_user` work. |
| **Auth & JWT** | [`backend/app/api/v1/endpoints/auth.py`](backend/app/api/v1/endpoints/auth.py) | Full signup, login, and `/me` token verification flow. |
| **Pydantic Schemas** | [`backend/app/schemas/product.py`](backend/app/schemas/product.py) | `ProductBase`, `ProductCreate`, `ProductUpdate`, `ProductRead`. |
| **Database Models** | [`backend/app/models/product.py`](backend/app/models/product.py) | `SQLAlchemy` table columns, foreign keys, and indexes. |
| **Automated Tests** | [`backend/tests/test_products.py`](backend/tests/test_products.py) | How `pytest` tests REST endpoints with `httpx.AsyncClient`. |

---

## 5. 7-Day Practical Learning Plan

- [ ] **Day 1: REST Fundamentals & Postman / Swagger**
  - Understand `GET`, `POST`, `PUT`, `DELETE`.
  - Open FlowStock's interactive Swagger UI: `http://127.0.0.1:8000/docs`.
  - Execute queries directly in Swagger and examine the response status codes.

- [ ] **Day 2: Pydantic Validation**
  - Write a small script with 2 Pydantic models (Create and Read).
  - Practice using `Field(gt=0, min_length=3)`.
  - Test what happens when invalid data is sent (notice the `422` error).

- [ ] **Day 3: FastAPI Routing & Parameters**
  - Create a simple router with 4 endpoints: list, get by ID, create, and delete.
  - Test path parameters (`/items/{id}`) and query parameters (`/items?sort=desc`).

- [ ] **Day 4: Dependency Injection (`Depends`)**
  - Write a dependency that checks for an `X-Api-Key` or `Authorization` header.
  - Attach the dependency to your endpoints using `Depends()`.

- [ ] **Day 5: Async Database Operations (SQLAlchemy)**
  - Read `backend/app/repositories/base.py` and `backend/app/models/product.py`.
  - Learn how `select()`, `session.add()`, and `await session.commit()` work.

- [ ] **Day 6: Authentication & Security**
  - Read `backend/app/core/security.py` and `backend/app/api/v1/endpoints/auth.py`.
  - Trace how a password is encrypted with `bcrypt` and how a JWT token is generated.

- [ ] **Day 7: Automated Testing with Pytest**
  - Run pytest in terminal: `pytest backend/tests/test_products.py`.
  - Write or modify one test case to verify an endpoint returns `200` or `404`.
