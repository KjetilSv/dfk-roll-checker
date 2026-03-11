// content.js — DeFi Kingdoms level-up stats reader
// Targets: game.defikingdoms.com

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action !== 'readStats') return;
  try {
    sendResponse(extractStats());
  } catch(e) {
    sendResponse({ error: e.message, _raw: document.body.innerText.slice(0, 500) });
  }
  return true; // keep async channel open
});

function extractStats() {
  // ── HP / MP ──────────────────────────────────────────────────────
  // DOM: <div class="_attributeBlock_...">
  //        <h5>HP</h5>
  //        <p>369 <span arrow> <span class="_statIncrease_...">388</span></p>
  //      </div>
  function getHpMp(label) {
    const blocks = document.querySelectorAll('[class*="_attributeBlock_"]');
    for (const block of blocks) {
      const h5 = block.querySelector('h5');
      if (!h5 || h5.textContent.trim() !== label) continue;

      const p = block.querySelector('p');
      if (!p) continue;

      // Old value = first bare text node in <p>
      const textNode = [...p.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
      const oldVal = textNode ? +textNode.textContent.trim() : null;

      // New value = _statIncrease_ span
      const newEl = p.querySelector('[class*="_statIncrease_"]');
      const newVal = newEl ? +newEl.textContent.trim() : null;

      return [oldVal, newVal];
    }
    return [null, null];
  }

  const [hpOld, hpNew] = getHpMp('HP');
  const [mpOld, mpNew] = getHpMp('MP');

  // ── UPDATED STATS grid ───────────────────────────────────────────
  // DOM: <div class="_statsGrid_...">
  //        [4 headers: Stats, Prm., Scd., Bonus]
  //        [per stat: <div _stat_><p>VIT</p><span _currentStat_>17</span></div>, +Prm, +Scd, +Bonus]
  //      </div>
  function getUpdatedStats() {
    const grid = document.querySelector('[class*="_statsGrid_"]');
    if (!grid) return {};

    const children = [...grid.children];
    const result   = {};
    const order    = ['STR', 'DEX', 'AGI', 'VIT', 'END', 'INT', 'WIS', 'LCK'];
    let i = 4; // skip 4 header cells

    for (const name of order) {
      if (i >= children.length) break;

      // Current stat (before level-up)
      const statEl  = children[i];
      const valEl   = statEl?.querySelector('[class*="_currentStat_"]');
      const current = valEl ? +valEl.textContent.trim() : 0;

      // 3 gain columns (Prm, Scd, Bonus) → sum
      let gain = 0;
      for (let j = 1; j <= 3; j++) {
        const gainText = children[i + j]?.textContent?.trim() || '';
        const gainNum  = parseInt(gainText);
        if (!isNaN(gainNum)) gain += gainNum;
      }

      result[name] = current + gain; // stat AFTER level-up
      i += 4;
    }

    return result;
  }

  const stats = getUpdatedStats();

  // ── CLASS ────────────────────────────────────────────────────────
  // DOM: <div class="_class_zqy17_...">monk<span class="_subClass_...">shapeshifter</span></div>
  let cls = null;
  const classEl = document.querySelector('[class*="_class_zqy17_"]');
  if (classEl) {
    // Get only the direct text (not subclass span)
    const ownText = [...classEl.childNodes]
      .filter(n => n.nodeType === 3)
      .map(n => n.textContent.trim())
      .filter(Boolean)
      .join('');
    if (ownText) cls = ownText.trim();
  }

  return {
    hpOld, hpNew,
    mpOld, mpNew,
    vit:  stats.VIT  ?? null,
    int:  stats.INT  ?? null,
    wis:  stats.WIS  ?? null,
    cls,
    _stats: stats,
    _raw: JSON.stringify({ hpOld, hpNew, mpOld, mpNew, stats, cls }),
  };
}
