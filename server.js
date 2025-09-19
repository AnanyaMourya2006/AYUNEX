// backend/server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const DATA_DIR = path.join(__dirname, 'data');
function load(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf8'));
}

// Load datasets (simple, demo)
const NAMASTE = load('namaste.json'); // array of concepts
const WHO_AYU = load('who_ayurveda.json');
const ICD11 = load('icd11_tm2.json');
const CONCEPTMAP = load('conceptmap_namaste_tm2.json');

// Simple token middleware (demo)
// If Authorization header present, accepts any Bearer token (demo). In prod validate tokens.
app.use((req, res, next) => {
  const auth = req.header('authorization');
  if (!auth) return next();
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Invalid auth header (expected Bearer)' });
  // Accept for demo
  req.token = auth.slice(7);
  return next();
});

// Health
app.get('/', (req, res) => res.send('NAMASTE Terminology backend (demo)'));

// 1) CodeSystems: GET /fhir/CodeSystem/:id
app.get('/fhir/CodeSystem/:id', (req, res) => {
  const id = (req.params.id || '').toUpperCase();
  if (id.includes('NAMASTE') || id.includes('NAMASTE-HERBS') || id.includes('NAMASTE-HERB')) {
    return res.json({ resourceType: 'CodeSystem', id: 'NAMASTE', status: 'active', content: 'complete', concept: NAMASTE });
  }
  if (id.includes('WHO') || id.includes('AYURVEDA')) {
    return res.json({ resourceType: 'CodeSystem', id: 'WHO-AYURVEDA', status: 'active', content: 'complete', concept: WHO_AYU });
  }
  if (id.includes('ICD11') || id.includes('TM2')) {
    return res.json({ resourceType: 'CodeSystem', id: 'ICD11-TM2', status: 'active', content: 'complete', concept: ICD11 });
  }
  return res.status(404).json({ error: 'CodeSystem not found (demo)' });
});

// 2) ValueSet $lookup: GET /fhir/ValueSet/$lookup?filter=...
// Returns a short list of matches from all code pools
app.get('/fhir/ValueSet/$lookup', (req, res) => {
  const q = (req.query.filter || '').toLowerCase();
  const pool = [...NAMASTE, ...WHO_AYU, ...ICD11];
  const matched = pool
    .filter(c => {
      return (
        (c.display && c.display.toLowerCase().includes(q)) ||
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.definition && c.definition.toLowerCase().includes(q))
      );
    })
    .slice(0, parseInt(req.query._count || '25', 10))
    .map(c => ({ code: c.code, display: c.display, system: c.system }));
  res.json(matched);
});

// 3) Concept detail: GET /fhir/Concept/:system/:code
app.get('/fhir/Concept/:system/:code', (req, res) => {
  const system = (req.params.system || '').toUpperCase();
  const code = req.params.code;
  const pool = system.includes('NAMASTE') ? NAMASTE : system.includes('WHO') ? WHO_AYU : system.includes('ICD11') ? ICD11 : null;
  if (!pool) return res.status(404).json({ error: 'Unknown system' });
  const found = pool.find(c => c.code === code);
  if (!found) return res.status(404).json({ error: 'Concept not found' });
  res.json(found);
});

// 4) ConceptMap translate: POST /fhir/ConceptMap/$translate
// Body: { code: "NAM-001", from: "NAMASTE", to: "TM2" }
app.post('/fhir/ConceptMap/$translate', (req, res) => {
  const { code, from, to } = req.body || {};
  if (!code || !from || !to) return res.status(400).json({ error: 'Missing code/from/to in request body' });

  const matches = CONCEPTMAP.filter(m => m.source === code);
  const parameters = matches.map(m => ({
    name: 'match',
    part: [
      { name: 'equivalence', valueString: m.equivalence },
      { name: 'concept', valueString: JSON.stringify({ code: m.target, display: m.targetDisplay, system: to }) }
    ]
  }));
  res.json({ resourceType: 'Parameters', parameter: parameters });
});

// 5) ICD-11 biomed lookup: GET /fhir/icd11/lookup?code=...
app.get('/fhir/icd11/lookup', (req, res) => {
  const q = (req.query.code || '').toLowerCase();
  const found = ICD11.filter(c => (c.code && c.code.toLowerCase().includes(q)) || (c.display && c.display.toLowerCase().includes(q)));
  res.json(found.slice(0, 20));
});

// 6) POST /fhir/Bundle - accept FHIR Bundle for double-coding
app.post('/fhir/Bundle', (req, res) => {
  const bundle = req.body;
  if (!bundle || bundle.resourceType !== 'Bundle') return res.status(400).json({ error: 'Expected FHIR Bundle JSON (resourceType: Bundle)' });

  // Demo: attach mapping extension for Condition entries that have NAMASTE codings
  const processed = [];
  if (Array.isArray(bundle.entry)) {
    bundle.entry.forEach(en => {
      const resource = en.resource || {};
      if (resource.resourceType === 'Condition' && resource.code && Array.isArray(resource.code.coding)) {
        resource.code.coding = resource.code.coding.map(coding => {
          const mapping = CONCEPTMAP.find(m => m.source === coding.code);
          if (mapping) {
            return {
              ...coding,
              extension: [
                {
                  url: 'http://example.org/fhir/StructureDefinition/double-coding-mapping',
                  valueString: JSON.stringify({ mappedTo: mapping.target, equivalence: mapping.equivalence })
                }
              ]
            };
          }
          return coding;
        });
        processed.push(resource.id || resource);
      }
    });
  }

  return res.json({
    message: 'Bundle received (demo). Double-coding applied to Condition entries where mappings exist.',
    processedCount: processed.length,
    processedPreview: processed.slice(0, 5)
  });
});

// Serve a small descriptor for Render / health checks
app.get('/health', (req, res) => res.json({ service: 'NAMASTE-terminology-demo', status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`NAMASTE terminology backend (demo) listening on port ${PORT}`));
