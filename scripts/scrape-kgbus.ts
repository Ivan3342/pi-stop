import fs from 'fs';
import path from 'path';
import { chromium, Page } from 'playwright';

export interface DirectionSchedule {
  directionName: string;
  workday: string[];
  saturday: string[];
  sunday: string[];
}

export interface LineTimetable {
  id: string;
  lineNumber: string;
  route: string;
  directionA: DirectionSchedule;
  directionB: DirectionSchedule;
}

const TARGET_URL = 'https://www.kgbus.rs/red-voznje-3/?script=lat';
const OUTPUT_PATH = path.resolve(process.cwd(), 'src/data/timetables.json');

function cleanText(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}

function extractTimes(text: string): string[] {
  const matches = text.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/g) || [];
  return matches.map((t) => (t.length === 4 ? `0${t}` : t));
}

function splitByDay(text: string): {
  workday: string[];
  saturday: string[];
  sunday: string[];
} {
  const satIdx = text.search(/\b(subota|субота)\b/i);
  const sunIdx = text.search(/\b(nedelja|недеља)\b/i);

  if (satIdx !== -1 || sunIdx !== -1) {
    const firstBreak =
      satIdx !== -1 && sunIdx !== -1 ? Math.min(satIdx, sunIdx) : Math.max(satIdx, sunIdx);

    const workdayText = text.slice(0, firstBreak);
    let saturdayText = '';
    let sundayText = '';

    if (satIdx !== -1 && sunIdx !== -1) {
      if (satIdx < sunIdx) {
        saturdayText = text.slice(satIdx, sunIdx);
        sundayText = text.slice(sunIdx);
      } else {
        sundayText = text.slice(sunIdx, satIdx);
        saturdayText = text.slice(satIdx);
      }
    } else if (satIdx !== -1) {
      saturdayText = text.slice(satIdx);
    } else {
      sundayText = text.slice(sunIdx);
    }

    return {
      workday: extractTimes(workdayText),
      saturday: extractTimes(saturdayText),
      sunday: extractTimes(sundayText),
    };
  }

  return {
    workday: extractTimes(text),
    saturday: [],
    sunday: [],
  };
}

function parseRenderedSchedule(
  lineNumber: string,
  routeLabel: string,
  renderedText: string
): LineTimetable | null {
  const normalized = cleanText(renderedText);
  const idxA = normalized.search(/\b(Direction\s*[AА]|Smer\s*A|Смер\s*А)\b/i);
  const idxB = normalized.search(/\b(Direction\s*[BБ]|Smer\s*B|Смер\s*Б)\b/i);

  let rawA = normalized;
  let rawB = '';

  if (idxA !== -1 && idxB !== -1) {
    if (idxA < idxB) {
      rawA = normalized.slice(idxA, idxB);
      rawB = normalized.slice(idxB);
    } else {
      rawB = normalized.slice(idxB, idxA);
      rawA = normalized.slice(idxA);
    }
  } else if (idxA !== -1) {
    rawA = normalized.slice(idxA);
  } else if (idxB !== -1) {
    rawB = normalized.slice(idxB);
  }

  const schedA = splitByDay(rawA);
  const schedB = splitByDay(rawB);

  const totalTimes =
    schedA.workday.length +
    schedA.saturday.length +
    schedA.sunday.length +
    schedB.workday.length +
    schedB.saturday.length +
    schedB.sunday.length;

  if (totalTimes === 0) return null;

  const cleanRoute = cleanText(routeLabel) || `Linija ${lineNumber}`;

  return {
    id: lineNumber,
    lineNumber,
    route: cleanRoute,
    directionA: {
      directionName: `Smer A: ${cleanRoute}`,
      ...schedA,
    },
    directionB: {
      directionName: `Smer B: Povratak`,
      ...schedB,
    },
  };
}

async function waitForTimesToRender(page: Page, previousSnapshot: string): Promise<string> {
  const start = Date.now();
  const timeoutMs = 6000;

  while (Date.now() - start < timeoutMs) {
    const currentText = await page.evaluate(() => document.body.innerText || '');
    const cleaned = cleanText(currentText);
    const hasTime = /\b([01]?\d|2[0-3]):[0-5]\d\b/.test(cleaned);
    if (hasTime && cleaned !== previousSnapshot) {
      await page.waitForTimeout(250);
      return cleanText((await page.evaluate(() => document.body.innerText)) || '');
    }
    await page.waitForTimeout(200);
  }

  return cleanText((await page.evaluate(() => document.body.innerText)) || '');
}

async function scrapeInteractiveTimetables() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });

  try {
    console.log(`Opening ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Locate clickable line controls (buttons, tabs, list items, or links)
    const clickableSelector =
      'button, [role="tab"], .vc_tta-tab, .nav-link, li, .line-item, a';
    const candidateHandles = await page.locator(clickableSelector).all();

    const lineTargets: { index: number; lineNumber: string; route: string }[] = [];

    for (let i = 0; i < candidateHandles.length; i++) {
      const handle = candidateHandles[i];
      if (!(await handle.isVisible().catch(() => false))) continue;

      const rawText = cleanText((await handle.innerText().catch(() => '')) || '');
      if (!rawText || rawText.length > 160) continue;

      // Match line identifiers like "1", "16", "606", "Linija 17", "1 - Veliko Polje -> Desimirovac"
      const match = rawText.match(
        /^(?:Linija|Line|Линија)?\s*(\d+[A-Za-zА-Яа-я]?)\b(?:\s*[-–:|·→>]\s*(.+))?$/i
      );

      if (match) {
        const lineNumber = match[1].trim();
        const route = (match[2] || '').trim();
        // Avoid duplicating the exact same line button index
        if (!lineTargets.some((t) => t.lineNumber === lineNumber && t.route === route)) {
          lineTargets.push({ index: i, lineNumber, route });
        }
      }
    }

    console.log(`Found ${lineTargets.length} clickable bus line elements. Clicking each one...`);

    const collected = new Map<string, LineTimetable>();

    for (const target of lineTargets) {
      const currentHandles = await page.locator(clickableSelector).all();
      const el = currentHandles[target.index];
      if (!el) continue;

      const beforeText = cleanText((await page.evaluate(() => document.body.innerText)) || '');

      try {
        await el.scrollIntoViewIfNeeded();
        await el.click({ timeout: 5000 });
      } catch {
        // Fallback DOM click if overlay/navigation intercepts normal click
        await el.evaluate((node: HTMLElement) => node.click()).catch(() => {});
      }

      const afterText = await waitForTimesToRender(page, beforeText);
      const parsed = parseRenderedSchedule(target.lineNumber, target.route, afterText);

      if (parsed) {
        collected.set(parsed.lineNumber, parsed);
        console.log(`Captured line ${parsed.lineNumber} (${parsed.route})`);
      } else {
        console.warn(`No departure times detected after clicking line ${target.lineNumber}`);
      }
    }

    const sorted = Array.from(collected.values()).sort((a, b) =>
      a.lineNumber.localeCompare(b.lineNumber, undefined, { numeric: true })
    );

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(sorted, null, 2), 'utf-8');
    console.log(`Saved ${sorted.length} bus lines to ${OUTPUT_PATH}`);
  } finally {
    await browser.close();
  }
}

scrapeInteractiveTimetables().catch((err) => {
  console.error('Interactive scraper failed:', err);
  process.exit(1);
});