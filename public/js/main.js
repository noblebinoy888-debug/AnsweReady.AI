import { validateLead, FIELDS, HOME_COUNTRY } from './validate.js';

// Leads go to the answeReady engine (answeready-engine), which stores them for the admin page.
// ponytail: the dev server has no HTTPS yet, so plain-http pages use its raw IP:port; drop that branch once api.answeready.ai is live.
const LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);
const FORM_URL = LOCAL ? 'http://localhost:8787/api/leads'
  : location.protocol === 'http:' ? 'http://27.71.26.165:9100/api/leads' : 'https://api.answeready.ai/api/leads';

const form = document.getElementById('snapshot-form');
const success = document.getElementById('snapshot-success');
const formError = document.getElementById('form-error');
const button = form.querySelector('button[type="submit"]');
const buttonHtml = button.innerHTML;

function showErrors(errors) {
  for (const name of FIELDS) {
    const msg = errors[name] || '';
    form.elements[name].setAttribute('aria-invalid', msg ? 'true' : 'false');
    document.getElementById(`${name}-error`).textContent = msg;
  }
  const first = FIELDS.find((name) => errors[name]);
  if (first) form.elements[first].focus();
}

function attribution() {
  const out = { referrer: document.referrer };
  const utm = new URLSearchParams();
  for (const [key, value] of new URLSearchParams(location.search)) {
    if (key.startsWith('utm_')) {
      out[key] = value;
      utm.append(key, value);
    }
  }
  const qs = utm.toString();
  out.landingUrl = location.origin + location.pathname + (qs ? `?${qs}` : '');
  return out;
}

function setBusy(busy) {
  button.disabled = busy;
  if (busy) button.textContent = 'Sending…';
  else button.innerHTML = buttonHtml;
}

// Outside Singapore we also ask for the city.
const cityField = document.getElementById('city-field');
function syncCity() {
  const abroad = form.elements.location.value !== HOME_COUNTRY;
  cityField.hidden = !abroad;
  if (!abroad) {
    form.elements.city.value = '';
    form.elements.city.setAttribute('aria-invalid', 'false');
    document.getElementById('city-error').textContent = '';
  }
}
form.elements.location.addEventListener('change', syncCity);
syncCity(); // browsers restore the old selection on reload

// "Request a snapshot" buttons jump back to the form.
for (const el of document.querySelectorAll('[data-go-form]')) {
  el.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => form.elements.businessName.focus({ preventScroll: true }), 500);
  });
}

// Clear a field's error as soon as the visitor starts fixing it.
form.addEventListener('input', (event) => {
  const field = event.target;
  if (field.getAttribute('aria-invalid') !== 'true') return;
  field.setAttribute('aria-invalid', 'false');
  document.getElementById(`${field.name}-error`).textContent = '';
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formError.hidden = true;

  const data = Object.fromEntries(new FormData(form));
  const result = validateLead(data);
  showErrors(result.ok ? {} : result.errors);
  if (!result.ok) return;

  setBusy(true);
  try {
    const res = await fetch(FORM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...data, ...attribution() }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // No fake "analysing…" screen: nothing is generated in real time.
    form.hidden = true;
    success.hidden = false;
    document.getElementById('success-title').focus();
  } catch {
    formError.textContent = 'Something went wrong and we could not send your request. Please try again, or email us at hello@answeready.ai.';
    formError.hidden = false;
  } finally {
    setBusy(false);
  }
});
