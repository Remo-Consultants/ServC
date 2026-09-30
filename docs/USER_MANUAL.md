# ServC Auto India — User Manual

## Staff Workshop Dashboard

### Sign in
1. Open `/login`
2. Choose **Staff Login**
3. Use your company email and password

### Dashboard
Shows open jobs, ready vehicles, today’s bookings, month revenue, outstanding dues, GST summary, and technician workload.

### Customers
- Search by name, phone, or GSTIN
- Create customers with WhatsApp opt-in and state code (needed for IGST vs CGST/SGST)

### Vehicles
- Registration must match Indian formats (e.g. `MH12AB1234`)
- Track insurance & PUC expiry (colour-coded)

### Bookings
- View calendar list of appointments
- **Check In → Job Card** creates a digital job card + inspection checklist

### Job Cards
Status pipeline: **Requested → Confirmed → In Progress → Quality Check → Ready → Delivered**

On a job card you can:
1. Complete digital inspection (Passed / Attention / Critical)
2. Send estimate via WhatsApp
3. After customer approval, generate GST invoice
4. Update status (customer gets WhatsApp updates)

### Inventory
- Filter low-stock SKUs
- Parts tagged OEM / Aftermarket / Local Market with HSN codes

### Invoices & Payments
- Tax invoices show CGST/SGST or IGST
- UPI payments appear under Payments with transaction IDs

### Reports
GSTR-1 style B2B vs B2C split and HSN/SAC summary for accountants.

---

## Customer Portal

### Sign in
1. **Customer OTP** tab
2. Enter 10-digit mobile
3. Enter OTP (demo: `123456`)

### Features
- View linked vehicles
- Book a service
- Live progress tracker
- Approve estimates from WhatsApp link (`/portal/estimates/{token}`)
- Pay invoices via UPI (`/portal/pay/{id}`)

### Estimate approval
Customers can approve or reject individual line items before work proceeds.

---

## Roles at a glance

| Role | Typical access |
|------|----------------|
| Super Admin | All tenants, audit |
| Company Owner | Pricing, branches, finance |
| Branch Manager | Bay & technician assignment |
| Service Advisor | Customers, bookings, estimates, invoices |
| Technician | Assigned jobs, inspection |
| Inventory Manager | Parts, POs, stock |
| Accountant | GST reports, payments |
| Customer | Portal only |
