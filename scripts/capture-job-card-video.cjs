const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const MEDIA =
  "C:\\Users\\dines\\AppData\\Local\\Cursor\\AgentStores\\cursor_agent_stores\\bc-3433f4b1-143f-4648-85a3-95362fbe65de\\files\\media\\job-card";
const BASE = "http://127.0.0.1:4317";

async function fillByLabel(page, labelText, value) {
  const label = page.locator("label", { hasText: labelText }).first();
  const field = label.locator("xpath=following-sibling::*[1]");
  await field.fill(value);
}

(async () => {
  fs.mkdirSync(MEDIA, { recursive: true });
  const angles = ["front", "rear", "left", "right", "top"];
  const pngBytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
  for (const a of angles) {
    fs.writeFileSync(path.join(MEDIA, `_tmp-${a}.png`), pngBytes);
  }

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

  const inputs = page.locator('input[type="file"]');
  const count = await inputs.count();
  for (let i = 0; i < count; i++) {
    await inputs.nth(i).setInputFiles(path.join(MEDIA, `_tmp-${angles[i]}.png`));
  }
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

  for (const a of angles) {
    const p = path.join(MEDIA, `_tmp-${a}.png`);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  console.log("VIDEO", target, fs.statSync(target).size);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
