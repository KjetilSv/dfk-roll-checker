// [S%, R%, L%] for HP and MP; stat growth P% (primary) per class
const classData = {
  //                   hp           mp          STR  DEX  AGI  VIT  END  INT  WIS  LCK
  "Warrior":     { hp:[15,40,45], mp:[50,35,15], g:[75,  70,  50,  65,  65,  20,  20,  35] },
  "Knight":      { hp:[15,35,50], mp:[40,40,20], g:[70,  55,  45,  75,  75,  20,  25,  35] },
  "Thief":       { hp:[25,50,25], mp:[30,40,30], g:[55,  55,  70,  50,  45,  25,  35,  65] },
  "Archer":      { hp:[25,50,25], mp:[30,40,30], g:[55,  80,  50,  50,  60,  40,  25,  40] },
  "Priest":      { hp:[35,40,25], mp:[15,35,50], g:[30,  30,  40,  50,  60,  70,  80,  40] },
  "Wizard":      { hp:[35,40,25], mp:[15,35,50], g:[30,  30,  40,  50,  50,  80,  80,  40] },
  "Monk":        { hp:[25,35,40], mp:[30,40,30], g:[60,  60,  60,  60,  55,  25,  50,  30] },
  "Pirate":      { hp:[15,45,40], mp:[45,40,15], g:[70,  70,  50,  60,  55,  20,  20,  55] },
  "Berserker":   { hp:[15,45,40], mp:[45,40,15], g:[80,  60,  55,  65,  60,  20,  20,  40] },
  "Seer":        { hp:[35,40,25], mp:[15,35,50], g:[30,  30,  55,  50,  50,  70,  80,  35] },
  "Legionnaire": { hp:[15,35,50], mp:[50,35,15], g:[75,  65,  35,  75,  80,  20,  25,  25] },
  "Scholar":     { hp:[35,40,25], mp:[15,35,50], g:[30,  30,  30,  55,  55,  80,  70,  50] },
  "Paladin":     { hp:[10,40,50], mp:[25,40,35], g:[80,  40,  35,  80,  80,  30,  65,  40] },
  "Dark Knight": { hp:[20,55,25], mp:[20,40,40], g:[85,  55,  35,  75,  60,  70,  35,  35] },
  "Summoner":    { hp:[40,40,20], mp:[15,35,50], g:[45,  45,  50,  50,  50,  85,  85,  40] },
  "Ninja":       { hp:[25,50,25], mp:[25,50,25], g:[50,  75,  85,  50,  40,  50,  40,  60] },
  "Shapeshifter":{ hp:[25,35,40], mp:[30,40,30], g:[65,  70,  80,  65,  55,  25,  45,  45] },
  "Bard":        { hp:[35,40,25], mp:[20,40,40], g:[50,  70,  65,  50,  40,  50,  60,  65] },
  "Dragoon":     { hp:[15,35,50], mp:[35,45,20], g:[80,  65,  65,  60,  70,  50,  60,  50] },
  "Sage":        { hp:[40,35,25], mp:[10,30,60], g:[40,  40,  75,  60,  50,  90,  90,  55] },
  "SpellBow":    { hp:[35,35,30], mp:[15,30,55], g:[40,  90,  60,  60,  45,  85,  60,  60] },
  "Dread Knight":{ hp:[10,40,50], mp:[25,50,25], g:[85,  75,  60,  65,  75,  65,  65,  60] },
};
// Stat order index: 0=STR,1=DEX,2=AGI,3=VIT,4=END,5=INT,6=WIS,7=LCK
const STAT_NAMES = ['STR','DEX','AGI','VIT','END','INT','WIS','LCK'];

function hpFormula(vit) {
  return {
    small:   Math.floor(10 + vit / 2),
    regular: Math.floor(20 + vit),
    large:   Math.floor(30 + vit * 1.5),
  };
}
function mpFormulaObserved(si, wis) {
  const base = 0.6 * si + 0.4 * wis;
  // Observed (in-game): fixed part is NOT multiplied
  return {
    small:   Math.floor(2 + base * 0.075),
    regular: Math.floor(5 + base * 0.150),
    large:   Math.floor(9 + base * 0.225),
  };
}
function matchRoll(actual, formulas, tol = 0) {
  if (actual === null || isNaN(actual)) return null;
  let best = null, bestD = Infinity;
  for (const [t, v] of Object.entries(formulas)) {
    const d = Math.abs(actual - v);
    if (d <= tol && d < bestD) { best = t; bestD = d; }
  }
  return best;
}
function rollScore(m) { return m === 'large' ? 2 : m === 'regular' ? 1 : m === 'small' ? 0 : -1; }

function renderBars(containerId, probs, match, title) {
  const c = document.getElementById(containerId);
  const types = ['small','regular','large'];
  const cls = ['seg-small','seg-regular','seg-large'];

  const segs = types.map((t, i) => {
    const isMatch = t === match;
    const label = `${probs[i]}%${isMatch ? ' ◀' : ''}`;
    const w = Math.max(0, Math.min(100, probs[i] || 0));
    return `<div class="seg ${cls[i]}${isMatch ? ' seg-match' : ''}" style="width:${w}%">${label}</div>`;
  }).join('');

  c.innerHTML = `
    <div class="seg-wrap">
      <div class="seg-title">${title || ''}</div>
      <div class="seg-outer">${segs}</div>
    </div>
  `;
}

function setBadge(id, match) {
  const el = document.getElementById(id);
  const labels = { small:'Small 🔵', regular:'Regular 🟢', large:'Large 🟠' };
  const cls    = { small:'badge-small', regular:'badge-regular', large:'badge-large' };
  el.textContent = (match && labels[match]) ? labels[match] : '? no match';
  el.className   = 'badge ' + (cls[match] || 'badge-unknown');
}

function setSummary(hpMatch, mpMatch) {
  let emoji, title, desc, cls;
  if (hpMatch === 'large' && mpMatch === 'large') {
    emoji='🟣'; title='Great Roll!'; desc='Double Large (HP + MP).'; cls='great';
  } else if (hpMatch === 'regular' && mpMatch === 'regular') {
    emoji='🔵'; title='Solid Roll'; desc='Double Regular.'; cls='good';
  } else if (hpMatch === 'small' && mpMatch === 'small') {
    emoji='⚫'; title='Bad Luck'; desc='Double Small.'; cls='bad';
  } else if (hpMatch || mpMatch) {
    emoji='🎲'; title='Mixed Roll'; desc=''; cls='average';
  } else {
    emoji='❓'; title='Could not determine'; desc=''; cls='average';
  }
  document.getElementById('summary').className = 'summary ' + cls;
  document.getElementById('sum-emoji').textContent = emoji;
  document.getElementById('sum-title').textContent = title;
  document.getElementById('sum-desc').textContent  = desc;
}

const CLASS_MAP = {}; // game name → our dropdown value
Object.keys(classData).forEach(k => CLASS_MAP[k.toLowerCase().replace(/★/g,'').trim()] = k);

function resolveClass(raw) {
  if (!raw) return null;
  const key = raw.toLowerCase().trim();
  if (CLASS_MAP[key]) return CLASS_MAP[key];
  // partial match
  for (const [k, v] of Object.entries(CLASS_MAP)) {
    if (k.includes(key) || key.includes(k)) return v;
  }
  return null;
}

function renderStatsTable(cls, rawStats, gains) {
  const data = classData[cls] || classData['Warrior'];
  const g = data.g || [];
  let rows = '';
  STAT_NAMES.forEach((name, i) => {
    const pct   = g[i] || 0;
    const sPct  = (pct / 4).toFixed(1);
    const val   = rawStats[name] ?? '?';
    const gain  = gains[name];
    const total = gain ? gain.gain : 0;
    const gotPrm = gain && gain.parts.some(p => p.includes('[1]'));
    const gotScd = gain && gain.parts.some(p => p.includes('[2]'));
    const gotBon = gain && gain.parts.some(p => p.includes('[3]') || p.includes('[4]'));
    const lucky  = total > 0;
    const pctColor = pct >= 70 ? '#a78bfa' : pct >= 50 ? '#60a5fa' : '#6b7280';
    rows += `<tr class="${lucky ? 'stat-hit' : 'stat-miss'}">
      <td class="sname">${name}</td>
      <td class="sval">${val}</td>
      <td class="spct" style="color:${pctColor}">${pct}%</td>
      <td class="spct2">${sPct}%</td>
      <td class="sgot">${total > 0 ? `+${total}` : '—'}</td>
      <td class="sbits">${gotPrm ? '✓' : '·'}${gotScd ? '✓' : '·'}${gotBon ? 'B' : '·'}</td>
    </tr>`;
  });

  const el = document.getElementById('stats-table');
  el.style.display = 'block';
  el.innerHTML = `
    <div class="seg-title" style="margin-top:10px">Stat Growth — ${cls}</div>
    <table class="stbl">
      <thead><tr>
        <th>Stat</th><th>Val</th><th>P%</th><th>S%</th><th>Got</th><th>P/S/B</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="stbl-legend">P%=Primary chance · S%=Secondary chance · P/S/B = rolled prm/scd/bonus</div>
  `;
}

function calculateFromRead(read) {
  const cls = read.cls;
  const vit = read.vit || 0;
  const si  = read.int || 0;
  const wis = read.wis || 0;
  const hpOld = read.hpOld, hpNew = read.hpNew;
  const mpOld = read.mpOld, mpNew = read.mpNew;

  const hpGained = (Number.isFinite(hpOld) && Number.isFinite(hpNew)) ? (hpNew - hpOld) : null;
  const mpGained = (Number.isFinite(mpOld) && Number.isFinite(mpNew)) ? (mpNew - mpOld) : null;

  const data    = classData[cls] || classData['Warrior'];
  const hp      = hpFormula(vit);
  const mp      = mpFormulaObserved(si, wis);
  const hpMatch = matchRoll(hpGained, hp, 0);
  const mpMatch = matchRoll(mpGained, mp, 0);

  // Show expected values under badges
  document.getElementById('hp-vals').textContent = `S:${hp.small}  R:${hp.regular}  L:${hp.large}`;
  document.getElementById('mp-vals').textContent = `S:${mp.small}  R:${mp.regular}  L:${mp.large}`;

  renderBars('hp-bars', data.hp, hpMatch, 'HP chances');
  renderBars('mp-bars', data.mp, mpMatch, 'MP chances');
  setBadge('hp-badge', hpMatch);
  setBadge('mp-badge', mpMatch);
  setSummary(hpMatch, mpMatch);
  renderStatsTable(read.cls, read.rawStats, read.gains);
  document.getElementById('result').style.display = 'block';
}

function normalizeRead(response) {
  return {
    cls:   resolveClass(response.cls) || 'Warrior',
    hpOld: Number(response.hpOld), hpNew: Number(response.hpNew),
    mpOld: Number(response.mpOld), mpNew: Number(response.mpNew),
    vit:   Number(response.vit),   int:   Number(response.int),
    wis:   Number(response.wis),
    gains: response._gains || {},
    rawStats: (() => { try { return JSON.parse(response._raw || '{}'); } catch { return {}; } })(),
  };
}

// Read from Meditation Results page
document.getElementById('read-btn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  status.className = 'status';
  status.textContent = '⏳ Reading from Meditation Results…';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Inject extractor directly — works even without pre-injected content script
    const [{ result: response }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        function getHpMp(label) {
          const blocks = document.querySelectorAll('[class*="_attributeBlock_"]');
          for (const block of blocks) {
            const h5 = block.querySelector('h5');
            if (!h5 || h5.textContent.trim() !== label) continue;
            const p = block.querySelector('p');
            if (!p) continue;
            const textNode = [...p.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
            const oldVal = textNode ? +textNode.textContent.trim() : null;
            const newEl = p.querySelector('[class*="_statIncrease_"]');
            const newVal = newEl ? +newEl.textContent.trim() : null;
            return [oldVal, newVal];
          }
          return [null, null];
        }

        function getUpdatedStats() {
          const grid = document.querySelector('[class*="_statsGrid_"]');
          if (!grid) return { stats: {}, gains: {}, debug: 'no _statsGrid_ found' };
          const children = [...grid.children];

          // Count header cells to detect grid width (4 or 5 columns)
          const headerCount = children.filter(c =>
            c.className && c.className.includes('_statsHeader_')
          ).length;
          const cols = headerCount >= 5 ? 5 : 4;
          // Header names by index (0=stat, 1=Prm, 2=Scd, 3=Bonus, 4=Rarity)
          // Only sum Prm/Scd/Bonus (columns 1,2,3) for the HP/MP formula.
          // Include ALL gain columns (Prm, Scd, Bonus, Rarity) — all count in the formula
          const gainCols = Array.from({length: cols - 1}, (_, k) => k + 1);

          const result = {};
          const gains  = {};
          const order = ['STR','DEX','AGI','VIT','END','INT','WIS','LCK'];
          let i = cols; // skip header row

          for (const name of order) {
            if (i >= children.length) break;
            const valEl = children[i]?.querySelector('[class*="_currentStat_"]');
            const current = valEl ? (+valEl.textContent.trim() || 0) : 0;
            let gain = 0;
            const gainParts = [];
            for (const j of gainCols) {
              const txt = (children[i + j]?.textContent?.trim()) || '';
              const n = parseInt(txt);
              if (!isNaN(n) && n !== 0) { gain += n; gainParts.push(`${name}[${j}]:${txt}`); }
            }
            result[name] = current + gain;
            gains[name]  = { current, gain, parts: gainParts };
            i += cols;
          }
          return { stats: result, gains, debug: `cols=${cols}, headers=${headerCount}` };
        }

        const [hpOld, hpNew] = getHpMp('HP');
        const [mpOld, mpNew] = getHpMp('MP');
        const { stats, gains, debug: statsDebug } = getUpdatedStats();

        let cls = null;
        const classEl = document.querySelector('[class*="_class_zqy17_"]');
        if (classEl) {
          cls = [...classEl.childNodes]
            .filter(n => n.nodeType === 3)
            .map(n => n.textContent.trim()).filter(Boolean).join('').trim() || null;
        }

        return { hpOld, hpNew, mpOld, mpNew,
          vit: stats.VIT ?? null, int: stats.INT ?? null, wis: stats.WIS ?? null,
          cls,
          _raw: JSON.stringify(stats),
          _gains: gains,
          _debug: statsDebug };
      }
    });

    const read = normalizeRead(response);

    const filled = ['hpOld','hpNew','mpOld','mpNew','vit','int','wis']
      .filter(k => response[k] !== null && response[k] !== undefined).join(', ');
    status.className = 'status ok';
    status.textContent = '✅ Updated from Meditation Results';

    // Store debug info
    const debugLines = [
      `grid: ${response._debug || 'n/a'}`,
      `cls: ${response.cls} → ${read.cls}`,
      `VIT:${response.vit}  INT:${response.int}  WIS:${response.wis}`,
      `HP: ${response.hpOld}→${response.hpNew} (+${response.hpNew-response.hpOld})`,
      `MP: ${response.mpOld}→${response.mpNew} (+${response.mpNew-response.mpOld})`,
      `stats: ${response._raw}`,
    ];
    const debugBox = document.getElementById('debug-box');
    const debugBtn = document.getElementById('debug-btn');
    debugBox.textContent = debugLines.join('\n');
    debugBtn.style.display = 'block';
    debugBtn.onclick = () => {
      const visible = debugBox.style.display !== 'none';
      debugBox.style.display = visible ? 'none' : 'block';
      debugBtn.textContent = visible ? '🔍 Show debug info' : '🔍 Hide debug info';
    };

    // Auto-calculate immediately after reading
    calculateFromRead(read);

  } catch(e) {
    status.className = 'status err';
    status.textContent = '❌ ' + e.message + ' (try reloading the DFK tab)';
  }
});

// No manual calc button in simple mode
