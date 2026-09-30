export type PhotoAngle = "front" | "rear" | "left" | "right" | "top";

export const REQUIRED_PHOTO_ANGLES: { id: PhotoAngle; label: string }[] = [
  { id: "front", label: "Front" },
  { id: "rear", label: "Rear" },
  { id: "left", label: "Left side" },
  { id: "right", label: "Right side" },
  { id: "top", label: "Top / roof" },
];

export type JobCardData = {
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    gstNumber: string;
    panCard: string;
  };
  vehicle: {
    make: string;
    model: string;
    variant: string;
    color: string;
    vehicleNumber: string;
    engineNumber: string;
    chassisVin: string;
    insuranceProvider: string;
    insurancePolicyNumber: string;
    insuranceExpiry: string;
  };
  photos: Partial<Record<PhotoAngle, string>>;
  issues: string;
  maintenance: string;
  testRideComments: string;
  customerInputs: string;
  estimateAmount: string;
  estimateNotes: string;
};

export const emptyJobCard = (): JobCardData => ({
  customer: {
    name: "",
    phone: "",
    email: "",
    address: "",
    gstNumber: "",
    panCard: "",
  },
  vehicle: {
    make: "",
    model: "",
    variant: "",
    color: "",
    vehicleNumber: "",
    engineNumber: "",
    chassisVin: "",
    insuranceProvider: "",
    insurancePolicyNumber: "",
    insuranceExpiry: "",
  },
  photos: {},
  issues: "",
  maintenance: "",
  testRideComments: "",
  customerInputs: "",
  estimateAmount: "",
  estimateNotes: "",
});

export function photosComplete(photos: JobCardData["photos"]) {
  return REQUIRED_PHOTO_ANGLES.every((a) => Boolean(photos[a.id]));
}
