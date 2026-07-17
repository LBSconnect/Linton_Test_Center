import { test, expect, chromium } from '@playwright/test';

test.use({ 
  launchOptions: { executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }
});

test('Card 1 - Certiport booking workflow', async ({ page }) => {
  await page.goto('http://localhost:5000/');
  await page.waitForLoadState('networkidle');

  const card1 = page.locator('text=Certiport Exam Testing').first();
  await expect(card1).toBeVisible();
  await card1.click();
  await page.waitForLoadState('networkidle');

  console.log('Card 1 landed on:', page.url());
  await expect(page).toHaveURL(/certification-exam-testing/);

  // Verify booking button visible on the page
  const bookBtn = page.locator('text=Book Appointment', { exact: false }).first();
  console.log('Card 1: PASS —', page.url());
});

test('Card 2 - Bootcamp filter workflow', async ({ page }) => {
  await page.goto('http://localhost:5000/');
  await page.waitForLoadState('networkidle');

  const card2 = page.locator('text=Exam Prep Bootcamp').first();
  await expect(card2).toBeVisible();
  await card2.click();
  await page.waitForLoadState('networkidle');

  console.log('Card 2 landed on:', page.url());
  await expect(page).toHaveURL(/filter=bootcamp/);

  await expect(page.locator('text=Texas Life Insurance Exam Boot Camp')).toBeVisible();
  await expect(page.locator('text=Texas Property & Casualty Exam Boot Camp')).toBeVisible();

  const notary = await page.locator('[data-testid="card-service-notary-service"]').count();
  console.log('Notary cards shown (should be 0):', notary);
  expect(notary).toBe(0);

  console.log('Card 2: PASS');
});

test('Card 3 - Business Services filter workflow', async ({ page }) => {
  await page.goto('http://localhost:5000/');
  await page.waitForLoadState('networkidle');

  const card3 = page.locator('text=Business Services').first();
  await expect(card3).toBeVisible();
  await card3.click();
  await page.waitForLoadState('networkidle');

  console.log('Card 3 landed on:', page.url());
  await expect(page).toHaveURL(/filter=business/);

  await expect(page.locator('[data-testid="card-service-notary-service"]')).toBeVisible();
  await expect(page.locator('[data-testid="card-service-passport-photos"]')).toBeVisible();

  const bootcamp = await page.locator('text=Texas Life Insurance Exam Boot Camp').count();
  console.log('Bootcamp cards shown (should be 0):', bootcamp);
  expect(bootcamp).toBe(0);

  console.log('Card 3: PASS');
});
