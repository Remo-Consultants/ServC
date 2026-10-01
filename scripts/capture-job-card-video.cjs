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
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    recordVideo: { dir: MEDIA, size: { width: 1280, height: 900 } },
  });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });

  await fillByLabel(page, "Name", "Ananya Sharma");
  await fillByLabel(page, "Phone number", "9876543210");
  await fillByLabel(page, "Email", "ananya@example.com");
  await fillByLabel(page, "GST number", "27AABCU9603R1ZM");
  await fillByLabel(page, "Address", "12 MG Road, Pune, 411001");
  await fillByLabel(page, "PAN card", "ABCDE1234F");
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: /Continue/i }).click();
  await page.waitForTimeout(500);

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
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /Continue/i }).click();
  await page.waitForTimeout(400);

  await attachVehiclePhotos(page, MEDIA);
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: /Continue/i }).click();
  await page.waitForTimeout(400);

  await fillByLabel(page, "Key issues", "Brake noise on left front");
  await fillByLabel(page, "Maintenance points", "Oil service due");
  await page.getByRole("button", { name: /Continue/i }).click();
  await page.waitForTimeout(400);

  await fillByLabel(page, "Test ride comments", "Slight vibration above 60 km/h");
  await page.getByRole("button", { name: /Continue/i }).click();
  await page.waitForTimeout(400);

  await fillByLabel(page, "Customer inputs", "Call before extra work");
  await page.getByRole("button", { name: /Continue/i }).click();
  await page.waitForTimeout(400);

  await fillByLabel(page, "Preliminary estimate (INR)", "8500");
  await fillByLabel(page, "Estimate notes", "Labour + pads");
  await page.getByRole("button", { name: /Send WhatsApp \(mock\)/i }).click();
  await page.waitForSelector("text=Mock whatsapp sent");
  await page.waitForTimeout(800);

  const videoPath = await page.video().path();
  await context.close();
  await browser.close();

  const target = path.join(MEDIA, "08-job-card-walkthrough.webm");
  if (fs.existsSync(target)) fs.unlinkSync(target);
  fs.renameSync(videoPath, target);

  cleanupTempPhotos(MEDIA);

  console.log("MEDIA_DIR", MEDIA);
  console.log("VIDEO", target, fs.statSync(target).size);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
