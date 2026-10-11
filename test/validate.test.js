import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateLead, normaliseWebsite, FIELDS } from '../public/js/validate.js';

const valid = {
  businessName: '  Tanjong Physio  ',
  website: 'www.tanjongphysio.sg',
  location: 'Singapore',
  name: 'Mei Lin',
  email: 'mei@tanjongphysio.sg',
};

test('valid input is trimmed and website normalised', () => {
  const r = validateLead(valid);
  assert.equal(r.ok, true);
  assert.deepEqual(r.lead, {
    businessName: 'Tanjong Physio',
    website: 'https://www.tanjongphysio.sg/',
    location: 'Singapore',
    city: '',
    name: 'Mei Lin',
    email: 'mei@tanjongphysio.sg',
  });
});

test('empty input reports every field', () => {
  const r = validateLead({});
  assert.equal(r.ok, false);
  // city is only asked for once a non-Singapore location is chosen
  assert.deepEqual(Object.keys(r.errors).sort(), FIELDS.filter((f) => f !== 'city').sort());
});

test('website normalisation', () => {
  assert.equal(normaliseWebsite('example.com'), 'https://example.com/');
  assert.equal(normaliseWebsite('http://example.com/about'), 'http://example.com/about');
  assert.equal(normaliseWebsite('HTTPS://Shop.Example.co.uk'), 'https://shop.example.co.uk/');
  for (const bad of ['', '   ', 'not a website', 'localhost', 'http://', 'javascript:alert(1)', 'ftp://x.com', '8.8.8.8', 'example.c']) {
    assert.equal(normaliseWebsite(bad), null, `expected null for "${bad}"`);
  }
});

test('invalid email is rejected', () => {
  for (const email of ['a@b', 'a b@c.com', 'no-at.com', '@x.com']) {
    assert.ok(validateLead({ ...valid, email }).errors?.email, email);
  }
});

test('location is required', () => {
  assert.ok(validateLead({ ...valid, location: '' }).errors.location);
});

test('city is required outside Singapore and dropped inside it', () => {
  const abroad = { ...valid, location: 'Malaysia' };
  assert.equal(validateLead(abroad).errors.city, 'Enter the city your business is in.');
  assert.equal(validateLead({ ...abroad, city: '  Kuala Lumpur ' }).lead.city, 'Kuala Lumpur');
  const home = validateLead({ ...valid, city: 'Anywhere' });
  assert.equal(home.ok, true);
  assert.equal(home.lead.city, '');
});

test('over-long values are rejected', () => {
  assert.ok(validateLead({ ...valid, businessName: 'x'.repeat(201) }).errors.businessName);
});

test('non-string values do not throw', () => {
  assert.equal(validateLead({ ...valid, name: 42 }).ok, true);
  assert.equal(validateLead(null).ok, false);
});
