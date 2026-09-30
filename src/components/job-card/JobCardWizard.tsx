"use client";

import { useRef, useState, useTransition } from "react";
import { Check, ChevronLeft, ChevronRight, Camera, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  emptyJobCard,
  photosComplete,
  REQUIRED_PHOTO_ANGLES,
  type JobCardData,
  type PhotoAngle,
} from "@/lib/job-card";

const STEPS = [
  { id: 1, title: "Customer / CRM", short: "Customer" },
  { id: 2, title: "Vehicle", short: "Vehicle" },
  { id: 3, title: "Close-out", short: "Close-out" },
] as const;

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function JobCardWizard() {
  const [step, setStep] = useState(1);
  const [vehicleSection, setVehicleSection] = useState(1);
  const [closeSection, setCloseSection] = useState(1);
  const [data, setData] = useState<JobCardData>(() => emptyJobCard());
  const [channel, setChannel] = useState<"email" | "whatsapp">("whatsapp");
  const [error, setError] = useState<string | null>(null);
  const [notifyResult, setNotifyResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRefs = useRef<Partial<Record<PhotoAngle, HTMLInputElement | null>>>({});

  function updateCustomer<K extends keyof JobCardData["customer"]>(
    key: K,
    value: JobCardData["customer"][K]
  ) {
    setData((d) => ({ ...d, customer: { ...d.customer, [key]: value } }));
  }

  function updateVehicle<K extends keyof JobCardData["vehicle"]>(
    key: K,
    value: JobCardData["vehicle"][K]
  ) {
    setData((d) => ({ ...d, vehicle: { ...d.vehicle, [key]: value } }));
  }

  function validateStep1() {
    const { name, phone, email, address, gstNumber, panCard } = data.customer;
    if (!name.trim() || !phone.trim() || !email.trim() || !address.trim()) {
      return "Name, phone, email, and address are required.";
    }
    if (!/^\d{10}$/.test(phone.replace(/\s+/g, ""))) {
      return "Enter a 10-digit phone number.";
    }
    if (!email.includes("@")) {
      return "Enter a valid email.";
    }
    if (gstNumber && !/^[0-9A-Z]{15}$/i.test(gstNumber.trim())) {
      return "GST number should be 15 characters when provided.";
    }
    if (panCard && !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(panCard.trim())) {
      return "PAN should look like ABCDE1234F when provided.";
    }
    return null;
  }

  function validateVehicleDetails() {
    const v = data.vehicle;
    if (
      !v.make.trim() ||
      !v.model.trim() ||
      !v.variant.trim() ||
      !v.color.trim() ||
      !v.vehicleNumber.trim() ||
      !v.engineNumber.trim() ||
      !v.chassisVin.trim()
    ) {
      return "Fill make, model, variant, color, vehicle number, engine, and chassis/VIN.";
    }
    if (
      !v.insuranceProvider.trim() ||
      !v.insurancePolicyNumber.trim() ||
      !v.insuranceExpiry.trim()
    ) {
      return "Insurance provider, policy number, and expiry are required.";
    }
    return null;
  }

  async function onPhotoSelected(angle: PhotoAngle, file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    const url = await readFileAsDataUrl(file);
    setData((d) => ({ ...d, photos: { ...d.photos, [angle]: url } }));
    setError(null);
  }

  function goNext() {
    setError(null);
    setNotifyResult(null);

    if (step === 1) {
      const err = validateStep1();
      if (err) {
        setError(err);
        return;
      }
      setStep(2);
      setVehicleSection(1);
      return;
    }

    if (step === 2) {
      if (vehicleSection === 1) {
        const err = validateVehicleDetails();
        if (err) {
          setError(err);
          return;
        }
        setVehicleSection(2);
        return;
      }
      if (vehicleSection === 2) {
        if (!photosComplete(data.photos)) {
          setError("Capture all required photo angles before continuing.");
          return;
        }
        setVehicleSection(3);
        return;
      }
      if (!data.issues.trim() || !data.maintenance.trim()) {
        setError("Add key issues and maintenance points.");
        return;
      }
      setStep(3);
      setCloseSection(1);
      return;
    }

    if (step === 3) {
      if (closeSection === 1) {
        if (!data.testRideComments.trim()) {
          setError("Add test ride comments.");
          return;
        }
        setCloseSection(2);
        return;
      }
      if (closeSection === 2) {
        if (!data.customerInputs.trim()) {
          setError("Add customer inputs.");
          return;
        }
        setCloseSection(3);
        return;
      }
    }
  }

  function goBack() {
    setError(null);
    setNotifyResult(null);
    if (step === 2 && vehicleSection > 1) {
      setVehicleSection((s) => s - 1);
      return;
    }
    if (step === 3 && closeSection > 1) {
      setCloseSection((s) => s - 1);
      return;
    }
    if (step > 1) {
      setStep((s) => s - 1);
      if (step === 3) setVehicleSection(3);
      if (step === 2) setVehicleSection(1);
    }
  }

  function sendNotify() {
    setError(null);
    setNotifyResult(null);
    const amount = Number(data.estimateAmount);
    if (!data.estimateAmount.trim() || Number.isNaN(amount) || amount < 0) {
      setError("Enter a valid preliminary estimate amount.");
      return;
    }

    const to = channel === "email" ? data.customer.email : data.customer.phone;
    startTransition(async () => {
      try {
        const res = await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel,
            to,
            subject: `ServC job card — ${data.vehicle.vehicleNumber || "vehicle"}`,
            message: `Hi ${data.customer.name}, your ServC job card is ready. Preliminary estimate: ₹${amount.toLocaleString("en-IN")}. ${data.estimateNotes}`.trim(),
            jobCardSummary: {
              customer: data.customer.name,
              phone: data.customer.phone,
              email: data.customer.email,
              vehicle: `${data.vehicle.make} ${data.vehicle.model} ${data.vehicle.variant}`,
              vehicleNumber: data.vehicle.vehicleNumber,
              estimate: amount,
              issues: data.issues,
            },
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          setError(json.error || "Failed to send notification.");
          return;
        }
        setNotifyResult(
          `Mock ${json.channel} sent to ${json.to} (id ${json.deliveryId}). Check the server console for the payload.`
        );
      } catch {
        setError("Network error while sending mock notification.");
      }
    });
  }

  const progressLabel =
    step === 2
      ? `Vehicle · section ${vehicleSection} of 3`
      : step === 3
        ? `Close-out · section ${closeSection} of 3`
        : "Customer / CRM";

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 10% 0%, #d8ebe3 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 100% 10%, #f3e2b8 0%, transparent 45%), linear-gradient(180deg, #f7faf8 0%, #eef4f1 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230b3d2e' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8 sm:px-6">
        <header className="mb-8 animate-fade-up">
          <p className="font-display text-3xl font-bold tracking-tight text-brand sm:text-4xl">
            ServC
          </p>
          <p className="mt-1 text-sm text-muted">Service intake job card</p>
        </header>

        <nav className="mb-6 flex gap-2 animate-fade-up" aria-label="Job card steps">
          {STEPS.map((s) => {
            const active = step === s.id;
            const done = step > s.id;
            return (
              <div
                key={s.id}
                className={`flex flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  active
                    ? "border-brand bg-brand text-white shadow-sm"
                    : done
                      ? "border-brand/30 bg-white text-brand"
                      : "border-border bg-white/70 text-muted"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold ${
                    active
                      ? "bg-white/20"
                      : done
                        ? "bg-brand/10"
                        : "bg-surface"
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : s.id}
                </span>
                <span className="hidden font-medium sm:inline">{s.title}</span>
                <span className="font-medium sm:hidden">{s.short}</span>
              </div>
            );
          })}
        </nav>

        <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-muted animate-fade-up">
          {progressLabel}
        </p>

        <Card className="animate-fade-up flex-1">
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle>Customer / CRM</CardTitle>
                <CardDescription>
                  Capture the customer identity and tax details for this intake.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name">
                    <Input
                      value={data.customer.name}
                      onChange={(e) => updateCustomer("name", e.target.value)}
                      placeholder="Ananya Sharma"
                      autoComplete="name"
                    />
                  </Field>
                  <Field label="Phone number">
                    <Input
                      value={data.customer.phone}
                      onChange={(e) => updateCustomer("phone", e.target.value)}
                      placeholder="9876543210"
                      inputMode="tel"
                    />
                  </Field>
                  <Field label="Email">
                    <Input
                      type="email"
                      value={data.customer.email}
                      onChange={(e) => updateCustomer("email", e.target.value)}
                      placeholder="ananya@example.com"
                    />
                  </Field>
                  <Field label="GST number">
                    <Input
                      value={data.customer.gstNumber}
                      onChange={(e) =>
                        updateCustomer("gstNumber", e.target.value.toUpperCase())
                      }
                      placeholder="27AABCU9603R1ZM"
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Address">
                      <Textarea
                        value={data.customer.address}
                        onChange={(e) => updateCustomer("address", e.target.value)}
                        placeholder="Flat, street, city, PIN"
                      />
                    </Field>
                  </div>
                  <Field label="PAN card">
                    <Input
                      value={data.customer.panCard}
                      onChange={(e) =>
                        updateCustomer("panCard", e.target.value.toUpperCase())
                      }
                      placeholder="ABCDE1234F"
                    />
                  </Field>
                </div>
              </CardContent>
            </>
          )}

          {step === 2 && vehicleSection === 1 && (
            <>
              <CardHeader>
                <CardTitle>Vehicle details</CardTitle>
                <CardDescription>
                  Make, identity numbers, and insurance for the vehicle in bay.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Make">
                    <Input
                      value={data.vehicle.make}
                      onChange={(e) => updateVehicle("make", e.target.value)}
                      placeholder="Hyundai"
                    />
                  </Field>
                  <Field label="Model">
                    <Input
                      value={data.vehicle.model}
                      onChange={(e) => updateVehicle("model", e.target.value)}
                      placeholder="Creta"
                    />
                  </Field>
                  <Field label="Variant">
                    <Input
                      value={data.vehicle.variant}
                      onChange={(e) => updateVehicle("variant", e.target.value)}
                      placeholder="SX(O) Diesel"
                    />
                  </Field>
                  <Field label="Color">
                    <Input
                      value={data.vehicle.color}
                      onChange={(e) => updateVehicle("color", e.target.value)}
                      placeholder="Phantom Black"
                    />
                  </Field>
                  <Field label="Vehicle number">
                    <Input
                      value={data.vehicle.vehicleNumber}
                      onChange={(e) =>
                        updateVehicle("vehicleNumber", e.target.value.toUpperCase())
                      }
                      placeholder="MH 12 AB 1234"
                    />
                  </Field>
                  <Field label="Engine number">
                    <Input
                      value={data.vehicle.engineNumber}
                      onChange={(e) => updateVehicle("engineNumber", e.target.value)}
                    />
                  </Field>
                  <Field label="Chassis / VIN">
                    <Input
                      value={data.vehicle.chassisVin}
                      onChange={(e) => updateVehicle("chassisVin", e.target.value)}
                    />
                  </Field>
                  <Field label="Insurance provider">
                    <Input
                      value={data.vehicle.insuranceProvider}
                      onChange={(e) =>
                        updateVehicle("insuranceProvider", e.target.value)
                      }
                      placeholder="ICICI Lombard"
                    />
                  </Field>
                  <Field label="Policy number">
                    <Input
                      value={data.vehicle.insurancePolicyNumber}
                      onChange={(e) =>
                        updateVehicle("insurancePolicyNumber", e.target.value)
                      }
                    />
                  </Field>
                  <Field label="Insurance expiry">
                    <Input
                      type="date"
                      value={data.vehicle.insuranceExpiry}
                      onChange={(e) =>
                        updateVehicle("insuranceExpiry", e.target.value)
                      }
                    />
                  </Field>
                </div>
              </CardContent>
            </>
          )}

          {step === 2 && vehicleSection === 2 && (
            <>
              <CardHeader>
                <CardTitle>Photographs</CardTitle>
                <CardDescription>
                  Capture every required angle before continuing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {REQUIRED_PHOTO_ANGLES.map((angle) => {
                    const preview = data.photos[angle.id];
                    return (
                      <div
                        key={angle.id}
                        className="overflow-hidden rounded-lg border border-border bg-surface/60"
                      >
                        <button
                          type="button"
                          className="relative flex aspect-[4/3] w-full items-center justify-center bg-ink/5 transition hover:bg-ink/10"
                          onClick={() => fileRefs.current[angle.id]?.click()}
                        >
                          {preview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={preview}
                              alt={`${angle.label} photo`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex flex-col items-center gap-2 text-muted">
                              <Camera className="h-7 w-7" />
                              <span className="text-sm font-medium">
                                Add {angle.label}
                              </span>
                            </span>
                          )}
                        </button>
                        <div className="flex items-center justify-between px-3 py-2 text-sm">
                          <span className="font-medium text-ink">{angle.label}</span>
                          <span
                            className={
                              preview ? "text-success" : "text-muted"
                            }
                          >
                            {preview ? "Captured" : "Required"}
                          </span>
                        </div>
                        <input
                          ref={(el) => {
                            fileRefs.current[angle.id] = el;
                          }}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) =>
                            void onPhotoSelected(
                              angle.id,
                              e.target.files?.[0] ?? null
                            )
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </>
          )}

          {step === 2 && vehicleSection === 3 && (
            <>
              <CardHeader>
                <CardTitle>Issues and maintenance</CardTitle>
                <CardDescription>
                  Key vehicle issues and maintenance points for this visit.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Field label="Key issues">
                  <Textarea
                    value={data.issues}
                    onChange={(e) =>
                      setData((d) => ({ ...d, issues: e.target.value }))
                    }
                    placeholder="Brake noise on left front, AC weak cooling…"
                  />
                </Field>
                <Field label="Maintenance points">
                  <Textarea
                    value={data.maintenance}
                    onChange={(e) =>
                      setData((d) => ({ ...d, maintenance: e.target.value }))
                    }
                    placeholder="Oil service due, cabin filter replacement…"
                  />
                </Field>
              </CardContent>
            </>
          )}

          {step === 3 && closeSection === 1 && (
            <>
              <CardHeader>
                <CardTitle>Test ride comments</CardTitle>
                <CardDescription>
                  Notes from the advisor or technician test ride.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Field label="Test ride comments">
                  <Textarea
                    value={data.testRideComments}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        testRideComments: e.target.value,
                      }))
                    }
                    placeholder="Vibration above 60 km/h; steering slightly pulls right…"
                  />
                </Field>
              </CardContent>
            </>
          )}

          {step === 3 && closeSection === 2 && (
            <>
              <CardHeader>
                <CardTitle>Customer inputs</CardTitle>
                <CardDescription>
                  What the customer asked for or agreed during intake.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Field label="Customer inputs">
                  <Textarea
                    value={data.customerInputs}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        customerInputs: e.target.value,
                      }))
                    }
                    placeholder="Approve brake pads if needed; call before extra work…"
                  />
                </Field>
              </CardContent>
            </>
          )}

          {step === 3 && closeSection === 3 && (
            <>
              <CardHeader>
                <CardTitle>Estimate and notify</CardTitle>
                <CardDescription>
                  Set a preliminary estimate and send a mock email or WhatsApp
                  notification.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Field label="Preliminary estimate (INR)">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={data.estimateAmount}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        estimateAmount: e.target.value,
                      }))
                    }
                    placeholder="8500"
                  />
                </Field>
                <Field label="Estimate notes">
                  <Textarea
                    value={data.estimateNotes}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        estimateNotes: e.target.value,
                      }))
                    }
                    placeholder="Labour + pads; final after diagnosis"
                  />
                </Field>

                <div>
                  <Label>Notify via</Label>
                  <RadioGroup
                    value={channel}
                    onValueChange={(v) =>
                      setChannel(v as "email" | "whatsapp")
                    }
                    className="mt-2 grid gap-3 sm:grid-cols-2"
                  >
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface/50 px-3 py-3 has-[[data-state=checked]]:border-brand has-[[data-state=checked]]:bg-brand/5">
                      <RadioGroupItem value="whatsapp" id="ch-wa" />
                      <MessageCircle className="h-4 w-4 text-brand" />
                      <span className="text-sm font-medium">WhatsApp</span>
                      <span className="ml-auto text-xs text-muted">
                        {data.customer.phone || "—"}
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface/50 px-3 py-3 has-[[data-state=checked]]:border-brand has-[[data-state=checked]]:bg-brand/5">
                      <RadioGroupItem value="email" id="ch-email" />
                      <Mail className="h-4 w-4 text-brand" />
                      <span className="text-sm font-medium">Email</span>
                      <span className="ml-auto truncate text-xs text-muted">
                        {data.customer.email || "—"}
                      </span>
                    </label>
                  </RadioGroup>
                </div>

                <Button
                  type="button"
                  onClick={sendNotify}
                  disabled={isPending}
                  className="w-full sm:w-auto"
                >
                  {isPending
                    ? "Sending…"
                    : channel === "whatsapp"
                      ? "Send WhatsApp (mock)"
                      : "Send email (mock)"}
                </Button>

                {notifyResult && (
                  <p className="rounded-lg border border-success/30 bg-green-50 px-3 py-2 text-sm text-success">
                    {notifyResult}
                  </p>
                )}
              </CardContent>
            </>
          )}
        </Card>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-danger/30 bg-red-50 px-3 py-2 text-sm text-danger"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={step === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          {!(step === 3 && closeSection === 3) && (
            <Button type="button" onClick={goNext}>
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
