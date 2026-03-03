/* ═══════════════════════════════════════
   game.js — Core game state, loop, init
   ═══════════════════════════════════════ */

// ↓↓↓ ÄNDRA HÄR — uppdateras överallt automatiskt ↓↓↓
var CA = 'J2Dg8qgbfsPMdQM1CZFkMTz9Gmi4VZGdfwWassaxpump';
// ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑

var GAME = {
  coins:       0,
  totalCoins:  0,
  clickPower:  100,  // start BIG — first clicks feel insane
  autoPerSec:  0,
  pumpMeter:   0,    // 0 – 100 %
  price:       0.00000069,
  moons:       0,
  upgrades:    {},
  updateDisplay: function() {} // filled in after init
};

var autoTick  = 0;
var copyTimer = null;
var keyBuffer = '';
var moonActive = false;

// ── Display ──────────────────────────────
function updateDisplay() {
  document.getElementById('stat-coins').textContent = formatNum(GAME.coins);
  document.getElementById('stat-click').textContent = formatNum(GAME.clickPower);
  document.getElementById('stat-moons').textContent = GAME.moons;
  document.getElementById('stat-auto').textContent  = formatNum(GAME.autoPerSec);

  // Pump bar
  var pct = Math.min(100, Math.max(0, GAME.pumpMeter));
  document.getElementById('pump-bar').style.width   = pct + '%';
  document.getElementById('pump-pct').textContent   = Math.floor(pct) + '%';

  var statusEl = document.getElementById('pump-status');
  var barBg    = document.querySelector('.pump-bar-bg');
  var vignette = document.getElementById('danger-vignette');
  if (pct >= 80) {
    statusEl.textContent = 'ALMOST MOON! 🌕';
    statusEl.classList.add('glow');
    barBg.classList.add('near-moon');
    vignette.classList.add('show');
  } else {
    if (pct >= 50) {
      statusEl.textContent = 'KEEP GOING! 🔥';
    } else {
      statusEl.textContent = 'PUMP IT! 💊';
    }
    statusEl.classList.remove('glow');
    barBg.classList.remove('near-moon');
    vignette.classList.remove('show');
  }

  // Price
  var priceStr = formatPrice(GAME.price);
  document.getElementById('hdr-price').textContent  = priceStr;
  document.getElementById('price-label').textContent = priceStr;

  // Market cap (price * 420B supply)
  var mcap = GAME.price * 420e9;
  document.getElementById('hdr-mcap').textContent = formatNum(mcap);

  renderUpgrades(GAME);
}

function formatPrice(p) {
  if (p < 0.0001) return p.toFixed(8);
  if (p < 1)      return p.toFixed(6);
  return p.toFixed(4);
}

// ── Dog Click ────────────────────────────
function onDogClick(mx, my) {
  if (moonActive) return;

  var earned = GAME.clickPower;
  GAME.coins      += earned;
  GAME.totalCoins += earned;
  GAME.pumpMeter  += 10; // 10% per click → first moon in ~10 clicks

  // Price nudge per click
  GAME.price *= (1 + 0.000005 * earned);

  // Spawn 3 float texts slightly offset — feels chaotic and satisfying
  spawnFloatCoin(mx,          my,          earned);
  spawnFloatCoin(mx - 30,     my - 20,     Math.floor(earned * 0.5));
  spawnFloatCoin(mx + 25,     my - 35,     Math.floor(earned * 0.3));

  if (GAME.pumpMeter >= 100) {
    triggerMoon();
  } else {
    updateDisplay();
    updateChart(GAME.price);
  }
}

// ── Moon Event ───────────────────────────
function triggerMoon() {
  if (moonActive) return;
  moonActive = true;

  GAME.pumpMeter = 0;
  GAME.moons++;

  var mult = 1.5 + Math.random() * 1.5; // 1.5× – 3×
  GAME.price *= mult;

  // Moon bonus coins — escalates each moon so you can always buy the next upgrade
  var moonBonus = 5000 * GAME.moons;
  GAME.coins      += moonBonus;
  GAME.totalCoins += moonBonus;

  addPriceSpike(mult);
  updateChart(GAME.price);

  // Fill overlay
  document.getElementById('moon-count').textContent        = GAME.moons;
  document.getElementById('moon-price-display').textContent = formatPrice(GAME.price);
  document.getElementById('moon-overlay').classList.remove('hidden');

  launchConfetti(500);
  screenShake();
  showToast('🌕 MOON #' + GAME.moons + '! x' + mult.toFixed(1) + ' + ' + formatNum(moonBonus) + ' BONUS!', 3500);
  addToNewsFeed('🚀 MOON EVENT #' + GAME.moons + '! Price x' + mult.toFixed(1) + ' — +' + formatNum(moonBonus) + ' bonus coins!');

  updateDisplay();
}

function closeMoonOverlay() {
  document.getElementById('moon-overlay').classList.add('hidden');
  moonActive = false;
  updateDisplay();
}

// ── Copy CA ──────────────────────────────
function copyCA() {
  var btnHead   = document.getElementById('copy-btn');
  var btnCenter = document.getElementById('ca-center-btn');
  var go = function() {
    if (btnHead)   { btnHead.textContent = '✅ COPIED!';               btnHead.classList.add('success'); }
    if (btnCenter) { btnCenter.textContent = '✅ CA COPIED — LFG!! 🚀'; btnCenter.classList.add('success'); }
    launchConfetti(400);
    screenShake();
    showToast('🦍 APE IN! CA COPIED! 🚀🚀🚀', 3000);
    clearTimeout(copyTimer);
    copyTimer = setTimeout(function() {
      if (btnHead)   { btnHead.textContent = '📋 COPY';               btnHead.classList.remove('success'); }
      if (btnCenter) { btnCenter.textContent = '🦍 APE IN — COPY CA'; btnCenter.classList.remove('success'); }
    }, 2800);
  };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(CA).then(go).catch(function() { fallbackCopy(go); });
  } else {
    fallbackCopy(go);
  }
}
function fallbackCopy(cb) {
  var ta = document.createElement('textarea');
  ta.value = CA;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  ta.remove();
  cb();
}

// ── WAGMI Easter Egg ─────────────────────
document.addEventListener('keydown', function(e) {
  keyBuffer += e.key.toUpperCase();
  if (keyBuffer.includes('WAGMI')) {
    keyBuffer = '';
    GAME.coins      += 9999;
    GAME.totalCoins += 9999;
    GAME.pumpMeter  += 20;
    launchConfetti(600);
    screenShake();
    showToast('🎉 WAGMI! +9999 $PIP! LFG!! 🎉', 3500);
    addToNewsFeed('🎉 WAGMI easter egg triggered! +9999 $PIP!');
    updateDisplay();
    updateChart(GAME.price);
  }
  if (keyBuffer.length > 15) keyBuffer = keyBuffer.slice(-15);
});

// ── Game Loop (50ms = ~20 tps) ───────────
function gameLoop() {
  if (!moonActive) {
    // Base "community energy" — meter visibly creeps even without upgrades
    GAME.pumpMeter += 0.025; // = 0.5%/sec teaser

    if (GAME.autoPerSec > 0) {
      var inc = GAME.autoPerSec / 20; // coins this tick
      GAME.coins      += inc;
      GAME.totalCoins += inc;

      // Pump fills at autoPerSec * 0.02 % per tick  →  0.4%/sec per auto/sec
      GAME.pumpMeter += GAME.autoPerSec * 0.02;

      // Tiny auto price drift
      GAME.price *= (1 + GAME.autoPerSec * 0.0000002);
    }

    if (GAME.pumpMeter >= 100) {
      triggerMoon();
      return;
    }
  }

  autoTick++;
  // Update display & chart every second (every 20 ticks)
  if (autoTick % 20 === 0) {
    updateDisplay();
    updateChart(GAME.price);
  }
}

// ── Price drift (slow background increase) ──
function priceLoop() {
  if (moonActive) return;
  // More aggressive upward drift so chart visibly climbs
  GAME.price *= (1 + 0.0003 + Math.random() * 0.0005);
  if (Math.random() < 0.1) GAME.price *= (0.997 + Math.random() * 0.002);
}

// ── Init ─────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  GAME.updateDisplay = updateDisplay;

  // Populate CA everywhere from the single CA variable above
  document.getElementById('ca-display').textContent    = CA;
  document.getElementById('ca-center-addr').textContent = CA;

  initChart();
  initDog(onDogClick);
  initEvents(GAME);
  updateDisplay();

  setInterval(gameLoop,  50);    // 20 tps game loop
  setInterval(priceLoop, 1500);  // price drift every 1.5s — chart moves visibly
});
