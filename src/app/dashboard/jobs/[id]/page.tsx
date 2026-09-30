"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { api, getToken } from "@/lib/client-api";
import { formatINR } from "@/lib/utils";
import {
  Button,
  Card,
  PageHeader,
  Select,
  StatusBadge,
  Badge,
  Textarea,
  Label,
} from "@/components/workshop-ui";

type JobMedia = {
  id: string;
  url: string;
  mediaType: string;
  caption?: string | null;
  category?: string | null;
  inspectionItemId?: string | null;
};

type InspectionItem = {
  id: string;
  category: string;
  itemName: string;
  status: string;
  notes?: string | null;
  photoUrl?: string | null;
  media?: JobMedia[];
};

type JobDetail = {
  id: string;
  jobCardNumber: string;
  status: string;
  complaint?: string;
  odometerIn?: number;
  fuelLevelIn?: number;
  customer: { name: string; phone: string; gstin?: string };
  vehicle: { registrationNo: string; brand: string; model: string };
  technician?: { id: string; name: string };
  bay?: { name: string };
  media: JobMedia[];
  inspection?: {
    items: InspectionItem[];
    completedAt?: string;
    overallNotes?: string | null;
    sectionNotes?: string | null;
  };
  estimates: {
    id: string;
    estimateNumber: string;
    version: number;
    status: string;
    totalAmount: string;
    lineItems: { id: string; description: string; isApproved: boolean }[];
  }[];
  lineItems: {
    id: string;
    type: string;
    description: string;
    quantity: string;
    unitPrice: string;
    gstRate: string;
    hsnSacCode?: string;
    isApproved: boolean;
  }[];
  invoice?: {
    id: string;
    invoiceNumber: string;
    status: string;
    totalAmount: string;
    cgstAmount: string;
    sgstAmount: string;
    igstAmount: string;
  };
};

function parseSectionNotes(raw?: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function MediaThumb({
  media,
  onRemove,
  locked,
}: {
  media: JobMedia;
  onRemove?: () => void;
  locked?: boolean;
}) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-black/5">
      {media.mediaType === "VIDEO" ? (
        <video src={media.url} controls className="h-28 w-full object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={media.url} alt={media.caption || "Job media"} className="h-28 w-full object-cover" />
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-black/55 px-2 py-1 text-[10px] text-white">
        {media.mediaType}
        {media.caption ? ` · ${media.caption}` : ""}
      </div>
      {!locked && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100"
        >
          Remove
        </button>
      )}
    </div>
  );
}

function UploadButtons({
  onPick,
  disabled,
  label = "Add media",
}: {
  onPick: (files: FileList) => void;
  disabled?: boolean;
  label?: string;
}) {
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-wrap gap-2">
      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        multiple
        onChange={(e) => {
          if (e.target.files?.length) onPick(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={videoRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="hidden"
        multiple
        onChange={(e) => {
          if (e.target.files?.length) onPick(e.target.files);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="ghost"
        disabled={disabled}
        onClick={() => photoRef.current?.click()}
      >
        {label} · Photo
      </Button>
      <Button
        type="button"
        variant="ghost"
        disabled={disabled}
        onClick={() => videoRef.current?.click()}
      >
        {label} · Video
      </Button>
    </div>
  );
}

export default function JobDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [job, setJob] = useState<JobDetail | null>(null);
  const [sectionNotes, setSectionNotes] = useState<Record<string, string>>({});
  const [overallNotes, setOverallNotes] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const res = await api<JobDetail>(`/api/repair-orders/${id}`);
    if (res.success && res.data) {
      setJob(res.data);
      setSectionNotes(parseSectionNotes(res.data.inspection?.sectionNotes));
      setOverallNotes(res.data.inspection?.overallNotes || "");
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const locked = !!job?.inspection?.completedAt;

  const categories = useMemo(
    () => [...new Set(job?.inspection?.items.map((i) => i.category) || [])],
    [job]
  );

  const vehicleMedia = useMemo(
    () =>
      (job?.media || []).filter(
        (m) => !m.category && !m.inspectionItemId
      ),
    [job]
  );

  async function updateStatus(status: string) {
    setBusy(true);
    const res = await api(`/api/repair-orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    setMsg(res.success ? `Status → ${status}` : res.error || "Failed");
    load();
  }

  async function saveInspection(complete = false) {
    if (!job?.inspection) return;
    setBusy(true);
    const res = await api(`/api/repair-orders/${id}/inspection`, {
      method: "PATCH",
      body: JSON.stringify({
        items: job.inspection.items,
        sectionNotes,
        overallNotes,
        complete,
      }),
    });
    setBusy(false);
    setMsg(
      res.success
        ? complete
          ? "Inspection completed"
          : "Inspection notes & checklist saved"
        : res.error || "Failed"
    );
    load();
  }

  async function uploadFiles(
    files: FileList,
    opts: { category?: string; inspectionItemId?: string; caption?: string } = {}
  ) {
    setUploading(true);
    const token = getToken();
    let okCount = 0;
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      if (opts.category) form.append("category", opts.category);
      if (opts.inspectionItemId) form.append("inspectionItemId", opts.inspectionItemId);
      if (opts.caption) form.append("caption", opts.caption);
      const res = await fetch(`/api/repair-orders/${id}/media`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      const json = await res.json();
      if (json.success) okCount += 1;
    }
    setUploading(false);
    setMsg(
      okCount
        ? `Uploaded ${okCount} file${okCount > 1 ? "s" : ""}`
        : "Upload failed"
    );
    await load();
  }

  async function removeMedia(mediaId: string) {
    const token = getToken();
    await fetch(`/api/repair-orders/${id}/media?mediaId=${mediaId}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    await load();
  }

  async function createEstimate() {
    if (!job) return;
    setBusy(true);
    const res = await api("/api/estimates", {
      method: "POST",
      body: JSON.stringify({
        repairOrderId: job.id,
        sendToCustomer: true,
        lineItems: [
          {
            type: "LABOR",
            description: "Periodic service labour",
            quantity: 1,
            unitPrice: 1500,
            gstRate: 18,
            hsnSacCode: "998729",
          },
          {
            type: "PART",
            description: "Engine oil 4L (OEM)",
            quantity: 1,
            unitPrice: 2200,
            gstRate: 18,
            hsnSacCode: "271019",
          },
          {
            type: "PART",
            description: "Oil filter",
            quantity: 1,
            unitPrice: 450,
            gstRate: 18,
            hsnSacCode: "842123",
          },
        ],
      }),
    });
    setBusy(false);
    setMsg(res.success ? "Estimate sent via WhatsApp for approval" : res.error || "Failed");
    load();
  }

  async function createInvoice() {
    setBusy(true);
    const res = await api("/api/invoices", {
      method: "POST",
      body: JSON.stringify({ repairOrderId: id }),
    });
    setBusy(false);
    setMsg(res.success ? "GST invoice issued + UPI payment link sent" : res.error || "Failed");
    load();
  }

  function setItemStatus(itemId: string, status: string) {
    if (!job?.inspection) return;
    setJob({
      ...job,
      inspection: {
        ...job.inspection,
        items: job.inspection.items.map((i) =>
          i.id === itemId ? { ...i, status } : i
        ),
      },
    });
  }

  function setItemNotes(itemId: string, notes: string) {
    if (!job?.inspection) return;
    setJob({
      ...job,
      inspection: {
        ...job.inspection,
        items: job.inspection.items.map((i) =>
          i.id === itemId ? { ...i, notes } : i
        ),
      },
    });
  }

  if (!job) return <p className="text-muted">Loading job card…</p>;

  return (
    <div>
      <PageHeader
        title={job.jobCardNumber}
        subtitle={`${job.vehicle.registrationNo} · ${job.vehicle.brand} ${job.vehicle.model} · ${job.customer.name}`}
        actions={<StatusBadge status={job.status} />}
      />

      {msg && (
        <Card className="mb-4 border-brand/30 bg-emerald-50 text-sm text-brand">{msg}</Card>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {["IN_PROGRESS", "QUALITY_CHECK", "READY", "DELIVERED"].map((s) => (
          <Button
            key={s}
            variant="ghost"
            disabled={busy || job.status === s}
            onClick={() => updateStatus(s)}
          >
            Mark {s.replace(/_/g, " ")}
          </Button>
        ))}
        <Button disabled={busy} onClick={createEstimate}>
          Send Estimate (WhatsApp)
        </Button>
        <Button
          variant="secondary"
          disabled={busy || !!job.invoice}
          onClick={createInvoice}
        >
          Generate GST Invoice
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h3 className="font-display font-semibold">Check-in</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Complaint</dt>
              <dd className="max-w-[60%] text-right">{job.complaint || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Odometer</dt>
              <dd>{job.odometerIn?.toLocaleString("en-IN") || "—"} km</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Fuel</dt>
              <dd>{job.fuelLevelIn != null ? `${job.fuelLevelIn}%` : "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Customer GSTIN</dt>
              <dd className="font-mono text-xs">{job.customer.gstin || "B2C"}</dd>
            </div>
          </dl>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-semibold">Vehicle photos & videos</h3>
              <p className="text-xs text-muted">
                Capture overall condition at check-in and during work.
              </p>
            </div>
            {!locked && (
              <UploadButtons
                disabled={uploading}
                label="Vehicle"
                onPick={(files) =>
                  uploadFiles(files, { caption: "Vehicle overview" })
                }
              />
            )}
          </div>
          {vehicleMedia.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No vehicle media yet.</p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {vehicleMedia.map((m) => (
                <MediaThumb
                  key={m.id}
                  media={m}
                  locked={locked}
                  onRemove={() => removeMedia(m.id)}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-semibold">Digital Inspection</h3>
            <p className="text-xs text-muted">
              Each section has notes plus photo/video evidence. Checklist items can hold their own
              notes and media.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {job.inspection && !locked && (
              <>
                <Button
                  variant="ghost"
                  disabled={busy || uploading}
                  onClick={() => saveInspection(false)}
                >
                  Save draft
                </Button>
                <Button disabled={busy || uploading} onClick={() => saveInspection(true)}>
                  Complete Inspection
                </Button>
              </>
            )}
            {locked && <Badge tone="success">Completed</Badge>}
          </div>
        </div>

        {!job.inspection && (
          <p className="mt-4 text-sm text-muted">
            No inspection checklist yet — create the job card / check in first.
          </p>
        )}

        {job.inspection && (
          <div className="mt-4 space-y-6">
            <div>
              <Label>Overall job notes</Label>
              <Textarea
                value={overallNotes}
                disabled={locked}
                placeholder="General observations for this vehicle / visit…"
                onChange={(e) => setOverallNotes(e.target.value)}
              />
            </div>

            {categories.map((cat) => {
              const sectionMedia = (job.media || []).filter(
                (m) => m.category === cat && !m.inspectionItemId
              );
              const items = job.inspection!.items.filter((i) => i.category === cat);
              return (
                <section
                  key={cat}
                  className="rounded-xl border border-border bg-surface/60 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h4 className="font-display text-base font-semibold">{cat}</h4>
                    {!locked && (
                      <UploadButtons
                        disabled={uploading}
                        label={cat}
                        onPick={(files) =>
                          uploadFiles(files, {
                            category: cat,
                            caption: `${cat} section`,
                          })
                        }
                      />
                    )}
                  </div>

                  <div className="mt-3">
                    <Label>Section notes</Label>
                    <Textarea
                      value={sectionNotes[cat] || ""}
                      disabled={locked}
                      placeholder={`Notes for ${cat} (findings, customer conversation, follow-ups)…`}
                      onChange={(e) =>
                        setSectionNotes((prev) => ({ ...prev, [cat]: e.target.value }))
                      }
                    />
                  </div>

                  {sectionMedia.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {sectionMedia.map((m) => (
                        <MediaThumb
                          key={m.id}
                          media={m}
                          locked={locked}
                          onRemove={() => removeMedia(m.id)}
                        />
                      ))}
                    </div>
                  )}

                  <div className="mt-4 space-y-3">
                    {items.map((item) => {
                      const itemMedia =
                        item.media?.length
                          ? item.media
                          : (job.media || []).filter((m) => m.inspectionItemId === item.id);
                      return (
                        <div
                          key={item.id}
                          className="rounded-lg border border-border bg-card p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="text-sm font-medium">{item.itemName}</span>
                            <Select
                              className="w-36"
                              value={item.status}
                              disabled={locked}
                              onChange={(e) => setItemStatus(item.id, e.target.value)}
                            >
                              <option value="NA">N/A</option>
                              <option value="PASSED">Passed</option>
                              <option value="ATTENTION">Attention</option>
                              <option value="CRITICAL">Critical</option>
                            </Select>
                          </div>
                          <div className="mt-2">
                            <Label>Item notes</Label>
                            <Textarea
                              value={item.notes || ""}
                              disabled={locked}
                              placeholder={`Notes for ${item.itemName}…`}
                              onChange={(e) => setItemNotes(item.id, e.target.value)}
                            />
                          </div>
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            {!locked && (
                              <UploadButtons
                                disabled={uploading}
                                label="Item"
                                onPick={(files) =>
                                  uploadFiles(files, {
                                    category: cat,
                                    inspectionItemId: item.id,
                                    caption: item.itemName,
                                  })
                                }
                              />
                            )}
                          </div>
                          {itemMedia.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                              {itemMedia.map((m) => (
                                <MediaThumb
                                  key={m.id}
                                  media={m}
                                  locked={locked}
                                  onRemove={() => removeMedia(m.id)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="font-display font-semibold">Estimates</h3>
          {job.estimates.length === 0 && (
            <p className="mt-3 text-sm text-muted">No estimates yet</p>
          )}
          {job.estimates.map((est) => (
            <div key={est.id} className="mt-3 rounded-lg border border-border p-3">
              <div className="flex justify-between">
                <span className="font-medium">
                  {est.estimateNumber} v{est.version}
                </span>
                <StatusBadge status={est.status} />
              </div>
              <p className="mt-1 text-sm">{formatINR(Number(est.totalAmount))}</p>
              <p className="text-xs text-muted">
                {est.lineItems.filter((l) => l.isApproved).length}/{est.lineItems.length} lines
                approved
              </p>
            </div>
          ))}
        </Card>

        <Card>
          <h3 className="font-display font-semibold">GST Invoice</h3>
          {!job.invoice && (
            <p className="mt-3 text-sm text-muted">
              Approve estimate line items, then generate invoice.
            </p>
          )}
          {job.invoice && (
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{job.invoice.invoiceNumber}</span>
                <StatusBadge status={job.invoice.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted">CGST</span>
                <span>{formatINR(Number(job.invoice.cgstAmount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">SGST</span>
                <span>{formatINR(Number(job.invoice.sgstAmount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">IGST</span>
                <span>{formatINR(Number(job.invoice.igstAmount))}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <span>Total</span>
                <span>{formatINR(Number(job.invoice.totalAmount))}</span>
              </div>
            </div>
          )}

          {job.lineItems.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase text-muted">Line Items</p>
              {job.lineItems.map((li) => (
                <div key={li.id} className="mt-2 flex justify-between text-xs">
                  <span>
                    {li.description}{" "}
                    {li.isApproved ? (
                      <Badge tone="success">OK</Badge>
                    ) : (
                      <Badge>Pending</Badge>
                    )}
                  </span>
                  <span>{formatINR(Number(li.unitPrice) * Number(li.quantity))}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
