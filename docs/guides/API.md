# ServC Auto India — API Reference

Base URL: `http://localhost:3000`

All authenticated endpoints accept:

```
Authorization: Bearer <jwt>
```

or the `servc_token` HTTP-only cookie set on login.

## Response shape

```json
{ "success": true, "data": { } }
{ "success": false, "error": "message" }
```

---

## Auth

### POST `/api/auth/login`
```json
{ "email": "owner@servc.in", "password": "ServC@123" }
```

### POST `/api/auth/otp/request`
```json
{ "phone": "9876543210", "purpose": "LOGIN" }
```

### POST `/api/auth/otp/verify`
```json
{ "phone": "9876543210", "code": "123456" }
```

### GET `/api/auth/me`
Returns current user + company/branch.

### POST `/api/auth/logout`
Clears cookie.

---

## Customers

### GET `/api/customers?q=`
### POST `/api/customers`
```json
{
  "name": "Ravi Kumar",
  "phone": "9123456780",
  "gstin": "27AAAAA0000A1Z5",
  "state": "Maharashtra",
  "stateCode": "27",
  "source": "WALK_IN"
}
```

---

## Vehicles

### GET `/api/vehicles?customerId=&reg=`
### POST `/api/vehicles`
```json
{
  "customerId": "...",
  "registrationNo": "MH 12 AB 1234",
  "brand": "Maruti Suzuki",
  "model": "Swift",
  "fuelType": "PETROL",
  "currentMileage": 42000,
  "insuranceExpiry": "2026-11-15",
  "pucExpiry": "2026-06-30"
}
```

---

## Bookings

### GET `/api/bookings?from=&to=&status=`
### POST `/api/bookings`
```json
{
  "customerId": "...",
  "vehicleId": "...",
  "branchId": "...",
  "scheduledAt": "2026-04-01T10:00:00+05:30",
  "serviceType": "PERIODIC",
  "description": "Strange noise"
}
```

### POST `/api/bookings/:id/check-in`
Creates repair order + inspection checklist.

---

## Repair Orders

### GET `/api/repair-orders?status=`
### POST `/api/repair-orders`
### GET `/api/repair-orders/:id`
### PATCH `/api/repair-orders/:id`
```json
{ "status": "READY", "technicianId": "...", "bayId": "..." }
```

### PATCH `/api/repair-orders/:id/inspection`
```json
{
  "complete": true,
  "items": [{ "id": "...", "status": "ATTENTION", "notes": "..." }]
}
```

---

## Estimates

### POST `/api/estimates`
```json
{
  "repairOrderId": "...",
  "sendToCustomer": true,
  "lineItems": [
    {
      "type": "LABOR",
      "description": "Labour",
      "quantity": 1,
      "unitPrice": 1500,
      "gstRate": 18,
      "hsnSacCode": "998729"
    }
  ]
}
```

### GET `/api/estimates/approve/:token` (public)
### POST `/api/estimates/approve/:token` (public)
```json
{ "action": "approve", "approvedLineIds": ["..."] }
```

---

## Invoices & Payments

### GET `/api/invoices`
### POST `/api/invoices`
```json
{ "repairOrderId": "..." }
```
Creates GST invoice from **approved** line items and a UPI payment intent.

### GET `/api/payments/:id`
### POST `/api/payments/:id`
Confirms payment (demo) and updates invoice + customer LTV.

---

## Inventory

### GET `/api/inventory/parts?q=&lowStock=true`
### POST `/api/inventory/parts`

---

## Analytics

### GET `/api/analytics/dashboard`
### GET `/api/analytics/gst?from=&to=`

---

## GST calculation rules

- Same `stateCode` for seller & buyer → **INTRA** → CGST + SGST (each half of rate)
- Different state codes → **INTER** → IGST (full rate)
- Parts use **HSN**; labour uses **SAC** (default `998729`)
- Totals rounded to nearest rupee with `roundOff`
