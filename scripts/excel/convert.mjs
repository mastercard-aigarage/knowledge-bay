import fs from 'node:fs/promises';
import path from 'node:path';
import XLSX from 'xlsx';

const repoRoot = process.cwd();

const DEFAULT_XLSX = path.join(repoRoot, 'content', 'knowledge_bay_content_local.xlsx');
const OUT_ROOT = path.join(repoRoot, 'src', 'content', 'generated');

function asString(value) {
  if (value == null) return '';
  return String(value);
}

function ensureNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function ensureNumberOrNull(value) {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseCoordinate(value, kind) {
  // Supports:
  // - 32.2217
  // - "32.2217"
  // - "32.2217° N", "110.9265° W"
  // - "-110.9265"
  const raw = asString(value).trim();
  if (!raw) return null;

  const match = raw.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  let num = Number(match[0]);
  if (!Number.isFinite(num)) return null;

  const upper = raw.toUpperCase();
  const hasSouth = upper.includes('S');
  const hasWest = upper.includes('W');
  const hasNorth = upper.includes('N');
  const hasEast = upper.includes('E');

  if (kind === 'lat') {
    if (hasSouth && num > 0) num = -num;
    if (hasNorth && num < 0) num = Math.abs(num);
    if (num < -90 || num > 90) return null;
  } else {
    if (hasWest && num > 0) num = -num;
    if (hasEast && num < 0) num = Math.abs(num);
    if (num < -180 || num > 180) return null;
  }

  // If no hemisphere letter is provided, keep numeric sign as-is.
  if (!(hasNorth || hasSouth || hasEast || hasWest)) return num;
  return num;
}

function splitList(value) {
  return asString(value)
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

function readWorkbook(xlsxPath) {
  return XLSX.readFile(xlsxPath, { cellDates: false });
}

function rowsFromSheet(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
}

async function writeJson(relPath, data) {
  const fullPath = path.join(OUT_ROOT, relPath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function sheetKeyValue(rows) {
  const out = {};
  for (const row of rows) {
    const key = asString(row.Key).trim();
    if (!key) continue;
    out[key] = {
      text: asString(row.Text ?? '').trim(),
      iconKey: asString(row.IconKey ?? '').trim() || undefined
    };
  }
  return out;
}

function normalizeEventRow(row) {
  return {
    name: asString(row['Event Name']).trim(),
    destination: asString(row['Event Destination']).trim(),
    description: asString(row['Event Description']).trim(),
    link: asString(row['Event Website Link']).trim(),
    imagePath: asString(row['Event Image Path']).trim(),
    year: ensureNumberOrNull(row.year ?? row['year']),
    position: asString(row.Position ?? '').trim() || undefined
  };
}

function normalizeUniversityRow(row) {
  // New (globe) schema preferred; keep old schema compatibility.
  const id = asString(row.Id).trim();
  const institution = asString(row.Institution).trim();

  if (id || institution) {
    return {
      id,
      institution,
      city: asString(row.City).trim(),
      country: asString(row.Country).trim(),
      lat: ensureNumberOrNull(row.Lat),
      lng: ensureNumberOrNull(row.Lng),
      focusAreas: splitList(row['Focus Areas']),
      description: asString(row.Description).trim(),
      people: splitList(row['Peoples Involved']),
      websiteLink: asString(row['Website Link']).trim(),
      imagePath: asString(row['Image Path']).trim()
    };
  }

  // Old schema fallback
  const name = asString(row['Collaboration Name']).trim();
  const destination = asString(row.Destination).trim();
  return {
    id: name ? name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '',
    institution: name,
    city: destination,
    country: '',
    lat: null,
    lng: null,
    focusAreas: [],
    description: asString(row.Description).trim(),
    people: splitList(row['Peoples Involved']),
    websiteLink: '',
    imagePath: ''
  };
}

function normalizeProductRow(row) {
  return {
    id: asString(row.Id).trim(),
    label: asString(row.Label).trim(),
    iconKey: asString(row.IconKey).trim()
  };
}

function normalizeAiEvolutionCardRow(row) {
  return {
    id: asString(row.Id).trim(),
    title: asString(row.Title).trim(),
    description: asString(row.Description).trim(),
    accent: asString(row.Accent).trim(),
    iconKey: asString(row.IconKey).trim()
  };
}

function normalizeGatewayNodeRow(row) {
  return {
    id: asString(row.Id).trim(),
    title: asString(row.Title).trim(),
    subtitle: asString(row.Subtitle).trim(),
    tint: asString(row.Tint).trim(),
    iconKey: asString(row.IconKey).trim()
  };
}

function slugifyId(value) {
  return asString(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function venueKeyFor(lat, lng, city, country) {
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    // Stabilize float noise in Excel exports.
    return `${lat.toFixed(4)},${lng.toFixed(4)}`;
  }
  const fallback = [city, country].map((s) => asString(s).trim()).filter(Boolean).join('-');
  return slugifyId(fallback) || 'unknown-venue';
}

function buildPublicationsVenues(publicationRows) {
  // Output schema (publications.json):
  // [
  //   {
  //     id: <venueId>, city, country, lat, lng,
  //     conferences: [
  //       { conferenceId, year, conferenceName, date, papers: [...] }
  //     ]
  //   }
  // ]
  const venues = new Map();
  const conferenceInstances = new Map(); // key: conferenceId::year

  for (const row of publicationRows) {
    const conferenceId = asString(row['Conference ID']).trim();
    if (!conferenceId) continue;

    const city = asString(row.City).trim();
    const country = asString(row.Country).trim();

    const lat = parseCoordinate(row.Lat, 'lat');
    const lng = parseCoordinate(row.Lng, 'lng');
    if (lat == null || lng == null) continue;

    const paperYear = ensureNumberOrNull(row.Year);
    if (paperYear == null) continue;

    const vKey = venueKeyFor(lat, lng, city, country);
    const venue = venues.get(vKey) ?? {
      id: vKey,
      city,
      country,
      lat,
      lng,
      conferences: [],
      _conferenceKeys: new Set()
    };

    const conferenceKey = `${conferenceId}::${paperYear}`;
    const existing = conferenceInstances.get(conferenceKey);
    const conferenceName = asString(row['Conference Name']).trim();
    const date = asString(row.Date).trim();

    const instance = existing ?? {
      conferenceId,
      year: paperYear,
      conferenceName,
      date,
      papers: [],
      _venueKey: vKey
    };

    if (existing && existing._venueKey !== vKey) {
      // The schema definition is (conferenceId, year). If the source Excel rows disagree
      // on venue for the same (conferenceId, year), keep the first and warn.
      console.warn(
        `Publications: conflicting venue for ${conferenceKey}. Keeping ${existing._venueKey}, ignoring ${vKey}.`
      );
    }

    // Add instance to venue exactly once (only if it belongs to this venue).
    if (instance._venueKey === vKey && !venue._conferenceKeys.has(conferenceKey)) {
      venue._conferenceKeys.add(conferenceKey);
      venue.conferences.push(instance);
    }

    const paperId = asString(row['Paper ID']).trim();
    const title = asString(row['Paper Title']).trim();
    if (paperId && title) {
      instance.papers.push({
        id: paperId,
        title,
        topic: asString(row.Topic).trim(),
        authors: splitList(row.Authors),
        abstract: asString(row.Abstract).trim(),
        year: paperYear,
        doi: asString(row.DOI).trim() || undefined,
        keywords: splitList(row.Keywords)
      });
    }

    conferenceInstances.set(conferenceKey, instance);
    venues.set(vKey, venue);
  }

  // Strip internal fields, and sort for stable diffs.
  const out = Array.from(venues.values()).map((v) => {
    const conferences = (v.conferences ?? [])
      .map((c) => ({
        conferenceId: c.conferenceId,
        year: c.year,
        conferenceName: c.conferenceName,
        date: c.date,
        papers: (c.papers ?? []).slice()
      }))
      .sort((a, b) => (b.year - a.year) || a.conferenceId.localeCompare(b.conferenceId));

    for (const conf of conferences) {
      conf.papers.sort((a, b) => a.id.localeCompare(b.id));
    }

    return {
      id: v.id,
      city: v.city,
      country: v.country,
      lat: v.lat,
      lng: v.lng,
      conferences
    };
  });

  out.sort((a, b) => (a.country.localeCompare(b.country) || a.city.localeCompare(b.city) || a.id.localeCompare(b.id)));
  return out;
}

async function main() {
  const xlsxPath = process.argv[2] ? path.resolve(repoRoot, process.argv[2]) : DEFAULT_XLSX;

  const workbook = readWorkbook(xlsxPath);

  const pages = {
    landing: sheetKeyValue(rowsFromSheet(workbook, 'LandingPage')),
    mcProducts: sheetKeyValue(rowsFromSheet(workbook, 'MastercardAIProductsView')),
    topicLanding: sheetKeyValue(rowsFromSheet(workbook, 'TopicLanding')),
    topicSidebar: sheetKeyValue(rowsFromSheet(workbook, 'TopicSidebar')),
    eventsHackathons: sheetKeyValue(rowsFromSheet(workbook, 'AIGEventsHackathons')),
    aigGateway: sheetKeyValue(rowsFromSheet(workbook, 'AIGAIGateway')),
    app: sheetKeyValue(rowsFromSheet(workbook, 'App'))
  };

  const aiEvolutionCards = rowsFromSheet(workbook, 'AIEvolutionCards')
    .map(normalizeAiEvolutionCardRow)
    .filter((c) => c.id && c.title);

  const gatewayNodes = rowsFromSheet(workbook, 'AIGAIGatewayNodes')
    .map(normalizeGatewayNodeRow)
    .filter((n) => n.id && n.title);

  const products = rowsFromSheet(workbook, 'Products')
    .map(normalizeProductRow)
    .filter((p) => p.id && p.label);

  const events = rowsFromSheet(workbook, 'Events')
    .map(normalizeEventRow)
    .filter((e) => e.name);

  // Outreach (Events): show most recent first.
  events.sort((a, b) => {
    const ay = a.year ?? -Infinity;
    const by = b.year ?? -Infinity;
    if (by !== ay) return by - ay;
    return a.name.localeCompare(b.name);
  });

  const hackathons = rowsFromSheet(workbook, 'Hackathons')
    .map(normalizeEventRow)
    .filter((e) => e.name);

  const universityCollaborations = rowsFromSheet(workbook, 'UniversityCollaborations')
    .map(normalizeUniversityRow)
    .filter((c) => c.id && c.institution);

  const publicationsRows = rowsFromSheet(workbook, 'Publications');
  const publicationsVenues = buildPublicationsVenues(publicationsRows);

  await fs.rm(OUT_ROOT, { recursive: true, force: true });
  await fs.mkdir(OUT_ROOT, { recursive: true });

  await writeJson('pages.json', pages);
  await writeJson('ai-evolution-cards.json', aiEvolutionCards);
  await writeJson('aig-gateway-nodes.json', gatewayNodes);
  await writeJson('products.json', products);
  await writeJson('events.json', events);
  await writeJson('hackathons.json', hackathons);
  await writeJson('university-collaborations.json', universityCollaborations);
  await writeJson('publications.json', publicationsVenues);

  console.log(`Read ${path.relative(repoRoot, xlsxPath)}`);
  console.log(`Wrote JSON content under ${path.relative(repoRoot, OUT_ROOT)}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
