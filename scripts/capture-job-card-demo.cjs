const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

/** Portable output dir (override with JOB_CARD_MEDIA_DIR). */
const MEDIA =
  process.env.JOB_CARD_MEDIA_DIR ||
  path.join(__dirname, "..", "artifacts", "job-card");
const BASE = process.env.JOB_CARD_BASE_URL || "http://127.0.0.1:4317";

const ANGLES = ["front", "rear", "left", "right", "top"];
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

function ensureTempPhotos(dir) {
  fs.mkdirSync(dir, { recursive: true });
  for (const a of ANGLES) {
    fs.writeFileSync(path.join(dir, `_tmp-${a}.png`), TINY_PNG);
  }
}

function cleanupTempPhotos(dir) {
  for (const a of ANGLES) {
    const p = path.join(dir, `_tmp-${a}.png`);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}

async function fillByLabel(page, labelText, value) {
  const label = page.locator("label", { hasText: labelText }).first();
  const field = label.locator("xpath=following-sibling::*[1]");
  await field.fill(value);
}

async function attachVehiclePhotos(page, mediaDir) {
  const inputs = page.locator('input[type="file"]');
  const count = await inputs.count();
  for (let i = 0; i < count; i++) {
    const angle = ANGLES[i % ANGLES.length];
    await inputs.nth(i).setInputFiles(path.join(mediaDir, `_tmp-${angle}.png`));
  }
}

(async () => {
  ensureTempPhotos(MEDIA);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE, { waitUntil: "networkidle" });

  // Page 1 — Customer
  await fillByLabel(page, "Name", "Ananya Sharma");
  await fillByLabel(page, "Phone number", "9876543210");
  await fillByLabel(page, "Email", "ananya@example.com");
  await fillByLabel(page, "GST number", "27AABCU9603R1ZM");
  await fillByLabel(page, "Address", "12 MG Road, Pune, 411001");
  await fillByLabel(page, "PAN card", "ABCDE1234F");
  await page.screenshot({
    path: path.join(MEDIA, "01-customer-crm.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: /Continue/i }).click();
  await page.waitForTimeout(400);

  // Page 2 §1 — Vehicle details
  await fillByLabel(page, "Make", "Hyundai");
  await fillByLabel(page, "Model", "Creta");
  await fillByLabel(page, "Variant", "SX(O) Diesel");
  await fillByLabel(page, "Color", "Phantom Black");
  await fillByLabel(page, "Vehicle number", "MH 12 AB 1234");
  await fillByLabel(page, "Engine number", "ENG123456");
  await fillByLabel(page, "Chassis / VIN", "MALA851CLJM123456");
  await fillByLabel(page, "Insurance provider", "ICICI Lombard");
  await fillByLabel(page, "Policy number", "POL-998877");
  await fillByLabel(page, "Insurance expiry", "2027-03-15");
  await page.screenshot({
    path: path.join(MEDIA, "02-vehicle-details.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: /Continue/i }).click();
  await page.waitForTimeout(400);

  // Page 2 §2 — Photographs
  await attachVehiclePhotos(page, MEDIA);
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(MEDIA, "03-vehicle-photos.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: /Continue/i }).click();
  await page.waitForTimeout(400);

  // Page 2 §3 — Issues
  await fillByLabel(page, "Key issues", "Brake noise on left front; AC weak cooling");
  await fillByLabel(
    page,
    "Maintenance points",
    "Oil service due; cabin filter replacement"
  );
  await page.screenshot({
    path: path.join(MEDIA, "04-vehicle-issues.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: /Continue/i }).click();
  await page.waitForTimeout(400);

  // Page 3 §1 — Test ride
  await fillByLabel(
    page,
    "Test ride comments",
    "Vibration above 60 km/h; steering slightly pulls right"
  );
  await page.screenshot({
    path: path.join(MEDIA, "05-closeout-test-ride.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: /Continue/i }).click();
  await page.waitForTimeout(400);

  await fillByLabel(
    page,
    "Customer inputs",
    "Approve brake pads if needed; call before extra work"
  );
  await page.screenshot({
    path: path.join(MEDIA, "06-closeout-customer-inputs.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: /Continue/i }).click();
  await page.waitForTimeout(400);

  await fillByLabel(page, "Preliminary estimate (INR)", "8500");
  await fillByLabel(page, "Estimate notes", "Labour + pads; final after diagnosis");
  await page.getByRole("button", { name: /Send WhatsApp \(mock\)/i }).click();
  await page.waitForSelector("text=Mock whatsapp sent");
  await page.screenshot({
    path: path.join(MEDIA, "07-closeout-estimate-notify.png"),
    fullPage: true,
  });

  await browser.close();
  cleanupTempPhotos(MEDIA);

  const files = fs
    .readdirSync(MEDIA)
    .filter((f) => f.endsWith(".png") || f.endsWith(".webm") || f.endsWith(".mp4"));
  console.log("MEDIA_DIR", MEDIA);
  console.log("MEDIA_FILES");
  for (const f of files) {
    const full = path.join(MEDIA, f);
    const st = fs.statSync(full);
    console.log(`${full} (${st.size} bytes)`);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
