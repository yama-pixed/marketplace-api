# Marketplace API — Testing Plan

> **Base URL:** `https://marketplace-api-19it.onrender.com/api`
> **Docs URL:** `https://marketplace-api-19it.onrender.com/api/docs`
> Open the Docs URL in your browser to access Swagger UI for all tests.

**GitHub:** https://github.com/yama-pixed/marketplace-api
**Live API:** https://marketplace-api-19it.onrender.com
**Swagger Docs:** https://marketplace-api-19it.onrender.com/api/docs

---

## Seed Credentials

| User  | Email               | Password     | Role  | ID |
|-------|---------------------|--------------|-------|----|
| Admin | admin@example.com   | Admin123!    | ADMIN | 1  |
| Alice | alice@example.com   | Password123! | USER  | 2  |
| Bob   | bob@example.com     | Password123! | USER  | 3  |

---

## How to Authorize in Swagger UI

1. Call POST /auth/login with any credentials below.
2. Copy the token value from the response.
3. Click the Authorize button at the top of Swagger UI.
4. Enter: Bearer <paste_token_here> → click Authorize → Close.

---

## 1. Auth Endpoints

### POST /auth/signup
Access Control: Public

Success — 201 Created:
- Click Try it out
- Body: { "email": "newuser@example.com", "password": "Password123!", "name": "New User" }
- Expect 201 with a user object and token

400 Bad Request — Missing field:
- Body: { "email": "test@example.com" }
- Expect 400 — "email, password, and name are required"

409 Conflict — Duplicate email:
- Body: { "email": "alice@example.com", "password": "Password123!", "name": "Alice Clone" }
- Expect 409 — "Email already in use"

---

### POST /auth/login
Access Control: Public

Success — 200 OK:
- Body: { "email": "alice@example.com", "password": "Password123!" }
- Expect 200 with user and token

400 Bad Request — Missing field:
- Body: { "email": "alice@example.com" }
- Expect 400

401 Unauthorized — Wrong password:
- Body: { "email": "alice@example.com", "password": "wrongpassword" }
- Expect 401 — "Invalid credentials"

401 Unauthorized — Non-existent email:
- Body: { "email": "nobody@example.com", "password": "Password123!" }
- Expect 401

---

## 2. Users Endpoints

### GET /users
Access Control: Admin only
Setup: Login as admin@example.com / Admin123! → Authorize with token

Success — 200 OK:
- Click Try it out → Execute
- Expect 200 array of all users

401 Unauthorized:
- Remove JWT from Authorize
- Execute → Expect 401

403 Forbidden:
- Login as alice@example.com / Password123! → Authorize
- Execute → Expect 403 — "Admin access required"

---

### GET /users/{id}
Access Control: Admin or the user themselves

Success — Admin viewing any user:
- Login as Admin → Authorize
- Set id = 2
- Expect 200 with Alice's data

Success — User viewing self:
- Login as Alice → Authorize
- Set id = 2
- Expect 200

400 Bad Request:
- Set id = -10
- Expect 400 — "Invalid user ID"

401 Unauthorized:
- Remove JWT → Execute with id = 2
- Expect 401

403 Forbidden:
- Login as Bob (id: 3) → Authorize
- Set id = 2 (Alice's ID)
- Expect 403

404 Not Found:
- Login as Admin → id = 9999
- Expect 404

---

### PUT /users/{id}
Access Control: Admin or self
Setup: Login as alice@example.com / Password123! → Authorize

Success — User updates self:
- Set id = 2
- Body: { "name": "Alice Updated" }
- Expect 200 with updated user

400 Bad Request — No fields:
- Body: {}
- Expect 400

401 Unauthorized:
- Remove JWT → Expect 401

403 Forbidden:
- Login as Bob → id = 2
- Body: { "name": "Hacked" }
- Expect 403

404 Not Found:
- Login as Admin → id = 9999
- Body: { "name": "Ghost" }
- Expect 404

409 Conflict:
- Login as Alice → id = 2
- Body: { "email": "bob@example.com" }
- Expect 409 — email already taken

---

### DELETE /users/{id}
Access Control: Admin only
Setup: Login as admin@example.com / Admin123! → Authorize

Success — 200 OK:
- First create a throwaway user via POST /auth/signup
- Note their ID from the response
- Set id = that new user's ID
- Expect 200 — "User deleted successfully"

401 Unauthorized:
- Remove JWT → Expect 401

403 Forbidden:
- Login as Alice → id = 3
- Expect 403

404 Not Found:
- Login as Admin → id = 9999
- Expect 404

---

## 3. Items Endpoints

### GET /items
Access Control: Public

Success — 200 OK:
- No auth required
- Execute → Expect 200 array of all items (Laptop, Headphones, Keyboard, Monitor)

---

### GET /items/{id}
Access Control: Public

Success — 200 OK:
- id = 1
- Expect 200 with Laptop details

400 Bad Request:
- id = -5
- Expect 400

404 Not Found:
- id = 9999
- Expect 404

---

### POST /items
Access Control: Any authenticated user
Setup: Login as bob@example.com / Password123! → Authorize

Success — 201 Created:
- Body: { "title": "USB Hub", "description": "7-port USB 3.0 hub", "price": 35.99, "quantity": 20 }
- Expect 201 with the new item (sellerId = Bob's id)

400 Bad Request — Missing title:
- Body: { "price": 10.00 }
- Expect 400

400 Bad Request — Negative price:
- Body: { "title": "Bad Item", "price": -5 }
- Expect 400

401 Unauthorized:
- Remove JWT → Execute
- Expect 401

---

### PUT /items/{id}
Access Control: Seller (owner) or Admin
Setup: Login as alice@example.com / Password123! → Authorize (Alice owns items 1–3)

Success — Owner updates own item:
- id = 1
- Body: { "title": "Gaming Laptop", "price": 1350.00 }
- Expect 200 with updated item

400 Bad Request — No fields:
- Body: {}
- Expect 400

401 Unauthorized:
- Remove JWT → id = 1
- Expect 401

403 Forbidden:
- Login as Bob → id = 1 (Alice's item)
- Body: { "title": "Stolen" }
- Expect 403

404 Not Found:
- Login as Alice → id = 9999
- Body: { "title": "Ghost" }
- Expect 404

Success — Admin updates any item:
- Login as Admin → id = 4 (Bob's monitor)
- Body: { "price": 550.00 }
- Expect 200

---

### DELETE /items/{id}
Access Control: Seller (owner) or Admin
Setup: Login as bob@example.com / Password123! → Authorize (Bob owns item 4)

Success — Owner deletes own item:
- First create a new item as Bob via POST /items
- Note the returned item id
- Set id = that new item's id
- Expect 200

401 Unauthorized:
- Remove JWT → Expect 401

403 Forbidden:
- Login as Bob → id = 1 (Alice's item)
- Expect 403

404 Not Found:
- Login as Admin → id = 9999
- Expect 404

---

## 4. Orders Endpoints

### GET /orders
Access Control: Admin sees all; Users see only their own

As Admin:
- Login as admin@example.com / Admin123! → Authorize
- Execute → Expect 200 with all orders in the system

As Regular User (Bob):
- Login as bob@example.com / Password123! → Authorize
- Execute → Expect 200 with only Bob's orders

401 Unauthorized:
- Remove JWT → Expect 401

---

### GET /orders/{id}
Access Control: Buyer (owner) or Admin
Setup: Login as bob@example.com / Password123! → Authorize (Bob placed order id: 1)

Success — Buyer views own order:
- id = 1
- Expect 200 with full order details

400 Bad Request:
- id = -3
- Expect 400

401 Unauthorized:
- Remove JWT → Expect 401

403 Forbidden:
- Login as Alice → id = 1 (Bob's order)
- Expect 403

404 Not Found:
- Login as Admin → id = 9999
- Expect 404

---

### POST /orders
Access Control: Any authenticated user
Setup: Login as alice@example.com / Password123! → Authorize

Success — Place order:
- Body: { "items": [{ "itemId": 3, "quantity": 1 }] }
- Expect 201 with new order, correct total

400 Bad Request — Empty items:
- Body: { "items": [] }
- Expect 400

400 Bad Request — quantity less than 1:
- Body: { "items": [{ "itemId": 1, "quantity": 0 }] }
- Expect 400

400 Bad Request — Insufficient stock:
- Body: { "items": [{ "itemId": 1, "quantity": 9999 }] }
- Expect 400 — "Insufficient stock"

404 Not Found — Item doesn't exist:
- Body: { "items": [{ "itemId": 9999, "quantity": 1 }] }
- Expect 404

401 Unauthorized:
- Remove JWT → Expect 401

---

### PUT /orders/{id}
Access Control: Admin can set any status; Owner can only cancel

As Admin — Update status:
- Login as admin@example.com / Admin123! → Authorize
- id = 1
- Body: { "status": "SHIPPED" }
- Expect 200 with updated status

As Owner — Cancel own order:
- Login as bob@example.com / Password123! → Authorize
- id = 1
- Body: { "status": "CANCELLED" }
- Expect 200

403 Forbidden — Owner tries non-cancel status:
- Login as Bob → id = 1
- Body: { "status": "SHIPPED" }
- Expect 403

400 Bad Request — Invalid status:
- Login as Admin → Body: { "status": "FLOWN" }
- Expect 400

401 Unauthorized:
- Remove JWT → Expect 401

403 Forbidden — Non-owner:
- Login as Alice → id = 1 (Bob's order)
- Body: { "status": "CANCELLED" }
- Expect 403

404 Not Found:
- Login as Admin → id = 9999
- Body: { "status": "SHIPPED" }
- Expect 404

---

### DELETE /orders/{id}
Access Control: Admin only
Setup: Login as admin@example.com / Admin123! → Authorize

Success — 200 OK:
- Create a fresh order first (login as Alice, POST /orders with itemId: 3)
- Note the returned order id
- Login as Admin → id = new order id
- Expect 200 — "Order deleted successfully"

401 Unauthorized:
- Remove JWT → Expect 401

403 Forbidden:
- Login as Bob → id = 1
- Expect 403

404 Not Found:
- Login as Admin → id = 9999
- Expect 404