import puppeteer from 'puppeteer-core';
import https from 'https';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';
const DEMO_COURSE_ID = '97607215-a925-48d8-a817-445f3a1939b3'; // Java course in Neon DB
const SCREENSHOT_DIR = path.resolve('docs/screenshots');

function getClerkSignInToken(userId) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ user_id: userId });
    const req = https.request({
      hostname: 'api.clerk.com',
      path: '/v1/sign_in_tokens',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.CLERK_SECRET_KEY,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log('===> 1. Generating Clerk authentication session...');
  const ticket = await getClerkSignInToken('user_357CH1ZRaBPzWn4x01jT4Brg4qo');
  if (!ticket || !ticket.token) {
    throw new Error('Failed to generate Clerk sign-in ticket');
  }

  console.log('===> 2. Launching headless Chrome engine (1920x1080)...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // ─── 01. LANDING PAGE ────────────────────────────────────────────────────────
  console.log('\n[1/10] Capturing Landing Page Hero...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('h1', { timeout: 15000 });
  await sleep(1500); // Allow framer-motion entrance animations to settle
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-landing-hero.png'), fullPage: false });
  console.log('✓ Captured: 01-landing-hero.png');

  // ─── AUTHENTICATE CLERK SESSION ──────────────────────────────────────────────
  console.log('\nAuthenticating browser session with Clerk...');
  await page.goto(`${BASE_URL}/sign-in?__clerk_ticket=${ticket.token}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(4000); // Wait for Clerk token consumption & session cookie write

  // ─── 02. DASHBOARD OVERVIEW ──────────────────────────────────────────────────
  console.log('\n[2/10] Capturing Academic Dashboard Overview...');
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('h2, div', { timeout: 15000 });
  await sleep(3500); // Wait for course cards and credit balances to load from Neon DB
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-dashboard-overview.png'), fullPage: false });
  console.log('✓ Captured: 02-dashboard-overview.png');

  // ─── 03. COURSE CREATION STUDIO ──────────────────────────────────────────────
  console.log('\n[3/10] Capturing Course Creation Studio...');
  await page.goto(`${BASE_URL}/create`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(1500);
  // Select "Job Interview" category card
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('[role="radio"], div[tabindex="0"]'));
    if (cards.length > 1) cards[1].click();
  });
  await sleep(500);

  // Click Next Step button to show topic input & difficulty selector
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const nextBtn = btns.find(b => b.innerText.includes('Next'));
    if (nextBtn) nextBtn.click();
  });
  await sleep(1000);

  // Type a realistic sample topic to demonstrate prompt input
  const topicInput = await page.$('input, textarea');
  if (topicInput) {
    await topicInput.type('Distributed Systems: Microservices & Event-Driven Architecture with Kafka', { delay: 15 });
  }
  await sleep(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-course-studio.png'), fullPage: false });
  console.log('✓ Captured: 03-course-studio.png');

  // ─── 04. COURSE HUB & SYLLABUS ───────────────────────────────────────────────
  console.log('\n[4/10] Capturing Course Curriculum Hub...');
  await page.goto(`${BASE_URL}/courses/${DEMO_COURSE_ID}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('h2, div', { timeout: 15000 });
  await sleep(2500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-course-hub.png'), fullPage: false });
  console.log('✓ Captured: 04-course-hub.png');

  // ─── 05. CHAPTER NOTES & AUDIO NARRATION ─────────────────────────────────────
  console.log('\n[5/10] Capturing Interactive Chapter Notes & Audio Reader...');
  await page.goto(`${BASE_URL}/courses/${DEMO_COURSE_ID}/notes`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('.prose, h2', { timeout: 15000 });
  await sleep(2500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-chapter-notes.png'), fullPage: false });
  console.log('✓ Captured: 05-chapter-notes.png');

  // ─── 06. GROUNDED AI TUTOR DRAWER ────────────────────────────────────────────
  console.log('\n[6/10] Capturing Grounded AI Tutor Drawer...');
  // Click the floating "Ask AI Tutor" button
  const tutorBtn = await page.$('button.fixed.bottom-6.right-6, button:has(svg.lucide-sparkles)');
  if (tutorBtn) {
    await tutorBtn.click();
    await sleep(1500); // Wait for slide-over drawer animation
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-ai-tutor-drawer.png'), fullPage: false });
  console.log('✓ Captured: 06-ai-tutor-drawer.png');

  // ─── 07. SPACED REPETITION FLASHCARDS ────────────────────────────────────────
  console.log('\n[7/10] Capturing Spaced Repetition (SRS) Flashcards Studio...');
  await page.goto(`${BASE_URL}/courses/${DEMO_COURSE_ID}/flashcards`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-srs-flashcards.png'), fullPage: false });
  console.log('✓ Captured: 07-srs-flashcards.png');

  // ─── 08. SELF-GRADING ASSESSMENT QUIZ ────────────────────────────────────────
  console.log('\n[8/10] Capturing Assessment Quiz with Feedback Selection...');
  await page.goto(`${BASE_URL}/courses/${DEMO_COURSE_ID}/quiz`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2500);
  // Click first answer option if present
  const firstOption = await page.$('input[type="radio"], [role="radio"], .cursor-pointer.border');
  if (firstOption) {
    await firstOption.click();
    await sleep(800);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-quiz-assessment.png'), fullPage: false });
  console.log('✓ Captured: 08-quiz-assessment.png');

  // ─── 09. PUBLIC SHARED COURSE PORTAL (INCOGNITO) ─────────────────────────────
  console.log('\n[9/10] Capturing Public Shared Course Portal (Unauthenticated)...');
  const incognitoContext = await browser.createBrowserContext();
  const publicPage = await incognitoContext.newPage();
  await publicPage.setViewport({ width: 1920, height: 1080 });
  await publicPage.goto(`${BASE_URL}/share/${DEMO_COURSE_ID}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3500);
  await publicPage.screenshot({ path: path.join(SCREENSHOT_DIR, '09-public-shared-course.png'), fullPage: false });
  await publicPage.close();
  await incognitoContext.close();
  console.log('✓ Captured: 09-public-shared-course.png');

  // ─── 10. BILLING & UPGRADES ──────────────────────────────────────────────────
  console.log('\n[10/10] Capturing Academic Pricing & Upgrades...');
  await page.goto(`${BASE_URL}/dashboard/upgrade`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-billing-upgrade.png'), fullPage: false });
  console.log('✓ Captured: 10-billing-upgrade.png');

  await browser.close();
  console.log('\nAll 10 full-viewport screenshots captured successfully in docs/screenshots/!');
}

run().catch(err => {
  console.error('\nScreenshot capture automation failed:', err);
  process.exit(1);
});
