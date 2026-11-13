/* Real-browser checks: npm ci && npx playwright install chromium && npm run test:browser */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

(async () => {
  const root = path.resolve(__dirname, '../public');
  const server = http.createServer((req, res) => {
    let file = path.join(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.statusCode = 404; file = path.join(root, '404.html'); }
    res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.xml': 'application/xml', '.jpg': 'image/jpeg', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
    const errors = [];
    const external = [];
    await context.route('**/*', route => {
      if (route.request().url().startsWith(base)) return route.continue();
      external.push(route.request().url());
      return route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install();
    await page.goto(base + '/fr/');
    assert.equal(await page.locator('html').getAttribute('lang'), 'fr-FR');
    assert.equal(await page.locator('.post-card').count(), 5);
    const sun = page.locator('[data-mountain-sun]');
    const initial = await sun.getAttribute('transform');
    await page.clock.runFor(5000);
    assert.notEqual(await sun.getAttribute('transform'), initial);
    const toggle = page.locator('[data-mountain-toggle]');
    await toggle.click();
    assert.equal(await toggle.textContent(), 'Reprendre');
    const frozen = await sun.getAttribute('transform');
    await page.clock.runFor(4000);
    assert.equal(await sun.getAttribute('transform'), frozen);
    fs.mkdirSync(path.join(__dirname, '../test-results'), { recursive: true });
    await page.screenshot({ path: path.join(__dirname, '../test-results/home-desktop.png'), fullPage: true });
    await page.locator('.language-nav a[lang="en"]').click();
    assert.ok(page.url().endsWith('/en/'));
    if (await page.locator('.post-card').count() === 0) {
      assert.match(await page.locator('.empty-state').textContent(), /No articles in English yet/);
    } else {
      assert.equal(await page.locator('.empty-state').count(), 0);
    }
    assert.equal(await page.locator('[data-mountain-toggle]').textContent(), 'Pause');
    await page.locator('.site-nav a').last().click();
    assert.ok(page.url().endsWith('/en/about/'));
    await page.locator('.language-nav a[lang="fr"]').click();
    assert.ok(page.url().endsWith('/fr/about/'));
    assert.equal(await page.locator('[data-mountain-banner]').count(), 0);
    assert.equal(await page.locator('script').count(), 0);

    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const url of ['/fr/', '/en/', '/fr/about/', '/fr/articles/', '/fr/articles/agrandir-lun-lvm-multipath-linux/', '/fr/articles/centos-rhel-6-vmware-preparation-template/']) {
        await page.goto(base + url);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px overflow: ${url}`);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + '/fr/');
    await page.screenshot({ path: path.join(__dirname, '../test-results/home-mobile.png'), fullPage: true });
    await page.goto(base + '/fr/articles/centos-rhel-6-vmware-preparation-template/');
    assert.equal(await page.locator('.language-nav a').count(), 0);
    assert.equal(await page.locator('.language-unavailable').textContent(), 'EN');
    assert.ok(await page.locator('.highlight').count() >= 2, 'Gists are locally highlighted code');
    assert.match(await page.locator('.archive-note').textContent(), /2015/);
    await page.screenshot({ path: path.join(__dirname, '../test-results/article-mobile.png'), fullPage: true });
    await page.goto(base + '/fr/articles/migrer-donnees-lvm/');
    assert.ok(await page.locator('.prose img').evaluate(img => img.complete && img.naturalWidth > 0));
    await page.goto(base + '/en/experiments/mountains/');
    const studyCanvas = page.locator('.mountain-study__canvas');
    assert.equal(await studyCanvas.isVisible(), true);
    const picture = () => studyCanvas.evaluate(canvas => canvas.toDataURL());
    const still = await picture();
    await page.clock.runFor(5000);
    assert.notEqual(await picture(), still, 'Mist moves');
    await page.locator('[data-study-toggle]').click();
    const pausedStudy = await picture();
    await page.clock.runFor(2000);
    assert.equal(await picture(), pausedStudy, 'Preview pauses');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: path.join(__dirname, '../test-results/mountain-study-mobile.png'), fullPage: true });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.screenshot({ path: path.join(__dirname, '../test-results/mountain-study-desktop.png'), fullPage: true });
    await page.goto(base + '/en/experiments/mountains-wide/');
    for (const width of [320, 390, 1280, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      const landscape = await page.locator('.mountain-study__landscape').boundingBox();
      assert.equal(landscape.x, 0, 'Panorama starts at screen edge');
      assert.equal(landscape.width, width, 'Panorama spans the screen');
      await page.waitForFunction(() => {
        const canvas = document.querySelector('.mountain-study__canvas');
        const bounds = canvas.parentElement.getBoundingClientRect();
        return canvas.width === Math.round(bounds.width) && canvas.height === Math.round(bounds.height);
      });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    const wideCanvas = page.locator('.mountain-study__canvas');
    const wideBefore = await wideCanvas.evaluate(canvas => canvas.toDataURL());
    await page.clock.runFor(5000);
    assert.notEqual(await wideCanvas.evaluate(canvas => canvas.toDataURL()), wideBefore);
    await page.locator('[data-study-toggle]').click();
    const widePaused = await wideCanvas.evaluate(canvas => canvas.toDataURL());
    await page.clock.runFor(2000);
    assert.equal(await wideCanvas.evaluate(canvas => canvas.toDataURL()), widePaused);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: path.join(__dirname, '../test-results/mountain-wide-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(__dirname, '../test-results/mountain-wide-mobile.png'), fullPage: true });
    const response = await page.goto(base + '/missing-page/');
    assert.equal(response.status(), 404);
    assert.equal(await page.locator('h1').count(), 1);

    const reduced = await browser.newContext({ reducedMotion: 'reduce' });
    const reducedPage = await reduced.newPage();
    await reducedPage.goto(base + '/fr/');
    assert.equal(await reducedPage.locator('[data-mountain-toggle]').isVisible(), false);
    assert.equal(await reducedPage.locator('[data-mountain-sun]').getAttribute('transform'), 'translate(240 28)');
    await reducedPage.emulateMedia({ reducedMotion: 'no-preference' });
    await reducedPage.waitForFunction(() => !document.querySelector('[data-mountain-toggle]').hidden);
    await reducedPage.emulateMedia({ reducedMotion: 'reduce' });
    await reducedPage.goto(base + '/fr/experiments/mountains/');
    assert.equal(await reducedPage.locator('[data-study-toggle]').isVisible(), false);
    assert.equal(await reducedPage.locator('canvas').isVisible(), true);
    await reducedPage.goto(base + '/en/experiments/mountains-wide/');
    assert.equal(await reducedPage.locator('[data-study-toggle]').isVisible(), false);
    assert.equal(await reducedPage.locator('canvas').isVisible(), true);
    await reduced.close();

    const nojs = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await nojs.newPage();
    await staticPage.goto(base + '/fr/');
    assert.equal(await staticPage.locator('[data-mountain-toggle]').isVisible(), false);
    await staticPage.locator('.language-nav a').click();
    assert.ok(staticPage.url().endsWith('/en/'));
    await staticPage.goto(base + '/en/experiments/mountains/');
    assert.equal(await staticPage.locator('.mountain-study__fallback').isVisible(), true);
    assert.equal(await staticPage.locator('[data-study-toggle]').isVisible(), false);
    await staticPage.goto(base + '/fr/experiments/mountains-wide/');
    assert.equal(await staticPage.locator('.mountain-study__fallback').isVisible(), true);
    assert.equal(await staticPage.locator('[data-study-toggle]').isVisible(), false);
    await nojs.close();
    assert.deepEqual(errors, []);
    assert.deepEqual(external, [], 'No third-party requests');
    console.log('PASS: bilingual navigation, article rendering, local Gists/image, 320–1280px layouts, animation, reduced motion, no-JS, 404, and zero third-party requests.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
