import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, devices } from 'playwright';
import { serve } from '../../scripts/serve.js';

let server;
let browser;

before(async () => {
  server = await serve();
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
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
  return { context, page, errors };
}

const addViaQuickAdd = async (page, placeholder, name) => {
  const input = page.getByPlaceholder(placeholder);
  await input.fill(name);
  await input.press('Enter');
};

async function buildStructure(page) {
  await page.getByRole('button', { name: 'Privat' }).click();
  await addViaQuickAdd(page, 'Weitere Gruppe …', 'Arbeit');
  await addViaQuickAdd(page, 'Bereich in Privat …', 'Familie');
  await addViaQuickAdd(page, 'Bereich in Privat …', 'Schlafen');
  await addViaQuickAdd(page, 'Bereich in Arbeit …', 'Projekt');
  await page.getByRole('button', { name: 'Los geht’s' }).click();
}

test('first run: build groups and areas, track a day, analyze, export', async () => {
  const { context, page, errors } = await openApp();

  assert.equal(await page.locator('.pill').count(), 0, 'no predefined areas');
  const start = page.getByRole('button', { name: /Lege mindestens einen Bereich an/ });
  assert.ok(await start.isDisabled(), 'cannot finish setup without an area');

  await buildStructure(page);
  assert.deepEqual(await page.locator('.group-head h2').allTextContents(), ['Privat', 'Arbeit']);
  assert.equal(await page.locator('.pill').count(), 3, 'one pill per area');

  await page.locator('.pill', { hasText: 'Projekt' }).click();
  const first = await page.textContent('.hero-clock');
  await page.waitForFunction((text) => document.querySelector('.hero-clock').textContent !== text, first, { timeout: 3000 });

  await page.locator('.pill', { hasText: 'Familie' }).click();
  assert.match(await page.textContent('.hero-title'), /Familie/, 'switches to the tapped area');
  assert.equal(await page.locator('.entries li').count(), 2, 'both entries are logged');

  await page.reload();
  await page.waitForSelector('.hero.live');
  assert.match(await page.textContent('.hero-title'), /Familie/, 'running entry survives a reload');

  await page.locator('.pill.running').click();
  assert.equal(await page.locator('.hero.live').count(), 0, 'tapping the running pill stops it');

  await page.getByRole('button', { name: 'Eintrag nachtragen' }).click();
  await page.locator('dialog select').selectOption({ label: 'Schlafen' });
  await page.getByRole('button', { name: 'Sichern' }).click();
  await page.waitForSelector('dialog', { state: 'detached' });
  assert.equal(await page.locator('.entries li').count(), 3, 'backfilled entry is logged');

  await page.getByRole('button', { name: 'Übersicht' }).click();
  await page.getByRole('tab', { name: 'Tag' }).click();
  assert.equal(await page.locator('.column').count(), 24, 'day chart has hourly columns');
  assert.equal(await page.locator('.legend li').count(), 2, 'legend lists both groups');
  await page.getByRole('tab', { name: 'Jahr' }).click();
  assert.equal(await page.locator('.column').count(), 12, 'year chart has monthly columns');

  await page.getByRole('button', { name: 'Einstellungen' }).click();
  await page.locator('.struct-area', { hasText: 'Projekt' }).click();
  await page.getByLabel('Name').fill('Kundenprojekt');
  await page.getByRole('button', { name: 'Sichern' }).click();
  await page.waitForSelector('dialog', { state: 'detached' });
  assert.equal(await page.locator('.struct-area', { hasText: 'Kundenprojekt' }).count(), 1, 'area renamed');

  await page.getByRole('button', { name: 'Kopieren' }).click();
  const exported = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
  assert.equal(exported.version, 2);
  assert.deepEqual(exported.groups.map((g) => g.name), ['Privat', 'Arbeit']);
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
  await page.waitForSelector('.welcome');
  assert.deepEqual(errors, []);
  await context.close();
});
