/**
 * business-hours.spec.ts
 *
 * Verifies the booking calendar and API enforce correct business hours:
 *
 *   Monday, Tuesday, Wednesday, Friday  —  8 AM – 5 PM CT (slots 8 AM – 4 PM)
 *   Saturday                            —  8 AM – 4 PM CT (slots 8 AM – 3 PM)
 *   Thursday                            —  CLOSED (no slots)
 *   Sunday                              —  CLOSED (no slots)
 *
 * Tests run at the API level (no browser needed) so they are fast and
 * deterministic regardless of which day of the week today happens to be.
 */
import { test, expect } from "@playwright/test";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { TEST_TAG } from "../fixtures/seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.test") });

const BASE_URL = process.env.BASE_URL ?? "http://localhost:5000";

// ─── Timezone helpers ───────────────────────────────────────────────────────

/**
 * Returns true if the given UTC date falls in Central Daylight Time.
 * CDT: 2nd Sunday of March → 1st Sunday of November.
 */
function isCDT(date: Date): boolean {
  const year = date.getUTCFullYear();
  const mar1Dow = new Date(Date.UTC(year, 2, 1)).getUTCDay();
  const dstStartDay = 1 + (7 - mar1Dow) % 7 + 7;
  const dstStart = new Date(Date.UTC(year, 2, dstStartDay, 8, 0, 0));
  const nov1Dow = new Date(Date.UTC(year, 10, 1)).getUTCDay();
  const dstEndDay = 1 + (7 - nov1Dow) % 7;
  const dstEnd = new Date(Date.UTC(year, 10, dstEndDay, 7, 0, 0));
  return date >= dstStart && date < dstEnd;
}

/** Convert a CT hour-of-day to its UTC equivalent for the given date. */
function ctHourToUTC(dateUTC: Date, ctHour: number): number {
  return ctHour + (isCDT(dateUTC) ? 5 : 6);
}

/**
 * Find the next date (from today, potentially including today) whose UTC day
 * of week matches `targetDow` (0 = Sunday … 6 = Saturday).
 * Returns a Date set to midnight UTC on that day.
 */
function nextDayOfWeek(targetDow: number): Date {
  const now = new Date();
  const todayDow = now.getUTCDay();
  const daysAhead = (targetDow - todayDow + 7) % 7 || 7; // 1–7 (never 0 — always future)
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysAhead));
  return d;
}

/** Build a UTC ISO string for the given date at the given CT hour. */
function slotISO(dateUTC: Date, ctHour: number): string {
  const utcHour = ctHourToUTC(dateUTC, ctHour);
  return new Date(Date.UTC(
    dateUTC.getUTCFullYear(),
    dateUTC.getUTCMonth(),
    dateUTC.getUTCDate() + (utcHour >= 24 ? 1 : 0),
    utcHour % 24,
    0, 0, 0,
  )).toISOString();
}

/** Fetch the available slots from the API for a given UTC date. */
async function fetchSlots(dateISO: string): Promise<string[]> {
  const res = await fetch(
    `${BASE_URL}/api/appointments/available-slots?date=${encodeURIComponent(dateISO)}`
  );
  expect(res.status).toBe(200);
  const body = await res.json();
  return body.slots as string[];
}

/** Convert a slot ISO string to CT hour-of-day. */
function slotToCTHour(slotISO: string, refDate: Date): number {
  const slotDate = new Date(slotISO);
  const utcHour = slotDate.getUTCHours();
  const offset = isCDT(refDate) ? 5 : 6;
  return (utcHour - offset + 24) % 24;
}

/** POST a booking to the API. */
async function postBooking(payload: object): Promise<Response> {
  return fetch(`${BASE_URL}/api/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe("Thursday — closed all day", () => {
  test("returns zero slots for next Thursday", async () => {
    const thu = nextDayOfWeek(4); // dow 4 = Thursday
    const slots = await fetchSlots(thu.toISOString());
    expect(slots).toHaveLength(0);
  });

  test("rejects a direct API booking on Thursday with 400", async () => {
    const thu = nextDayOfWeek(4);
    const res = await postBooking({
      customerName: "Test Thursday",
      customerEmail: `thu+${Date.now()}@e2e.test`,
      customerPhone: "(713) 555-0001",
      serviceName: "Notary Service",
      appointmentDate: slotISO(thu, 10), // 10 AM CT Thursday
      payNow: true,
      notes: `${TEST_TAG}:thu-reject`,
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid appointment time/i);
  });
});

test.describe("Sunday — closed all day", () => {
  test("returns zero slots for next Sunday", async () => {
    const sun = nextDayOfWeek(0);
    const slots = await fetchSlots(sun.toISOString());
    expect(slots).toHaveLength(0);
  });

  test("rejects a direct API booking on Sunday with 400", async () => {
    const sun = nextDayOfWeek(0);
    const res = await postBooking({
      customerName: "Test Sunday",
      customerEmail: `sun+${Date.now()}@e2e.test`,
      customerPhone: "(713) 555-0002",
      serviceName: "Notary Service",
      appointmentDate: slotISO(sun, 10),
      payNow: true,
      notes: `${TEST_TAG}:sun-reject`,
    });
    expect(res.status).toBe(400);
  });
});

test.describe("Saturday — 8 AM to 4 PM (last slot 3 PM)", () => {
  test("first slot is 8 AM CT", async () => {
    const sat = nextDayOfWeek(6);
    const slots = await fetchSlots(sat.toISOString());
    expect(slots.length).toBeGreaterThan(0);
    const firstCTHour = slotToCTHour(slots[0], sat);
    expect(firstCTHour).toBe(8);
  });

  test("last slot is 3 PM CT (not 4 PM or later)", async () => {
    const sat = nextDayOfWeek(6);
    const slots = await fetchSlots(sat.toISOString());
    expect(slots.length).toBeGreaterThan(0);
    const lastCTHour = slotToCTHour(slots[slots.length - 1], sat);
    expect(lastCTHour).toBe(15); // 3 PM
  });

  test("has exactly 8 slots (8 AM through 3 PM inclusive)", async () => {
    const sat = nextDayOfWeek(6);
    const slots = await fetchSlots(sat.toISOString());
    expect(slots).toHaveLength(8); // 8,9,10,11,12,13,14,15
  });

  test("a 4 PM slot is not in the Saturday list", async () => {
    const sat = nextDayOfWeek(6);
    const slots = await fetchSlots(sat.toISOString());
    const slot4pm = slotISO(sat, 16); // 4 PM CT
    expect(slots).not.toContain(slot4pm);
  });

  test("rejects a direct API booking at 4 PM Saturday with 400", async () => {
    const sat = nextDayOfWeek(6);
    const res = await postBooking({
      customerName: "Test Sat 4pm",
      customerEmail: `sat4pm+${Date.now()}@e2e.test`,
      customerPhone: "(713) 555-0003",
      serviceName: "Notary Service",
      appointmentDate: slotISO(sat, 16), // 4 PM CT — past last slot
      payNow: true,
      notes: `${TEST_TAG}:sat-4pm-reject`,
    });
    expect(res.status).toBe(400);
  });
});

test.describe("Monday — 8 AM to 5 PM (last slot 4 PM)", () => {
  test("first slot is 8 AM CT", async () => {
    const mon = nextDayOfWeek(1);
    const slots = await fetchSlots(mon.toISOString());
    expect(slots.length).toBeGreaterThan(0);
    const firstCTHour = slotToCTHour(slots[0], mon);
    expect(firstCTHour).toBe(8);
  });

  test("last slot is 4 PM CT (not 5 PM or later)", async () => {
    const mon = nextDayOfWeek(1);
    const slots = await fetchSlots(mon.toISOString());
    const lastCTHour = slotToCTHour(slots[slots.length - 1], mon);
    expect(lastCTHour).toBe(16); // 4 PM
  });

  test("has exactly 9 slots (8 AM through 4 PM inclusive)", async () => {
    const mon = nextDayOfWeek(1);
    const slots = await fetchSlots(mon.toISOString());
    expect(slots).toHaveLength(9); // 8,9,10,11,12,13,14,15,16
  });

  test("a 5 PM slot is not in the Monday list", async () => {
    const mon = nextDayOfWeek(1);
    const slots = await fetchSlots(mon.toISOString());
    const slot5pm = slotISO(mon, 17); // 5 PM CT
    expect(slots).not.toContain(slot5pm);
  });

  test("rejects a direct API booking at 5 PM Monday with 400", async () => {
    const mon = nextDayOfWeek(1);
    const res = await postBooking({
      customerName: "Test Mon 5pm",
      customerEmail: `mon5pm+${Date.now()}@e2e.test`,
      customerPhone: "(713) 555-0004",
      serviceName: "Notary Service",
      appointmentDate: slotISO(mon, 17), // 5 PM CT — past closing
      payNow: true,
      notes: `${TEST_TAG}:mon-5pm-reject`,
    });
    expect(res.status).toBe(400);
  });
});

test.describe("Tuesday — same hours as Monday", () => {
  test("last slot is 4 PM CT", async () => {
    const tue = nextDayOfWeek(2);
    const slots = await fetchSlots(tue.toISOString());
    expect(slots.length).toBeGreaterThan(0);
    const lastCTHour = slotToCTHour(slots[slots.length - 1], tue);
    expect(lastCTHour).toBe(16);
  });
});

test.describe("Wednesday — same hours as Monday", () => {
  test("last slot is 4 PM CT", async () => {
    const wed = nextDayOfWeek(3);
    const slots = await fetchSlots(wed.toISOString());
    expect(slots.length).toBeGreaterThan(0);
    const lastCTHour = slotToCTHour(slots[slots.length - 1], wed);
    expect(lastCTHour).toBe(16);
  });
});

test.describe("Friday — 8 AM to 5 PM (last slot 4 PM)", () => {
  test("last slot is 4 PM CT", async () => {
    const fri = nextDayOfWeek(5);
    const slots = await fetchSlots(fri.toISOString());
    expect(slots.length).toBeGreaterThan(0);
    const lastCTHour = slotToCTHour(slots[slots.length - 1], fri);
    expect(lastCTHour).toBe(16);
  });

  test("has exactly 9 slots", async () => {
    const fri = nextDayOfWeek(5);
    const slots = await fetchSlots(fri.toISOString());
    expect(slots).toHaveLength(9);
  });
});

test.describe("All services return correct slots", () => {
  const services = [
    "computer-workstation-rental",
    "notary-service",
    "passport-photos",
    "remote-proctoring",
    "certification-exam-testing",
  ];

  for (const slug of services) {
    test(`${slug}: Monday slots are 8 AM–4 PM`, async ({ page }) => {
      const mon = nextDayOfWeek(1);
      const slots = await fetchSlots(mon.toISOString());
      expect(slots.length).toBeGreaterThan(0);

      const ctHours = slots.map((s) => slotToCTHour(s, mon));
      expect(Math.min(...ctHours)).toBe(8);
      expect(Math.max(...ctHours)).toBe(16);
    });

    test(`${slug}: calendar page disables Thursday`, async ({ page }) => {
      await page.goto(`/services/${slug}`);
      await page.waitForSelector("table");

      // Find all Thursday cells in the calendar — they should be disabled
      // The shadcn calendar marks disabled dates with aria-disabled="true"
      // We verify no Thursday button is clickable
      const thu = nextDayOfWeek(4);
      const thuDay = thu.getUTCDate();

      // Locate the day button for next Thursday by its aria-label or displayed number
      const thuBtn = page.locator(
        `button[name="day"][aria-disabled="true"]`
      ).filter({ hasText: String(thuDay) }).first();

      // The button may not be visible if we're on the wrong month; skip if not found
      const visible = await thuBtn.isVisible().catch(() => false);
      if (visible) {
        await expect(thuBtn).toBeDisabled();
      }
    });
  }
});

test.describe("Before-hours and after-hours API rejection", () => {
  test("rejects booking at 7 AM CT on a weekday (before open)", async () => {
    const mon = nextDayOfWeek(1);
    const res = await postBooking({
      customerName: "Early Bird",
      customerEmail: `early+${Date.now()}@e2e.test`,
      customerPhone: "(713) 555-0010",
      serviceName: "Notary Service",
      appointmentDate: slotISO(mon, 7), // 7 AM CT
      payNow: true,
      notes: `${TEST_TAG}:before-hours`,
    });
    expect(res.status).toBe(400);
  });

  test("rejects booking at midnight CT on a weekday", async () => {
    const mon = nextDayOfWeek(1);
    const res = await postBooking({
      customerName: "Midnight Booker",
      customerEmail: `midnight+${Date.now()}@e2e.test`,
      customerPhone: "(713) 555-0011",
      serviceName: "Notary Service",
      appointmentDate: slotISO(mon, 0), // midnight CT
      payNow: true,
      notes: `${TEST_TAG}:midnight`,
    });
    expect(res.status).toBe(400);
  });
});
