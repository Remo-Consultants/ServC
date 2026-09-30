import { round2 } from "./utils";

/** GST state codes (partial map for major states) */
export const GST_STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "36": "Telangana",
  "37": "Andhra Pradesh",
};

export const STATE_NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(GST_STATE_CODES).map(([code, name]) => [name.toLowerCase(), code])
);

export interface GstLineInput {
  quantity: number;
  unitPrice: number;
  discountPct?: number;
  gstRate: number;
  hsnSacCode?: string;
  description: string;
  type: "LABOR" | "PART" | "CONSUMABLE" | "OTHER";
}

export interface GstLineResult extends GstLineInput {
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
}

export interface GstBreakdown {
  supplyType: "INTRA" | "INTER";
  lines: GstLineResult[];
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  roundOff: number;
  totalAmount: number;
}

/**
 * Calculate GST for invoice lines.
 * INTRA-state (same state code): CGST + SGST (each half of GST rate)
 * INTER-state: IGST (full GST rate)
 */
export function calculateGst(
  lines: GstLineInput[],
  sellerStateCode: string,
  buyerStateCode: string
): GstBreakdown {
  const supplyType =
    sellerStateCode && buyerStateCode && sellerStateCode === buyerStateCode
      ? "INTRA"
      : "INTER";

  let subtotal = 0;
  let discountAmount = 0;
  let taxableAmount = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  const resultLines: GstLineResult[] = lines.map((line) => {
    const qty = line.quantity;
    const gross = qty * line.unitPrice;
    const disc = gross * ((line.discountPct || 0) / 100);
    const taxable = round2(gross - disc);
    const gst = round2(taxable * (line.gstRate / 100));

    let cgst = 0,
      sgst = 0,
      igst = 0;
    if (supplyType === "INTRA") {
      cgst = round2(gst / 2);
      sgst = round2(gst / 2);
    } else {
      igst = gst;
    }

    subtotal = round2(subtotal + gross);
    discountAmount = round2(discountAmount + disc);
    taxableAmount = round2(taxableAmount + taxable);
    cgstAmount = round2(cgstAmount + cgst);
    sgstAmount = round2(sgstAmount + sgst);
    igstAmount = round2(igstAmount + igst);

    return {
      ...line,
      taxableAmount: taxable,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: igst,
      totalAmount: round2(taxable + cgst + sgst + igst),
    };
  });

  const rawTotal = round2(taxableAmount + cgstAmount + sgstAmount + igstAmount);
  const totalAmount = Math.round(rawTotal);
  const roundOff = round2(totalAmount - rawTotal);

  return {
    supplyType,
    lines: resultLines,
    subtotal,
    discountAmount,
    taxableAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    roundOff,
    totalAmount,
  };
}

export function validateGstin(gstin: string): boolean {
  const cleaned = gstin.trim().toUpperCase();
  // 15 chars: 2 state + 10 PAN + 1 entity + Z + checksum
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleaned);
}
