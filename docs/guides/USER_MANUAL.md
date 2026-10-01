# ServC Auto India — User Manual

Operator guide for the workshop OS: staff dashboard, role journeys, and customer portal.

---

## Staff workshop dashboard

### Sign in
1. Open `/login`
2. Choose **Staff Login**
3. Use your company email and password (demo: `ServC@123`)

### Dashboard
Shows open jobs, ready vehicles, today’s bookings, month revenue, outstanding dues, GST summary, sales vs OpEx charts, and technician workload.

### Customers
- Search by name, phone, or GSTIN
- Create customers with WhatsApp opt-in and state code (needed for IGST vs CGST/SGST)

### Vehicles
- Registration must match Indian formats (e.g. `MH12AB1234`)
- Track insurance & PUC expiry (colour-coded)

### Bookings
- View calendar list of appointments
- **Check In → Job Card** creates a digital job card + inspection checklist

### Job cards
Status pipeline: **Requested → Confirmed → In Progress → Quality Check → Ready → Delivered**

On a job card you can:
1. Complete digital inspection (Passed / Attention / Critical)
2. Build a line-item estimate (labour + parts, HSN/SAC)
3. Send estimate via WhatsApp for approval
4. After customer approval, generate GST invoice
5. Update status (customer gets WhatsApp updates)

### Inventory
- Filter low-stock SKUs
- Parts tagged OEM / Aftermarket / Local Market with HSN codes
- Raise purchase orders when stock hits reorder points

### Invoices & payments
- Tax invoices show CGST/SGST or IGST by place of supply
- Customer GSTIN captured for ITC where applicable
- UPI payments appear under Payments with transaction IDs
- Partial payments supported until the invoice is closed

### Reports
GSTR-1 style B2B vs B2C split and HSN/SAC summary for accountants.

### Expenses (OpEx)
Record rent, utilities, payroll, and other operating costs so the dashboard can chart sales vs expenses.

---

## Customer portal

### Sign in
1. **Customer OTP** tab
2. Enter 10-digit mobile
3. Enter OTP (demo: `123456`)

### Features
- View linked vehicles
- Book a service
- Live progress tracker
- Approve estimates from WhatsApp / portal link (`/portal/estimates/{token}`)
- Pay invoices via UPI (`/portal/pay/{id}`)

### Estimate approval
Customers can approve or reject individual line items before work proceeds.

---

## Roles at a glance

| Role | Typical access |
|------|----------------|
| Super Admin | All tenants, audit |
| Company Owner | Pricing, branches, finance, analytics |
| Branch Manager | Bay & technician assignment |
| Service Advisor | Customers, bookings, estimates, invoices |
| Technician | Assigned jobs, inspection |
| Inventory Manager | Parts, POs, stock |
| Accountant | GST reports, payments |
| Customer | Portal only |

---

## Demo accounts

| Role | Login | Credential |
|------|-------|------------|
| Owner | `owner@servc.in` | Password `ServC@123` |
| Manager | `manager@servc.in` | Password `ServC@123` |
| Advisor | `advisor@servc.in` | Password `ServC@123` |
| Technician | `tech1@servc.in` | Password `ServC@123` |
| Inventory | `inventory@servc.in` | Password `ServC@123` |
| Accountant | `accounts@servc.in` | Password `ServC@123` |
| Super Admin | `admin@servc.in` | Password `ServC@123` |
| Customer | `9876543210` | OTP `123456` |

See also the [role demo gallery](../demo.html) for screenshot walkthroughs.
