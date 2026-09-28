# Backend Feature Inventory

**Scope:** Static review of the frontend and neighboring Spring Boot backend source. No services or database were run as part of this review.

## 1. UI Scanned

In-scope routes and shared code:

- `/table/[qrToken]` — QR table ordering
- `/order/[orderId]` — order confirmation and status display
- Shared navigation in `app/layout.tsx`
- API client in `lib/api.ts`

Explicitly excluded from analysis: `/` (Home), `/admin/tables`, and `/admin/menu`. No other manager, KDS, customer, payment, analytics, reporting, or delivery routes exist outside those excluded screens.

## 2. Feature Inventory

| UI feature | Current state | Backend requirement / finding | Realtime |
|---|---|---|---|
| QR table identification | **Already Functional** | The route resolves its token through `GET /api/tables/{qrToken}`. The backend checks that the table is active and returns its restaurant. | No |
| Menu and category display | **Partially Implemented** | Existing APIs return menu and categories globally rather than for the QR table's restaurant. Inactive categories are returned and displayed. | No |
| Cart and quantities | **Frontend Only** | Held in React state until submission; no backend cart is needed for the current flow. A refresh loses the cart. | No |
| Order creation | **Already Functional** | `POST /api/orders` persists an order and its items, checks table/restaurant association and item availability, and calculates prices from the database. | No |
| Order confirmation and status | **Partially Implemented** | `GET /api/orders/{id}` returns the order and status. There is no status mutation API, so the displayed progress cannot advance through this backend. The page has manual refresh, not automatic updates. | No |
| Pay at Counter option | **Frontend Only** | Checkout displays the option but does not include it in the order request or persist it. No payment processor flow is present. | No |
| Special instructions, customer identity, order history, delivery/location | **Not present in scoped UI** | No backend feature or entity is required based on these routes. | No |

No mock or hardcoded data was found in the two scanned routes. No KDS or staff screen is present in the in-scope routes, so this report does not infer queue or staff-management requirements from the excluded Home screen.

## 3. Existing Backend Functionality

Current route-to-backend mappings:

- QR lookup: frontend `getTableByQrToken` → `TableController` → `TableService` → `RestaurantTableRepository` → `restaurant_tables` and `restaurants`.
- Menu/categories: frontend `getMenu` and `getCategories` → `MenuController` / `CategoryController` → services and repositories → `menu_items` and `categories`.
- Order creation: frontend `createOrder` → `OrderController` → `OrderService` → order, table, restaurant, and menu repositories → `orders` and `order_items`.
- Order detail: frontend `getOrderById` → `OrderController` → `OrderService` → `OrderRepository` → `orders` and `order_items`.

The frontend and backend agree on the current order request fields (`restaurantId`, `tableId`, `items[{menuItemId, quantity}]`) and the detail fields consumed by the order page (`id`, `tableNumber`, `status`, `totalAmount`, `items`). Existing order statuses are `PENDING`, `CONFIRMED`, `PREPARING`, `READY`, `COMPLETED`, and `CANCELLED`.

## 4. Missing Backend Features and APIs

### P0 — Restaurant-scoped customer menu

The QR route knows the table's restaurant but calls global menu/category endpoints. `Category` and `MenuItem` have no restaurant relationship, and order creation does not verify that an item belongs to the table's restaurant. This is safe only if the data is intentionally single-restaurant.

```text
GET
/api/restaurants/{restaurantId}/categories

Purpose: Load active categories for the scanned table's restaurant.
Request: None.
Response: [{ id, name, active }].
Used by: QR table ordering.
```

```text
GET
/api/restaurants/{restaurantId}/menu

Purpose: Load available items in active categories for that restaurant.
Request: None.
Response: [{ id, name, description, price, imageUrl, available, category }].
Used by: QR table ordering.
```

This requires associating categories with a restaurant (menu items can inherit that association through their category), and validating order items against the restaurant on order creation. Existing global endpoints can remain for their current consumers.

### P1 — Order status progression

The backend stores the statuses shown by the order page but exposes no status mutation endpoint. Add a status update operation with allowed-transition validation:

```text
PATCH
/api/orders/{id}/status

Purpose: Advance or cancel an order and return the updated order.
Request: { "status": "PREPARING" }
Response: OrderResponse with the updated status.
Used by: An order-management actor; the in-scope order page can then display it after refresh.
```

There is no in-scope staff screen to call this endpoint, so connecting a staff-side caller depends on UI outside this report's scope.

### P1 — Persist the counter-payment choice

Extend `POST /api/orders` with a payment method such as `COUNTER`, and persist that choice on `Order`. Add a payment status only if the application needs to track counter collection; no separate `Payment` entity or payment-processing endpoint is justified by the scanned UI.

```text
POST
/api/orders

Purpose: Create the order and record the selected counter-payment method.
Request: Existing order fields plus paymentMethod, for example "COUNTER".
Response: Existing OrderResponse, optionally including paymentMethod/paymentStatus.
Used by: QR checkout.
```

## 5. Required Database Entities

Already present: `Restaurant`, `RestaurantTable`, `Category`, `MenuItem`, `Order`, `OrderItem`, and `OrderStatus`. JPA currently manages schema updates through Hibernate; no SQL migration files were found.

Required changes: add restaurant ownership for categories/menu scoping, and optionally add counter-payment fields to `Order`. A `Customer` entity, standalone `Payment` entity, delivery entities, and staff entities are not supported by the scanned UI requirements.

## 6. Realtime and External Integrations

**Realtime:** None is required by the current in-scope UI. The order page explicitly offers manual status refresh. Although the backend includes Spring WebSocket and the frontend depends on `socket.io-client`, no active realtime configuration or client use was found in the scanned routes. If live status updates are later wanted, a single `ORDER_STATUS_CHANGED` event could update the order page; it is an enhancement, not an MVP dependency.

**External integrations:** No Razorpay, maps, delivery, or payment-provider integration is required by these routes. The backend creates UUID QR tokens, and the QR route consumes a token from its URL; no external QR service is needed for this flow.

## 7. Mismatches and Risks

- Menu/category APIs are global and do not enforce restaurant ownership; order creation likewise accepts any available menu item ID for a restaurant/table.
- Inactive categories are returned and shown by the customer menu route.
- The order status timeline has no backend update API; status refresh is manual.
- Pay at Counter is not sent to or recorded by the backend.
- The frontend defaults to `http://localhost:8080`, matching the backend's local port. Deployment requires `NEXT_PUBLIC_API_URL` to point at the deployed backend.
- The backend permits all requests and controllers use wildcard CORS. No authentication UI is present in the scanned routes, but this permissive setup should be reviewed before deployment.

## 8. Priority and Recommended Order

**P0:** Add restaurant-scoped category/menu data and enforce restaurant ownership during order creation. This makes QR ordering reliable when multiple restaurants exist.

**P1:** Add validated order status transitions and persist the Pay at Counter method. Connect the status mutation only to an authorized staff-facing caller when that UI is in scope.

**P2:** Consider live order-status updates. Manual refresh currently satisfies the visible behavior, so WebSocket/SSE is optional.

The existing QR lookup, menu/order reads, and order creation are already connected; the main backend work is restaurant scoping and completing the order lifecycle/payment metadata.
