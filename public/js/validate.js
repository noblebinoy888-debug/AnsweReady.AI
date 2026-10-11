// Form validation, used by the browser (main.js). Keep it dependency-free.
export const FIELDS = ['businessName', 'website', 'location', 'city', 'name', 'email'];
// Singapore is a city-state, so only other countries are asked for a city.
export const HOME_COUNTRY = 'Singapore';

const MAX_LEN = { businessName: 200, website: 300, location: 60, city: 100, name: 120, email: 254 };
// ponytail: pragmatic email check; the real test is whether the report email arrives.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normaliseWebsite(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
  } catch {
    return null;
  }
  const tld = url.hostname.split('.').pop();
  if (!url.hostname.includes('.') || !/^[a-z][a-z0-9-]+$/i.test(tld)) return null;
  return url.href;
}

export function validateLead(input) {
  const src = input && typeof input === 'object' ? input : {};
  const v = Object.fromEntries(FIELDS.map((f) => [f, String(src[f] ?? '').trim()]));
  const errors = {};

  if (!v.businessName) errors.businessName = 'Enter your business name.';
  const website = normaliseWebsite(v.website);
  if (!website) errors.website = 'Enter a valid website, e.g. www.yourbusiness.com.';
  if (!v.location) errors.location = 'Select a location.';
  if (v.location === HOME_COUNTRY) v.city = '';
  else if (v.location && !v.city) errors.city = 'Enter the city your business is in.';
  if (!v.name) errors.name = 'Enter your name.';
  if (!EMAIL_RE.test(v.email)) errors.email = 'Enter a valid email address.';
  for (const f of FIELDS) {
    if (!errors[f] && v[f].length > MAX_LEN[f]) errors[f] = `Please keep this under ${MAX_LEN[f]} characters.`;
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, lead: { ...v, website } };
}
