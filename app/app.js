// Leonida Trophy Guide — tracker and guide for the 55 GTA VI trophies on PS5.
// Static and offline: the only thing this script fetches is its own
// data/trophies.json, and progress lives in the browser's localStorage.

const DATA_URL = 'data/trophies.json';
const EARNED_KEY = 'gta6-trophy-guide-earned-v1';
const SPOILER_KEY = 'gta6-trophy-guide-spoilers-v1';

// A sample progress set, used only when the page is opened with #demo and the
// browser holds no progress yet. It seeds the tracker so a screenshot shows
// the checklist with progress, exactly as if the reader had ticked them.
const DEMO_EARNED = [2, 3, 8, 15, 16, 20, 21, 28, 33, 35, 36, 41, 44, 46];

const KINDS = [
  ['all', 'All kinds'],
  ['story', 'Story'],
  ['missable', 'Missable'],
  ['collectibles', 'Collectibles'],
  ['activities', 'Activities'],
  ['crime', 'Crime'],
  ['completion', 'Completion'],
  ['platinum', 'Platinum'],
];

const KIND_LABELS = Object.fromEntries(KINDS);
const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
const GRADE_LABELS = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };

const STAGES = [
  {
    n: 1,
    title: 'Play the story',
    time: '60–80 hours',
    blurb: 'Five chapters and the side-character strands. The chapter and mission trophies pop as you go. Scan vehicles and study animals as you travel — that progress already counts toward 100%. Meditate at Jason\u2019s house the first time the game offers it.',
  },
  {
    n: 2,
    title: '100% completion checklist',
    time: 'About 100 hours',
    blurb: 'After the credits the checklist opens under Progress, then Stats, then 100% Completion. The thresholds are lenient — closer to 60% true completion. Stunts, shooting-range golds, races, collectibles and challenges, with the lenient counts in each trophy\u2019s guide.',
  },
  {
    n: 3,
    title: 'Strangers & Freaks and cleanup',
    time: 'About 10 hours',
    blurb: 'Finish the 8 stranger strands, the character quests and whatever is left on the list. Strangers & Freaks is not part of 100%, so it waits until now. The platinum pops when the last trophy does.',
  },
];

const listEl = document.getElementById('list');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('grade');
const sortEl = document.getElementById('sort');
const onlyMissableEl = document.getElementById('only-missable');
const onlyMissingEl = document.getElementById('only-missing');
const spoilersEl = document.getElementById('spoilers');
const resultCountEl = document.getElementById('result-count');

let trophies = [];
let sources = [];
let earned = new Set();
let kindFilter = 'all';
let openId = null;
let spoilersOn = false;

function loadStored() {
  try {
    const raw = localStorage.getItem(EARNED_KEY);
    if (raw) earned = new Set(JSON.parse(raw).filter((id) => Number.isInteger(id)));
  } catch {
    earned = new Set();
  }
  try {
    spoilersOn = localStorage.getItem(SPOILER_KEY) === '1';
  } catch {
    spoilersOn = false;
  }
}

function saveEarned() {
  try {
    localStorage.setItem(EARNED_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
  } catch {
    // Storage full or unavailable: the checklist still works in memory.
  }
}

function saveSpoilers() {
  try {
    localStorage.setItem(SPOILER_KEY, spoilersOn ? '1' : '0');
  } catch {
    // Ignore: the setting still applies for this visit.
  }
}

function readHash() {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const filter = hash.get('filter');
  if (filter && KIND_LABELS[filter]) kindFilter = filter;
  const open = hash.get('t');
  if (open) {
    const id = Number(open);
    if (Number.isInteger(id)) openId = id;
  }
  if (hash.has('demo') && earned.size === 0) {
    // Seed sample progress only when the reader has none yet, so a shared
    // #demo link never wipes anyone's real checklist.
    for (const id of DEMO_EARNED) earned.add(id);
    saveEarned();
  }
  return hash;
}

function stageOf(trophy) {
  return STAGES.find((s) => s.n === trophy.roadmap_stage) ?? STAGES[0];
}

function isMasked(trophy) {
  // With spoilers on, a hidden trophy keeps its name and description secret
  // until the reader earns it.
  return spoilersOn && trophy.hidden && !earned.has(trophy.id);
}

function gradeChip(grade, count, total) {
  return `<span class="chip chip-${grade}">${GRADE_LABELS[grade]} ${count}/${total}</span>`;
}

function renderProgress() {
  const total = trophies.length;
  const done = trophies.filter((t) => earned.has(t.id)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('progress-text').textContent = `${done} of ${total} earned`;
  document.getElementById('progress-pct').textContent = `${pct}%`;
  document.getElementById('progress-fill').style.width = `${pct}%`;
  const chips = Object.keys(GRADE_LABELS).map((grade) => {
    const inGrade = trophies.filter((t) => t.grade === grade);
    const doneInGrade = inGrade.filter((t) => earned.has(t.id)).length;
    return gradeChip(grade, doneInGrade, inGrade.length);
  });
  document.getElementById('grade-chips').innerHTML = chips.join('');
}

function renderRoadmap() {
  const grid = document.getElementById('stage-grid');
  grid.replaceChildren();
  for (const stage of STAGES) {
    const inStage = trophies.filter((t) => t.roadmap_stage === stage.n);
    const doneInStage = inStage.filter((t) => earned.has(t.id)).length;
    const card = document.createElement('article');
    card.className = 'stage-card';
    const heading = document.createElement('h3');
    heading.textContent = `Stage ${stage.n} — ${stage.title}`;
    const meta = document.createElement('p');
    meta.className = 'stage-meta';
    meta.textContent = `${stage.time} · ${doneInStage} of ${inStage.length} trophies`;
    const blurb = document.createElement('p');
    blurb.textContent = stage.blurb;
    const names = document.createElement('p');
    names.className = 'stage-names';
    names.textContent = inStage.map((t) => t.name).join(' · ');
    card.append(heading, meta, blurb, names);
    grid.append(card);
  }
}

function trophyMatches(trophy) {
  if (kindFilter === 'missable') {
    if (!trophy.missable) return false;
  } else if (kindFilter !== 'all' && trophy.kind !== kindFilter) {
    return false;
  }
  if (gradeEl.value !== 'all' && trophy.grade !== gradeEl.value) return false;
  if (onlyMissableEl.checked && !trophy.missable) return false;
  if (onlyMissingEl.checked && earned.has(trophy.id)) return false;
  const query = searchEl.value.trim().toLowerCase();
  if (query) {
    const haystack = [trophy.name, trophy.description, trophy.guide, trophy.kind]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  return true;
}

function sortedTrophies(list) {
  const copy = [...list];
  if (sortEl.value === 'name') {
    copy.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortEl.value === 'grade') {
    copy.sort(
      (a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.name.localeCompare(b.name),
    );
  } else {
    copy.sort((a, b) => a.roadmap_stage - b.roadmap_stage || a.id - b.id);
  }
  return copy;
}

function badge(text, className) {
  const span = document.createElement('span');
  span.className = `badge ${className}`;
  span.textContent = text;
  return span;
}

function buildCard(trophy) {
  const article = document.createElement('article');
  article.className = 'trophy-card';
  article.dataset.trophyId = String(trophy.id);
  if (earned.has(trophy.id)) article.classList.add('earned');
  if (trophy.missable) article.classList.add('missable');

  const masked = isMasked(trophy);

  const head = document.createElement('div');
  head.className = 'card-head';

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.className = 'earn-box';
  box.checked = earned.has(trophy.id);
  box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(trophy.id);
    else earned.delete(trophy.id);
    saveEarned();
    renderAll();
  });

  const titleWrap = document.createElement('div');
  titleWrap.className = 'card-titles';
  const title = document.createElement('h3');
  title.textContent = masked ? 'Hidden trophy' : trophy.name;
  const desc = document.createElement('p');
  desc.className = 'card-desc';
  desc.textContent = masked
    ? 'Earn it to reveal its name and description.'
    : trophy.description;
  titleWrap.append(title, desc);

  const badges = document.createElement('div');
  badges.className = 'card-badges';
  badges.append(badge(GRADE_LABELS[trophy.grade], `grade-${trophy.grade}`));
  badges.append(badge(KIND_LABELS[trophy.kind] ?? trophy.kind, 'kind'));
  badges.append(badge(`Stage ${trophy.roadmap_stage}`, 'stage'));
  if (trophy.missable) badges.append(badge('Missable', 'missable-badge'));
  if (trophy.hidden) badges.append(badge('Hidden', 'hidden-badge'));

  head.append(box, titleWrap, badges);
  article.append(head);

  if (!masked) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'guide-toggle';
    const isOpen = openId === trophy.id;
    toggle.textContent = isOpen ? 'Hide guide ▲' : 'Show guide ▼';
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.addEventListener('click', () => {
      openId = openId === trophy.id ? null : trophy.id;
      renderList();
    });
    article.append(toggle);

    if (isOpen) {
      const guide = document.createElement('div');
      guide.className = 'guide-body';
      const guideText = document.createElement('p');
      guideText.textContent = trophy.guide;
      guide.append(guideText);
      if (Array.isArray(trophy.steps) && trophy.steps.length > 0) {
        const steps = document.createElement('ol');
        steps.className = 'guide-steps';
        for (const step of trophy.steps) {
          const li = document.createElement('li');
          li.textContent = step;
          steps.append(li);
        }
        guide.append(steps);
      }
      const sourceLine = document.createElement('p');
      sourceLine.className = 'source-line';
      sourceLine.textContent = 'Source: ';
      const link = document.createElement('a');
      link.href = trophy.source.url;
      link.textContent = trophy.source.name;
      link.rel = 'noopener';
      sourceLine.append(link);
      guide.append(sourceLine);
      article.append(guide);
    }
  } else {
    const note = document.createElement('p');
    note.className = 'masked-note';
    note.textContent = 'Spoilers are hidden. Earn this trophy to reveal its guide, or turn spoilers off above.';
    article.append(note);
  }

  return article;
}

function renderList() {
  const visible = sortedTrophies(trophies.filter(trophyMatches));
  listEl.replaceChildren();
  for (const trophy of visible) listEl.append(buildCard(trophy));
  const shown = visible.length;
  const total = trophies.length;
  resultCountEl.textContent =
    shown === total
      ? `Showing all ${total} trophies.`
      : `Showing ${shown} of ${total} trophies.`;
}

function renderSources() {
  const ul = document.getElementById('source-list');
  ul.replaceChildren();
  for (const source of sources) {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = source.url;
    link.textContent = source.name;
    link.rel = 'noopener';
    li.append(link);
    ul.append(li);
  }
}

function renderKindButtons() {
  const wrap = document.getElementById('kind-buttons');
  wrap.replaceChildren();
  for (const [kind, label] of KINDS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'kind-button';
    button.textContent = label;
    button.setAttribute('aria-pressed', String(kindFilter === kind));
    if (kindFilter === kind) button.classList.add('active');
    button.addEventListener('click', () => {
      kindFilter = kind;
      renderKindButtons();
      renderList();
    });
    wrap.append(button);
  }
}

function renderAll() {
  renderProgress();
  renderRoadmap();
  renderKindButtons();
  renderList();
}

function downloadFile(name, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportProgress() {
  const payload = {
    game: 'Grand Theft Auto VI',
    platform: 'PlayStation 5',
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort((a, b) => a - b),
  };
  downloadFile('gta6-trophy-progress.json', JSON.stringify(payload, null, 2));
}

async function importProgress(file) {
  if (!file) return;
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    window.alert('That file is not valid JSON.');
    return;
  }
  const ids = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(ids)) {
    window.alert('That file does not hold a list of earned trophies.');
    return;
  }
  const known = new Set(trophies.map((t) => t.id));
  const next = new Set();
  for (const id of ids) {
    if (Number.isInteger(id) && known.has(id)) next.add(id);
  }
  earned = next;
  saveEarned();
  renderAll();
  window.alert(`Imported ${earned.size} earned trophies.`);
}

function bindControls() {
  searchEl.addEventListener('input', renderList);
  gradeEl.addEventListener('change', renderList);
  sortEl.addEventListener('change', renderList);
  onlyMissableEl.addEventListener('change', renderList);
  onlyMissingEl.addEventListener('change', renderList);
  spoilersEl.addEventListener('change', () => {
    spoilersOn = spoilersEl.checked;
    saveSpoilers();
    renderList();
  });
  document.getElementById('export').addEventListener('click', exportProgress);
  document.getElementById('import').addEventListener('change', (event) => {
    importProgress(event.target.files[0]);
    event.target.value = '';
  });
  document.getElementById('reset').addEventListener('click', () => {
    if (window.confirm('Clear every earned trophy? This cannot be undone.')) {
      earned = new Set();
      saveEarned();
      renderAll();
    }
  });
}

async function init() {
  loadStored();
  spoilersEl.checked = spoilersOn;
  bindControls();
  const hash = readHash();
  let data;
  try {
    const response = await fetch(DATA_URL);
    data = await response.json();
  } catch {
    listEl.innerHTML = '<p class="load-error">Could not load data/trophies.json. Serve app/ with a static server (node serve.ts) and reload.</p>';
    return;
  }
  trophies = data.trophies ?? [];
  sources = data.sources ?? [];
  renderAll();
  renderSources();
  if (hash.get('roadmap') !== null || hash.get('view') === 'roadmap') {
    document.getElementById('roadmap').scrollIntoView();
  } else if (hash.get('filter') !== null) {
    listEl.scrollIntoView();
  } else if (openId !== null) {
    const card = listEl.querySelector(`[data-trophy-id="${openId}"]`);
    if (card) card.scrollIntoView({ block: 'center' });
  }
}

init();
