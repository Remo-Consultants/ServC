/**
 * Indian vehicle registration number validation & normalization.
 * Supports formats: MH12AB1234, MH 12 AB 1234, MH-12-AB-1234
 * Also supports Bharat series: 22BH1234AA
 */

const STATE_CODES = [
  "AN","AP","AR","AS","BR","CG","CH","DD","DL","DN","GA","GJ","HP","HR","JH","JK",
  "KA","KL","LA","LD","MH","ML","MN","MP","MZ","NL","OD","PB","PY","RJ","SK","TN",
  "TR","TS","UK","UP","WB","OR","UA",
] as const;

export function normalizeRegistration(raw: string): string {
  return raw.replace(/[\s\-.]/g, "").toUpperCase();
}

export function isValidIndianRegistration(raw: string): boolean {
  const reg = normalizeRegistration(raw);
  // Standard: SS NN XX NNNN (e.g. MH12AB1234)
  const standard = /^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{1,4})$/;
  // Bharat series: NN BH NNNN XX
  const bharat = /^(\d{2})BH(\d{4})([A-Z]{1,2})$/;

  if (bharat.test(reg)) return true;
  const m = reg.match(standard);
  if (!m) return false;
  return (STATE_CODES as readonly string[]).includes(m[1]);
}

export function formatRegistration(raw: string): string {
  const reg = normalizeRegistration(raw);
  const bharat = reg.match(/^(\d{2})BH(\d{4})([A-Z]{1,2})$/);
  if (bharat) return `${bharat[1]} BH ${bharat[2]} ${bharat[3]}`;

  const m = reg.match(/^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{1,4})$/);
  if (m) return `${m[1]} ${m[2]} ${m[3]} ${m[4]}`;
  return reg;
}

export function extractStateFromReg(raw: string): string | null {
  const reg = normalizeRegistration(raw);
  const m = reg.match(/^([A-Z]{2})/);
  return m ? m[1] : null;
}
