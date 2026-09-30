import { PrismaClient } from "@prisma/client";
import { Role, FuelType, PartSource } from "../src/lib/roles";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding ServC Auto India demo data…");

  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.jobLineItem.deleteMany();
  await prisma.estimate.deleteMany();
  await prisma.inspectionItem.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.jobMedia.deleteMany();
  await prisma.repairOrder.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.vehicleActivity.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.stockItem.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.part.deleteMany();
  await prisma.laborService.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.bay.deleteMany();
  await prisma.otpToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.companySetting.deleteMany();
  await prisma.company.deleteMany();

  const passwordHash = await bcrypt.hash("ServC@123", 10);

  const company = await prisma.company.create({
    data: {
      name: "ServC Auto Care",
      legalName: "ServC Auto Care Private Limited",
      gstin: "27AABCS1234A1Z5",
      pan: "AABCS1234A",
      email: "hello@servc.in",
      phone: "02240001234",
      addressLine1: "12, MIDC Industrial Estate",
      city: "Pune",
      state: "Maharashtra",
      stateCode: "27",
      pincode: "411019",
      invoicePrefix: "INV",
      jobCardPrefix: "JC",
      estimatePrefix: "EST",
    },
  });

  const branch = await prisma.branch.create({
    data: {
      companyId: company.id,
      name: "ServC Pune — Baner",
      code: "PUN-BNR",
      phone: "02067001234",
      email: "baner@servc.in",
      addressLine1: "Baner Road, Near Symbiosis",
      city: "Pune",
      state: "Maharashtra",
      stateCode: "27",
      pincode: "411045",
      gstin: "27AABCS1234A1Z5",
    },
  });

  const bay1 = await prisma.bay.create({
    data: { companyId: company.id, branchId: branch.id, name: "Bay 1 — Quick Service", bayType: "QUICK_SERVICE" },
  });
  await prisma.bay.create({
    data: { companyId: company.id, branchId: branch.id, name: "Bay 2 — General", bayType: "GENERAL" },
  });
  await prisma.bay.create({
    data: { companyId: company.id, branchId: branch.id, name: "Bay 3 — Body Shop", bayType: "BODY_SHOP" },
  });

  const owner = await prisma.user.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      role: Role.COMPANY_OWNER,
      name: "Rajesh Patil",
      email: "owner@servc.in",
      phone: "9800000001",
      passwordHash,
      preferredLang: "en",
    },
  });

  const manager = await prisma.user.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      role: Role.BRANCH_MANAGER,
      name: "Sneha Deshmukh",
      email: "manager@servc.in",
      phone: "9800000002",
      passwordHash,
      preferredLang: "mr",
    },
  });

  const advisor = await prisma.user.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      role: Role.SERVICE_ADVISOR,
      name: "Amit Sharma",
      email: "advisor@servc.in",
      phone: "9800000003",
      passwordHash,
      preferredLang: "hi",
    },
  });

  const tech1 = await prisma.user.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      role: Role.TECHNICIAN,
      name: "Ramesh Kumar",
      email: "tech1@servc.in",
      phone: "9800000004",
      passwordHash,
      preferredLang: "hi",
    },
  });

  const tech2 = await prisma.user.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      role: Role.TECHNICIAN,
      name: "Suresh Yadav",
      email: "tech2@servc.in",
      phone: "9800000005",
      passwordHash,
      preferredLang: "hi",
    },
  });

  await prisma.user.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      role: Role.INVENTORY_MANAGER,
      name: "Priya Nair",
      email: "inventory@servc.in",
      phone: "9800000006",
      passwordHash,
    },
  });

  await prisma.user.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      role: Role.ACCOUNTANT,
      name: "Vikram Mehta",
      email: "accounts@servc.in",
      phone: "9800000007",
      passwordHash,
    },
  });

  await prisma.user.create({
    data: {
      role: Role.SUPER_ADMIN,
      name: "Platform Admin",
      email: "admin@servc.in",
      phone: "9800000000",
      passwordHash,
    },
  });

  // Customers + portal users
  const custUser1 = await prisma.user.create({
    data: {
      role: Role.CUSTOMER,
      name: "Ananya Joshi",
      phone: "9876543210",
      email: "ananya@example.com",
      preferredLang: "mr",
    },
  });

  const customer1 = await prisma.customer.create({
    data: {
      companyId: company.id,
      userId: custUser1.id,
      name: "Ananya Joshi",
      phone: "9876543210",
      email: "ananya@example.com",
      city: "Pune",
      state: "Maharashtra",
      stateCode: "27",
      pincode: "411007",
      source: "ONLINE",
      whatsappOptIn: true,
      preferredLang: "mr",
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      companyId: company.id,
      name: "TechCorp Solutions Pvt Ltd",
      phone: "9876543211",
      email: "fleet@techcorp.in",
      gstin: "27AABCT5678B1Z2",
      city: "Pune",
      state: "Maharashtra",
      stateCode: "27",
      pincode: "411001",
      addressLine1: "IT Park, Hinjewadi Phase 1",
      source: "REFERRAL",
      whatsappOptIn: true,
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      companyId: company.id,
      name: "Karthik Subramanian",
      phone: "9876543212",
      city: "Chennai",
      state: "Tamil Nadu",
      stateCode: "33",
      pincode: "600017",
      source: "WALK_IN",
      preferredLang: "ta",
    },
  });

  const v1 = await prisma.vehicle.create({
    data: {
      companyId: company.id,
      customerId: customer1.id,
      registrationNo: "MH12AB1234",
      brand: "Maruti Suzuki",
      model: "Swift",
      variant: "ZXI",
      year: 2021,
      color: "Pearl White",
      fuelType: FuelType.PETROL,
      transmission: "MANUAL",
      currentMileage: 42500,
      insuranceExpiry: new Date("2026-11-15"),
      pucExpiry: new Date("2026-06-30"),
      vin: "MA3EJLB1S00123456",
    },
  });

  const v2 = await prisma.vehicle.create({
    data: {
      companyId: company.id,
      customerId: customer1.id,
      registrationNo: "MH14CD5678",
      brand: "Hyundai",
      model: "Creta",
      variant: "SX",
      year: 2023,
      color: "Titan Grey",
      fuelType: FuelType.PETROL,
      transmission: "AUTOMATIC",
      currentMileage: 18200,
      insuranceExpiry: new Date("2027-01-20"),
      pucExpiry: new Date("2026-08-10"),
    },
  });

  const v3 = await prisma.vehicle.create({
    data: {
      companyId: company.id,
      customerId: customer2.id,
      registrationNo: "MH12EF9012",
      brand: "Tata",
      model: "Nexon",
      variant: "XZ+",
      year: 2022,
      fuelType: FuelType.DIESEL,
      currentMileage: 51000,
      insuranceExpiry: new Date("2026-09-01"),
      pucExpiry: new Date("2026-04-15"),
    },
  });

  const v4 = await prisma.vehicle.create({
    data: {
      companyId: company.id,
      customerId: customer2.id,
      registrationNo: "MH12GH3456",
      brand: "Mahindra",
      model: "XUV700",
      variant: "AX7",
      year: 2024,
      fuelType: FuelType.PETROL,
      currentMileage: 8500,
      insuranceExpiry: new Date("2027-03-10"),
      pucExpiry: new Date("2026-12-01"),
    },
  });

  await prisma.vehicle.create({
    data: {
      companyId: company.id,
      customerId: customer3.id,
      registrationNo: "TN09JK7890",
      brand: "Maruti Suzuki",
      model: "Baleno",
      year: 2020,
      fuelType: FuelType.PETROL,
      currentMileage: 62000,
      insuranceExpiry: new Date("2026-05-05"),
      pucExpiry: new Date("2026-02-28"),
    },
  });

  // Labor catalogue (SAC 998729)
  const laborPeriodic = await prisma.laborService.create({
    data: {
      companyId: company.id,
      code: "LAB-PER",
      name: "Periodic Service Labour",
      sacCode: "998729",
      gstRate: 18,
      basePrice: 1500,
      durationMin: 120,
    },
  });

  await prisma.laborService.create({
    data: {
      companyId: company.id,
      code: "LAB-BRK",
      name: "Brake Pad Replacement Labour",
      sacCode: "998729",
      gstRate: 18,
      basePrice: 800,
      durationMin: 90,
    },
  });

  await prisma.laborService.create({
    data: {
      companyId: company.id,
      code: "LAB-AC",
      name: "AC Gas Top-up Labour",
      sacCode: "998729",
      gstRate: 18,
      basePrice: 600,
      durationMin: 60,
    },
  });

  // Parts
  const partsData = [
    { sku: "OIL-5W30-4L", name: "Engine Oil 5W-30 4L", brand: "Castrol", source: PartSource.OEM, hsnCode: "271019", costPrice: 1600, sellingPrice: 2200, mrp: 2499, reorderLevel: 10, qty: 48 },
    { sku: "FLT-OIL-SW", name: "Oil Filter — Swift/Baleno", brand: "Maruti Genuine", source: PartSource.OEM, hsnCode: "842123", costPrice: 280, sellingPrice: 450, mrp: 520, reorderLevel: 15, qty: 60 },
    { sku: "FLT-AIR-CR", name: "Air Filter — Creta", brand: "Hyundai Genuine", source: PartSource.OEM, hsnCode: "842131", costPrice: 420, sellingPrice: 680, mrp: 750, reorderLevel: 8, qty: 25 },
    { sku: "BRK-PAD-FR", name: "Front Brake Pads (Set)", brand: "Bosch", source: PartSource.AFTERMARKET, hsnCode: "870830", costPrice: 1100, sellingPrice: 1850, mrp: 2100, reorderLevel: 6, qty: 18 },
    { sku: "WIP-BLD-22", name: "Wiper Blade 22\"", brand: "Local Market", source: PartSource.LOCAL_MARKET, hsnCode: "851290", costPrice: 120, sellingPrice: 250, mrp: 299, reorderLevel: 20, qty: 4 },
    { sku: "BAT-AMR-65", name: "Battery 65Ah", brand: "Amaron", source: PartSource.AFTERMARKET, hsnCode: "850710", costPrice: 4200, sellingPrice: 5800, mrp: 6500, reorderLevel: 3, qty: 8 },
    { sku: "TYR-185-65", name: "Tyre 185/65 R15", brand: "MRF", source: PartSource.AFTERMARKET, hsnCode: "401110", costPrice: 3800, sellingPrice: 5200, mrp: 5600, reorderLevel: 4, qty: 12 },
    { sku: "CLT-GRN-1L", name: "Coolant Green 1L", brand: "Prestone", source: PartSource.AFTERMARKET, hsnCode: "382000", costPrice: 180, sellingPrice: 320, mrp: 350, reorderLevel: 12, qty: 30 },
  ];

  for (const p of partsData) {
    const part = await prisma.part.create({
      data: {
        companyId: company.id,
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        source: p.source,
        hsnCode: p.hsnCode,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        mrp: p.mrp,
        reorderLevel: p.reorderLevel,
        gstRate: 18,
        compatibleVehicles: "Maruti,Hyundai,Tata,Mahindra",
      },
    });
    await prisma.stockItem.create({
      data: {
        branchId: branch.id,
        partId: part.id,
        quantity: p.qty,
        location: "Rack A",
      },
    });
  }

  const supplier = await prisma.supplier.create({
    data: {
      companyId: company.id,
      name: "AutoParts Bharat Distributors",
      gstin: "27AABCA9999C1Z8",
      phone: "9822001122",
      city: "Pune",
      state: "Maharashtra",
      paymentTerms: "Net 30",
    },
  });

  // Bookings
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const booking1 = await prisma.booking.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      customerId: customer1.id,
      vehicleId: v1.id,
      bookingNumber: "BK2600001",
      status: "CONFIRMED",
      source: "ONLINE",
      scheduledAt: tomorrow,
      serviceType: "PERIODIC",
      description: "10,000 km periodic service + unusual brake noise",
      estimatedDuration: 150,
    },
  });

  await prisma.booking.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      customerId: customer2.id,
      vehicleId: v3.id,
      bookingNumber: "BK2600002",
      status: "CONFIRMED",
      source: "PHONE",
      scheduledAt: new Date(tomorrow.getTime() + 3 * 3600000),
      serviceType: "REPAIR",
      description: "AC not cooling properly",
      estimatedDuration: 90,
    },
  });

  // Active job card with inspection
  const job = await prisma.repairOrder.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      customerId: customer1.id,
      vehicleId: v2.id,
      bayId: bay1.id,
      advisorId: advisor.id,
      technicianId: tech1.id,
      jobCardNumber: "JC2600001",
      status: "IN_PROGRESS",
      complaint: "Periodic service + tyre rotation",
      odometerIn: 18200,
      fuelLevelIn: 40,
      startedAt: new Date(),
      promisedAt: new Date(Date.now() + 6 * 3600000),
      inspection: {
        create: {
          inspectorId: tech1.id,
          fuelLevel: 40,
          completedAt: new Date(),
          overallNotes: "Front pads at 30%. Recommend replacement soon.",
          items: {
            create: [
              { category: "Engine", itemName: "Engine oil level", status: "ATTENTION", notes: "Due for change" },
              { category: "Engine", itemName: "Coolant level", status: "PASSED" },
              { category: "Engine", itemName: "Air filter condition", status: "PASSED" },
              { category: "Engine", itemName: "Battery condition", status: "PASSED" },
              { category: "Brakes", itemName: "Brake pad thickness", status: "ATTENTION", notes: "30% remaining" },
              { category: "Brakes", itemName: "Brake fluid level", status: "PASSED" },
              { category: "Brakes", itemName: "Handbrake operation", status: "PASSED" },
              { category: "Tyres", itemName: "Front tyre tread", status: "PASSED" },
              { category: "Tyres", itemName: "Rear tyre tread", status: "PASSED" },
              { category: "Tyres", itemName: "Tyre pressure", status: "ATTENTION", notes: "LF low by 4 PSI" },
              { category: "Tyres", itemName: "Spare wheel", status: "PASSED" },
              { category: "Electrical", itemName: "Headlights / Indicators", status: "PASSED" },
              { category: "Electrical", itemName: "Horn", status: "PASSED" },
              { category: "Electrical", itemName: "Wipers", status: "CRITICAL", notes: "Driver side blade torn" },
              { category: "Body", itemName: "Exterior damage check", status: "PASSED" },
              { category: "Body", itemName: "Underbody inspection", status: "PASSED" },
              { category: "Interior", itemName: "AC / Climate control", status: "PASSED" },
              { category: "Interior", itemName: "Seat belts", status: "PASSED" },
            ],
          },
        },
      },
    },
  });

  const oilPart = await prisma.part.findFirst({ where: { sku: "OIL-5W30-4L" } });
  const filterPart = await prisma.part.findFirst({ where: { sku: "FLT-OIL-SW" } });
  const wiperPart = await prisma.part.findFirst({ where: { sku: "WIP-BLD-22" } });

  const approvalToken = "demo-estimate-token-ananya-creta";

  const estimate = await prisma.estimate.create({
    data: {
      companyId: company.id,
      customerId: customer1.id,
      repairOrderId: job.id,
      estimateNumber: "EST2600001",
      version: 1,
      status: "SENT",
      subtotal: 4150,
      cgstAmount: 373.5,
      sgstAmount: 373.5,
      igstAmount: 0,
      totalAmount: 4897,
      approvalToken,
      sentAt: new Date(),
      notes: "Recommended based on digital inspection findings",
      lineItems: {
        create: [
          {
            repairOrderId: job.id,
            type: "LABOR",
            description: "Periodic Service Labour",
            laborServiceId: laborPeriodic.id,
            hsnSacCode: "998729",
            quantity: 1,
            unitPrice: 1500,
            gstRate: 18,
          },
          {
            repairOrderId: job.id,
            type: "PART",
            description: "Engine Oil 5W-30 4L",
            partId: oilPart!.id,
            hsnSacCode: "271019",
            quantity: 1,
            unitPrice: 2200,
            gstRate: 18,
          },
          {
            repairOrderId: job.id,
            type: "PART",
            description: "Oil Filter",
            partId: filterPart!.id,
            hsnSacCode: "842123",
            quantity: 1,
            unitPrice: 450,
            gstRate: 18,
          },
          {
            repairOrderId: job.id,
            type: "PART",
            description: "Wiper Blade 22\"",
            partId: wiperPart!.id,
            hsnSacCode: "851290",
            quantity: 1,
            unitPrice: 250,
            gstRate: 18,
          },
        ],
      },
    },
  });

  await prisma.vehicleActivity.createMany({
    data: [
      {
        vehicleId: v1.id,
        type: "BOOKING",
        title: "Booking BK2600001",
        description: "Periodic service scheduled",
        entityType: "Booking",
        entityId: booking1.id,
      },
      {
        vehicleId: v2.id,
        type: "JOB_CARD",
        title: "Job Card JC2600001",
        description: "Checked in for periodic service",
        entityType: "RepairOrder",
        entityId: job.id,
      },
      {
        vehicleId: v2.id,
        type: "ESTIMATE",
        title: "Estimate EST2600001 sent",
        description: "Awaiting WhatsApp approval",
        entityType: "Estimate",
        entityId: estimate.id,
      },
    ],
  });

  // Completed job with GST invoice (B2B) for reports
  const completedJob = await prisma.repairOrder.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      customerId: customer2.id,
      vehicleId: v4.id,
      advisorId: advisor.id,
      technicianId: tech2.id,
      jobCardNumber: "JC2600002",
      status: "DELIVERED",
      complaint: "First free service",
      odometerIn: 8500,
      odometerOut: 8512,
      fuelLevelIn: 70,
      startedAt: new Date(Date.now() - 3 * 86400000),
      completedAt: new Date(Date.now() - 2 * 86400000),
      deliveredAt: new Date(Date.now() - 2 * 86400000),
    },
  });

  const invoice = await prisma.invoice.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      customerId: customer2.id,
      repairOrderId: completedJob.id,
      invoiceNumber: "INV2600001",
      status: "PAID",
      invoiceDate: new Date(Date.now() - 2 * 86400000),
      placeOfSupply: "Maharashtra",
      supplyType: "INTRA",
      customerGstin: customer2.gstin,
      sellerGstin: company.gstin,
      subtotal: 3500,
      taxableAmount: 3500,
      cgstAmount: 315,
      sgstAmount: 315,
      igstAmount: 0,
      roundOff: 0,
      totalAmount: 4130,
      amountPaid: 4130,
      amountDue: 0,
      lineItems: {
        create: [
          {
            type: "LABOR",
            description: "Periodic Service Labour",
            hsnSacCode: "998729",
            quantity: 1,
            unitPrice: 1500,
            taxableAmount: 1500,
            gstRate: 18,
            cgstAmount: 135,
            sgstAmount: 135,
            igstAmount: 0,
            totalAmount: 1770,
          },
          {
            type: "PART",
            description: "Engine Oil 5W-30 4L",
            hsnSacCode: "271019",
            quantity: 1,
            unitPrice: 2000,
            taxableAmount: 2000,
            gstRate: 18,
            cgstAmount: 180,
            sgstAmount: 180,
            igstAmount: 0,
            totalAmount: 2360,
          },
        ],
      },
      payments: {
        create: [
          {
            companyId: company.id,
            customerId: customer2.id,
            paymentNumber: "PAY2600001",
            method: "UPI",
            status: "SUCCESS",
            amount: 4130,
            upiVpa: "servcautocare@oksbi",
            upiTxnId: "UPI20260328001",
            paidAt: new Date(Date.now() - 2 * 86400000),
          },
        ],
      },
    },
  });

  await prisma.customer.update({
    where: { id: customer2.id },
    data: { lifetimeValue: 4130 },
  });

  await prisma.auditLog.create({
    data: {
      companyId: company.id,
      userId: owner.id,
      action: "SEED_COMPLETE",
      entityType: "Company",
      entityId: company.id,
      metadata: JSON.stringify({
        message: "Demo environment ready",
        estimateApprovalPath: `/portal/estimates/${approvalToken}`,
      }),
    },
  });

  console.log("✅ Seed complete");
  console.log("");
  console.log("Staff logins (password: ServC@123):");
  console.log("  owner@servc.in       → Company Owner");
  console.log("  manager@servc.in     → Branch Manager");
  console.log("  advisor@servc.in     → Service Advisor");
  console.log("  tech1@servc.in       → Technician");
  console.log("  accounts@servc.in    → Accountant");
  console.log("  inventory@servc.in   → Inventory Manager");
  console.log("  admin@servc.in       → Super Admin");
  console.log("");
  console.log("Customer OTP login: 9876543210 (OTP: 123456 in demo mode)");
  console.log(`Estimate approval: /portal/estimates/${approvalToken}`);
  console.log(`Job card: JC2600001 | Invoice: ${invoice.invoiceNumber}`);
  console.log(`Branch ID: ${branch.id}`);
  console.log(`Manager: ${manager.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
