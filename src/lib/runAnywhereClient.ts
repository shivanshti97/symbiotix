/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Symbiotix · RunAnywhere SDK Mock
 *
 * This module simulates the full local-AI pipeline:
 *   1. WebGPU device initialisation
 *   2. Vision WASM model load (MobileNet-style)
 *   3. LLM WASM model load (SmolLM2-style)
 *   4. Client-side image inference → structured JSON
 *   5. Local TTS synthesis
 *
 * ⚡ In production this would be replaced by the real RunAnywhere SDK calls.
 *     All console.log output mirrors what the real SDK emits during init.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { SpeciesScan, CareTask, ToxicityWarning } from '../db/db';

// ── Progress reporter type ───────────────────────────────────────────────────
export type LoadStage =
  | 'webgpu_check'
  | 'vision_download'
  | 'vision_compile'
  | 'llm_download'
  | 'llm_compile'
  | 'inference'
  | 'tts_load'
  | 'done';

export interface ProgressEvent {
  stage: LoadStage;
  label: string;
  progress: number; // 0–100
}

// ── Singleton model-loaded state ─────────────────────────────────────────────
let modelsLoaded = false;

// ── Rich offline species knowledge base ─────────────────────────────────────
const SPECIES_DB: Omit<SpeciesScan, 'id' | 'scannedAt' | 'imageDataUrl' | 'confidence'>[] = [
  {
    species: 'Monstera deliciosa',
    commonName: 'Swiss Cheese Plant',
    type: 'flora',
    care_tasks: [
      { id: 'w1', task: 'Water thoroughly', frequency: 'Every 7 days (1L)', completed: false },
      { id: 'l1', task: 'Provide bright indirect light', frequency: 'Daily', completed: false },
      { id: 'm1', task: 'Mist leaves', frequency: 'Every 2 days', completed: false },
      { id: 'f1', task: 'Fertilise with balanced NPK', frequency: 'Monthly (spring/summer)', completed: false },
      { id: 'p1', task: 'Repot when root-bound', frequency: 'Every 2 years', completed: false },
    ],
    fun_facts: [
      'The holes in its leaves (called fenestrations) help the plant withstand tropical storms.',
      'It can grow up to 70 cm per year in ideal conditions.',
      'Its fruit is the only edible member of the Araceae family (tastes like fruit salad).',
      'NASA\'s Clean Air Study found Monstera helps remove formaldehyde from indoor air.',
    ],
    toxicity_warnings: [
      { targetSpecies: 'Cat', severity: 'high', description: 'Insoluble calcium oxalates cause oral irritation, excessive drooling, and vomiting in cats.' },
      { targetSpecies: 'Dog', severity: 'high', description: 'Toxic to dogs — causes burning sensation, pawing at mouth, and gastrointestinal upset.' },
      { targetSpecies: 'Rabbit', severity: 'medium', description: 'Can cause digestive distress in rabbits. Keep out of reach.' },
    ],
    conservation_status: 'Least Concern',
    native_range: 'Southern Mexico & Central America',
    ecosystem_role: 'Epiphytic climber; supports humidity micro-climates for invertebrates.',
    health_notes: 'Plant appears healthy. Monitor soil moisture — yellowing leaves indicate overwatering.',
  },
  {
    species: 'Ailurus fulgens',
    commonName: 'Red Panda',
    type: 'fauna',
    care_tasks: [
      { id: 'f1', task: 'Provide fresh bamboo shoots', frequency: 'Twice daily', completed: false },
      { id: 'e1', task: 'Enrichment activities', frequency: 'Daily', completed: false },
      { id: 'v1', task: 'Veterinary health check', frequency: 'Quarterly', completed: false },
      { id: 'w1', task: 'Fresh water access', frequency: 'Constant', completed: false },
      { id: 'h1', task: 'Habitat temperature check (<24°C)', frequency: 'Daily', completed: false },
    ],
    fun_facts: [
      'Red pandas are the original "panda" — the giant panda was named after them.',
      'They have a false thumb (extended wrist bone) for gripping bamboo, independent of giant pandas.',
      'They are crepuscular — most active at dawn and dusk.',
      'Their thick fur covers even the soles of their feet to walk on snow.',
    ],
    toxicity_warnings: [
      { targetSpecies: 'Bamboo Specialist Diet', severity: 'low', description: 'Red pandas require very specific bamboo species; wrong varieties can cause nutritional deficiencies.' },
    ],
    conservation_status: 'Endangered (IUCN Red List)',
    native_range: 'Eastern Himalayas & Southwestern China',
    ecosystem_role: 'Seed dispersal agent; critical for bamboo forest regeneration cycle.',
    health_notes: 'Ensure cool habitat temperatures. Stress indicators include hair loss and reduced appetite.',
  },
  {
    species: 'Sequoia sempervirens',
    commonName: 'Coast Redwood',
    type: 'flora',
    care_tasks: [
      { id: 'w1', task: 'Deep watering at base', frequency: 'Every 14 days (5L)', completed: false },
      { id: 'mu1', task: 'Apply organic mulch ring', frequency: 'Seasonally', completed: false },
      { id: 'p1', task: 'Check for bark beetle signs', frequency: 'Monthly', completed: false },
      { id: 'l1', task: 'Ensure full sun exposure', frequency: 'Continuous', completed: false },
    ],
    fun_facts: [
      'The tallest living tree on Earth (Hyperion, 115.9 m) is a Coast Redwood.',
      'They can live for over 2,000 years and survive wildfires due to thick, tannin-rich bark.',
      'A single mature redwood can transpire 500 gallons of water per day — creating its own coastal fog.',
      'Their cones are surprisingly tiny — about the size of a chicken egg.',
    ],
    toxicity_warnings: [],
    conservation_status: 'Endangered (lost >96% of original range)',
    native_range: 'California & Southern Oregon Coastline',
    ecosystem_role: 'Keystone species; hosts >300 animal species per tree including marbled murrelets.',
    health_notes: 'Ideal coastal fog zones. Brown needles on lower branches are normal seasonal drop.',
  },
  {
    species: 'Ficus lyrata',
    commonName: 'Fiddle Leaf Fig',
    type: 'flora',
    care_tasks: [
      { id: 'w1', task: 'Water when top 2cm soil is dry', frequency: 'Every 7—10 days', completed: false },
      { id: 'l1', task: 'Bright indirect light, rotate weekly', frequency: 'Weekly rotation', completed: false },
      { id: 'du1', task: 'Wipe leaves with damp cloth', frequency: 'Monthly', completed: false },
      { id: 'f1', task: 'Liquid fertiliser (high-nitrogen)', frequency: 'Monthly (spring)', completed: false },
    ],
    fun_facts: [
      'Fiddle Leaf Figs are native to the tropical rainforests of West Africa.',
      'Their large leaves evolved to capture scattered light on the rainforest floor.',
      'They are highly sensitive to relocation — moving them even a few feet can cause leaf drop.',
      'A well cared-for indoor specimen can reach 3 metres in height.',
    ],
    toxicity_warnings: [
      { targetSpecies: 'Cat', severity: 'medium', description: 'The milky sap causes skin irritation and GI upset in cats. Not life-threatening but uncomfortable.' },
      { targetSpecies: 'Dog', severity: 'medium', description: 'Ficus sap is mildly toxic to dogs — can cause vomiting and dermatitis.' },
    ],
    conservation_status: 'Least Concern',
    native_range: 'West African Rainforests',
    ecosystem_role: 'Fig-wasp mutualism; strangler fig in native habitat reshapes undergrowth.',
    health_notes: 'Brown spots from overwatering (root rot) most common issue. Use well-draining soil.',
  },
  {
    species: 'Panthera tigris',
    commonName: 'Bengal Tiger',
    type: 'fauna',
    care_tasks: [
      { id: 'p1', task: 'Territory patrol & environmental monitoring', frequency: 'Continuous (rangers)', completed: false },
      { id: 'h1', task: 'GPS collar health check', frequency: 'Monthly', completed: false },
      { id: 'v1', task: 'Remote veterinary assessment', frequency: 'Quarterly', completed: false },
      { id: 'w1', task: 'Prey population survey', frequency: 'Bi-annual', completed: false },
    ],
    fun_facts: [
      'A tiger\'s roar can be heard from 3 km away — its vocal cords vibrate at very low frequencies.',
      'No two tigers have the same stripe pattern — it is as unique as a human fingerprint.',
      'Tigers are excellent swimmers and often cool off in pools and rivers.',
      'A tiger can consume up to 40 kg of meat in a single meal.',
    ],
    toxicity_warnings: [],
    conservation_status: 'Endangered (fewer than 2,500 mature individuals)',
    native_range: 'Indian Subcontinent, mainly Sundarbans & central India',
    ecosystem_role: 'Apex predator — regulates prey populations, preventing overgrazing of vegetation.',
    health_notes: 'Habitat fragmentation major threat. Corridor connectivity vital for genetic diversity.',
  },
];

// ── Utility: random delay simulating real async work ─────────────────────────
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Initialise WebGPU and load WASM models into browser memory.
 * Calls onProgress at each stage so the UI can reflect loading state.
 */
export async function initModels(
  onProgress: (e: ProgressEvent) => void
): Promise<void> {
  if (modelsLoaded) {
    onProgress({ stage: 'done', label: 'Models already loaded ✓', progress: 100 });
    return;
  }

  // Stage 1: WebGPU adapter check
  onProgress({ stage: 'webgpu_check', label: 'Checking WebGPU adapter…', progress: 5 });
  console.log('[RunAnywhere] Checking navigator.gpu...');
  await delay(600);
  console.log('[RunAnywhere] WebGPU adapter: AMD Radeon / Apple M-series (simulated)');
  console.log('[RunAnywhere] Initializing WebGPU device and command encoder...');
  onProgress({ stage: 'webgpu_check', label: 'WebGPU adapter confirmed ✓', progress: 12 });
  await delay(400);

  // Stage 2: Vision model download
  console.log('[RunAnywhere] Fetching Vision WASM binary (MobileNetV3-WASM, 14.2MB)...');
  onProgress({ stage: 'vision_download', label: 'Downloading Vision model (14.2 MB)…', progress: 18 });
  await delay(800);
  onProgress({ stage: 'vision_download', label: 'Downloading Vision model…', progress: 32 });
  await delay(600);
  onProgress({ stage: 'vision_download', label: 'Vision model downloaded ✓', progress: 42 });

  // Stage 3: Vision model compile (WebAssembly.compile)
  console.log('[RunAnywhere] Compiling Vision WASM module via WebAssembly.compile()...');
  onProgress({ stage: 'vision_compile', label: 'Compiling Vision WASM module…', progress: 48 });
  await delay(700);
  console.log('[RunAnywhere] Vision WASM module loaded. Tensor shape: [1, 224, 224, 3]');
  onProgress({ stage: 'vision_compile', label: 'Vision WASM compiled ✓', progress: 55 });

  // Stage 4: LLM model download
  console.log('[RunAnywhere] Fetching LLM WASM binary (SmolLM2-360M-Instruct-Q4, 220MB)...');
  onProgress({ stage: 'llm_download', label: 'Downloading SmolLM2 LLM (220 MB)…', progress: 58 });
  await delay(1000);
  onProgress({ stage: 'llm_download', label: 'Downloading SmolLM2 LLM…', progress: 70 });
  await delay(800);
  onProgress({ stage: 'llm_download', label: 'SmolLM2 downloaded ✓', progress: 80 });

  // Stage 5: LLM compile
  console.log('[RunAnywhere] Compiling LLM WASM module. Allocating 1.8GB VRAM (WebGPU buffer)...');
  onProgress({ stage: 'llm_compile', label: 'Compiling SmolLM2 WASM…', progress: 85 });
  await delay(900);
  console.log('[RunAnywhere] SmolLM2 WASM module loaded. KV-cache initialised. Context window: 2048 tokens.');
  onProgress({ stage: 'llm_compile', label: 'SmolLM2 WASM ready ✓', progress: 95 });
  await delay(300);

  modelsLoaded = true;
  console.log('[RunAnywhere] ✅ All local models initialised. NO data transmitted to cloud.');
  onProgress({ stage: 'done', label: 'All models loaded! Running inference…', progress: 100 });
}

/**
 * Run the full local AI pipeline on an image blob.
 * Vision → feature vector → LLM → structured JSON.
 */
export async function analyzeImageBlob(
  imageBlob: Blob,
  onProgress: (e: ProgressEvent) => void
): Promise<Omit<SpeciesScan, 'id' | 'scannedAt' | 'imageDataUrl'>> {
  console.log(`[RunAnywhere] analyzeImageBlob called. Blob size: ${(imageBlob.size / 1024).toFixed(1)} KB`);
  console.log('[RunAnywhere] Decoding image to tensor float32 [1,224,224,3]...');

  onProgress({ stage: 'inference', label: 'Vision model: analysing image…', progress: 30 });
  await delay(1200);

  console.log('[RunAnywhere] Vision forward pass complete. Top-3 logits extracted.');
  console.log('[RunAnywhere] Passing visual embedding to SmolLM2 context...');
  onProgress({ stage: 'inference', label: 'LLM generating species report…', progress: 65 });
  await delay(1500);

  console.log('[RunAnywhere] SmolLM2 token generation complete (312 tokens, 4.2 tok/s).');
  onProgress({ stage: 'inference', label: 'Parsing structured JSON output…', progress: 90 });
  await delay(400);

  // Deterministic selection based on blob size modulo for variety
  const idx = imageBlob.size % SPECIES_DB.length;
  const base = SPECIES_DB[idx];

  const confidence = 0.87 + Math.random() * 0.1;

  console.log(`[RunAnywhere] ✅ Identified: ${base.species} (confidence: ${(confidence * 100).toFixed(1)}%)`);

  return {
    ...base,
    confidence,
    care_tasks: base.care_tasks.map((t) => ({ ...t, completed: false })),
  };
}

/**
 * Local TTS — converts the species summary to speech using the Web Speech API
 * (which runs entirely in-browser, no cloud calls).
 * In production this would use the RunAnywhere TTS WASM model.
 */
export async function speakSummary(scan: SpeciesScan): Promise<void> {
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const text = [
    `Species identified: ${scan.commonName}, scientific name ${scan.species}.`,
    `Type: ${scan.type === 'flora' ? 'Plant' : 'Animal'}.`,
    `Conservation status: ${scan.conservation_status}.`,
    `Native to ${scan.native_range}.`,
    `Ecosystem role: ${scan.ecosystem_role}.`,
    scan.toxicity_warnings.length > 0
      ? `Warning: this ${scan.type} has ${scan.toxicity_warnings.length} toxicity interaction${scan.toxicity_warnings.length > 1 ? 's' : ''} with other scanned species.`
      : 'No toxicity warnings detected.',
    `Fun fact: ${scan.fun_facts[0]}`,
  ].join(' ');

  return new Promise((resolve) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.92;
    utter.pitch = 1.0;
    utter.volume = 1;
    utter.lang = 'en-US';
    utter.onend = () => resolve();
    utter.onerror = () => resolve();
    window.speechSynthesis.speak(utter);
    console.log('[RunAnywhere] TTS: Web Speech API synthesis started (client-side only).');
  });
}

/** Whether models have been loaded already this session */
export function areModelsLoaded(): boolean {
  return modelsLoaded;
}
