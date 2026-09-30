/** Domain enums as const strings (SQLite-compatible; mirrors former Prisma enums) */

export const Role = {
  SUPER_ADMIN: "SUPER_ADMIN",
  COMPANY_OWNER: "COMPANY_OWNER",
  BRANCH_MANAGER: "BRANCH_MANAGER",
  SERVICE_ADVISOR: "SERVICE_ADVISOR",
  TECHNICIAN: "TECHNICIAN",
  INVENTORY_MANAGER: "INVENTORY_MANAGER",
  ACCOUNTANT: "ACCOUNTANT",
  CUSTOMER: "CUSTOMER",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const FuelType = {
  PETROL: "PETROL",
  DIESEL: "DIESEL",
  CNG: "CNG",
  ELECTRIC: "ELECTRIC",
  HYBRID: "HYBRID",
  LPG: "LPG",
} as const;

export const PartSource = {
  OEM: "OEM",
  AFTERMARKET: "AFTERMARKET",
  LOCAL_MARKET: "LOCAL_MARKET",
} as const;

export type RepairOrderStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "QUALITY_CHECK"
  | "READY"
  | "DELIVERED"
  | "CANCELLED";
