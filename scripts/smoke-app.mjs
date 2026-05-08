import puppeteer from 'puppeteer-core';

const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage();

async function checkViewport(width, height, name) {
  await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: width < 700 });
  await page.goto('http://localhost:5173/?smoke=' + name, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: `.omx/artifacts/${name}.png`, fullPage: false });
  const metrics = await page.evaluate(() => ({
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    text: document.body.innerText,
  }));
  if (metrics.scrollWidth > width + 2 || metrics.bodyScrollWidth > width + 2) {
    throw new Error(`${name} has horizontal overflow: viewport=${width}, doc=${metrics.scrollWidth}, body=${metrics.bodyScrollWidth}`);
  }
  return metrics;
}

const mobile = await checkViewport(390, 1100, 'second-brain-puppeteer-mobile');
const desktop = await checkViewport(1440, 1200, 'second-brain-puppeteer-desktop');

const startText = await page.$eval('body', el => el.textContent || '');
if (!startText.includes('Second Brain makes AGI-masked support needs visible')) throw new Error('Landing thesis missing');
for (const expected of [
  'Thailand-to-global pathway',
  'Family + clinic',
  'LINE-ready',
  'The model expands globally',
]) {
  if (!startText.includes(expected)) throw new Error(`Landing pathway text missing: ${expected}`);
}

await page.click('button.primary-action');
await page.waitForSelector('#persona-title');
await page.click('button.primary-action');
await page.waitForSelector('#companion-title');
await page.click('button.primary-action');
await page.waitForSelector('.signal-alert.warning');
let signalText = await page.$eval('.signal-alert.warning', el => el.textContent || '');
if (!signalText.includes('Support friction rising')) throw new Error('Automatic warning signal missing');
await page.click('button.primary-action');
await page.waitForSelector('.signal-alert.critical');
signalText = await page.$eval('.signal-alert.critical', el => el.textContent || '');
if (!signalText.includes('Serious support issue detected')) throw new Error('Automatic critical signal missing');
if (!signalText.includes('Low-confidence latency')) throw new Error('Critical latency rationale missing');
for (let i = 0; i < 3; i += 1) {
  await page.click('button.primary-action');
}
await page.waitForSelector('#memory-title');
const memoryText = await page.$eval('body', el => el.textContent || '');
if (!memoryText.includes('Episodic store') || !memoryText.includes('Semantic store') || !memoryText.includes('Procedural store') || !memoryText.includes('Working memory')) throw new Error('Memory architecture stores missing');
if (!memoryText.includes('Malee / Morning medication / Recall-first reality anchor')) throw new Error('Persona-specific memory path missing');
const memoryChecks = [
  ['Semantic store', 'LLM-wiki concept'],
  ['Procedural store', 'Morning medication after tea'],
  ['Working memory', 'Active task'],
  ['Episodic store', '08:13'],
];
for (const [label, detail] of memoryChecks) {
  await page.evaluate((buttonLabel) => {
    const button = Array.from(document.querySelectorAll('button')).find((item) => item.textContent?.includes(buttonLabel));
    if (!(button instanceof HTMLElement)) throw new Error(`Missing memory button: ${buttonLabel}`);
    button.click();
  }, label);
  const interactiveMemoryText = await page.$eval('body', el => el.textContent || '');
  if (!interactiveMemoryText.includes(detail)) throw new Error(`Missing interactive memory detail: ${detail}`);
  if (label === 'Semantic store') {
    await page.waitForSelector('.graph-rag-canvas');
    const graphNodeCount = await page.$$eval('.graph-rag-node', nodes => nodes.length);
    const graphEdgeCount = await page.$$eval('.graph-rag-links path', paths => paths.length);
    if (graphNodeCount < 5 || graphEdgeCount < 4) throw new Error('Semantic Graph-RAG visual is incomplete');
  }
}
await page.click('button.primary-action');
await page.waitForSelector('#dashboard-title');
const dashboardText = await page.$eval('body', el => el.textContent || '');
for (const expected of [
  'AGI may be masking functional change',
  'Validation readiness',
  'Multi-domain support radar',
  'Support matrix',
  'Somchai',
  'Araya',
]) {
  if (!dashboardText.includes(expected)) throw new Error(`Missing expected dashboard text: ${expected}`);
}
await page.click('button[role="tab"]:nth-of-type(2)');
const somchai = await page.$eval('body', el => el.textContent || '');
if (!somchai.includes('Social-cue') || !somchai.includes('Financial judgment')) throw new Error('Somchai variant missing social/financial signals');
await page.click('button[role="tab"]:nth-of-type(3)');
const araya = await page.$eval('body', el => el.textContent || '');
if (!araya.includes('Autonomous vs AGI-assisted') || !araya.includes('Monthly accounting')) throw new Error('Araya variant missing communication/finance signals');

console.log(JSON.stringify({ ok: true, mobile: { width: mobile.width, scrollWidth: mobile.scrollWidth }, desktop: { width: desktop.width, scrollWidth: desktop.scrollWidth } }, null, 2));
await browser.close();
