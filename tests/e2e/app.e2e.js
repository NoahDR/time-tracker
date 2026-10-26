import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, devices } from 'playwright';
import { serve } from '../../scripts/serve.js';

let server;
let browser;

before(async () => {
  server = await serve();
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  server?.close();
});

async function openApp() {
  const context = await browser.newContext({
    ...devices['iPhone 15 Pro'],
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(server.url);
  await page.waitForSelector('.tile');
  return { context, page, errors };
}

test('tracking a day: start, switch, reload, stop, backfill, analyze, export', async () => {
  const { context, page, errors } = await openApp();

  assert.equal(await page.locator('.tile').count(), 13, 'default categories render');

  await page.getByRole('button', { name: /Arbeit/ }).click();
  const first = await page.textContent('.now-clock');
  await page.waitForFunction((text) => document.querySelector('.now-clock').textContent !== text, first, { timeout: 3000 });

  await page.getByRole('button', { name: /Gebet/ }).click();
  assert.match(await page.textContent('.now-label'), /Gebet/, 'switches to the tapped area');
  assert.equal(await page.locator('.log li').count(), 2, 'both entries are logged');

  await page.reload();
  await page.waitForSelector('.now-clock');
  assert.match(await page.textContent('.now-label'), /Gebet/, 'running entry survives a reload');

  await page.getByRole('button', { name: 'Stoppen' }).click();
  assert.equal(await page.locator('.now.idle').count(), 1, 'stop ends tracking');

  await page.getByText('+ Eintrag nachtragen').click();
  await page.locator('dialog select').selectOption('sleep');
  await page.getByRole('button', { name: 'Sichern' }).click();
  assert.equal(await page.locator('dialog').count(), 0, 'sheet closes after saving');
  assert.equal(await page.locator('.log li').count(), 3, 'backfilled entry is logged');

  await page.getByRole('button', { name: /Auswertung/ }).click();
  await page.getByRole('button', { name: 'Jahr' }).click();
  assert.match(await page.textContent('.day-nav h2'), /^\d{4}$/, 'year range is shown');

  await page.getByRole('button', { name: /Einstellungen/ }).click();
  await page.getByRole('button', { name: 'Kopieren' }).click();
  const exported = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
  assert.equal(exported.format, 'time-tracker-export');
  assert.equal(exported.entries.length, 3, 'export contains every entry');

  assert.deepEqual(errors, [], 'no console errors or CSP violations');
  await context.close();
});

test('the installed app starts offline', async () => {
  const { context, page, errors } = await openApp();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await page.waitForSelector('.tile');
  assert.equal(await page.locator('.tile').count(), 13, 'app shell loads from the cache');
  assert.deepEqual(errors, []);
  await context.close();
});
