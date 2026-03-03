/* ═══════════════════════════════════════
   dodge.js — Scrolling Airdrop Dodge
   Player falls (background scrolls up)
   Left/right dodge only — safe zone
   rises from below after set distance
   ═══════════════════════════════════════ */

var DODGE = {
  active:    false,
  animFrame: null,
  canvas: null, ctx: null,
  W: 500, H: 650,
  time: 0,

  // World scroll
  bgOffset:    0,
  scrollSpeed: 90,   // px/sec — increases over time

  // Altitude: 1800m → 0m over ~25s
  altitude: 1800,
  TOTAL_ALT: 1800,

  // Player: fixed Y, left/right only
  player: {
    x: 250, y: 130,
    r: 26, speed: 290,
    lives: 3, invincible: false, invincibleTime: 0
  },

  // Background layers
  stars: [], buildings: [],

  // Game objects
  obstacles: [], coins: [], messages: [],

  // Input
  mouse: { x: 250, active: false },
  keys: {},

  // Scoring
  tokens: 0, score: 0,

  // Background memecoin tickers
  tickers: [],

  // Timers
  spawnTimer: 0, coinTimer: 0, buildTimer: 0
};

/* ── Resize ────────────────────────────── */
function resizeDodge() {
  if (!DODGE.canvas) return;
  var rect = DODGE.canvas.parentElement.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return;
  DODGE.W = DODGE.canvas.width  = Math.floor(rect.width);
  DODGE.H = DODGE.canvas.height = Math.floor(rect.height);
  DODGE.player.y = Math.max(110, Math.floor(DODGE.H * 0.22));
  DODGE.player.x = DODGE.W / 2;
  DODGE.mouse.x  = DODGE.W / 2;
  initStars();
  if (!DODGE.active) drawDodge();
}

function initStars() {
  DODGE.stars = [];
  var colors = ['0,255,148', '0,229,255', '198,120,255', '255,255,255'];
  for (var i = 0; i < 65; i++) {
    var c = colors[Math.floor(Math.random() * colors.length)];
    DODGE.stars.push({
      x:     Math.random() * DODGE.W,
      y:     Math.random() * DODGE.H,
      r:     0.4 + Math.random() * 1.6,
      speed: 0.12 + Math.random() * 0.75,
      col:   'rgba(' + c + ',',
      alpha: 0.2 + Math.random() * 0.7
    });
  }
}

var TICKER_NAMES = [
  '$DOGE','$PEPE','$WIF','$BONK','$SHIB','$APE','$FLOKI',
  '$TRUMP','$MICHI','$POPCAT','$BRETT','$MOG','$BOME','$MEW','$NEIRO'
];

function initTickers() {
  DODGE.tickers = [];
  for (var i = 0; i < 12; i++) DODGE.tickers.push(newTicker(true));
}

function newTicker(scattered) {
  var cols = ['0,255,148','0,229,255','198,120,255','255,224,0','255,107,53'];
  var col  = cols[Math.floor(Math.random() * cols.length)];
  return {
    text:  TICKER_NAMES[Math.floor(Math.random() * TICKER_NAMES.length)],
    x:     15 + Math.random() * (DODGE.W - 30),
    y:     scattered ? Math.random() * DODGE.H : DODGE.H + 50,
    speed: 0.06 + Math.random() * 0.14,
    alpha: 0.04 + Math.random() * 0.075,
    size:  14 + Math.floor(Math.random() * 20),
    col:   col
  };
}

/* ── Init (DOMContentLoaded) ───────────── */
document.addEventListener('DOMContentLoaded', function() {
  DODGE.canvas = document.getElementById('dodge-canvas');
  if (!DODGE.canvas) return;
  DODGE.ctx = DODGE.canvas.getContext('2d');

  initTickers();
  resizeDodge();
  window.addEventListener('resize', function() {
    setTimeout(resizeDodge, 50);
  });

  // Keyboard
  document.addEventListener('keydown', function(e) {
    DODGE.keys[e.key] = true;
    if (DODGE.active) {
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].indexOf(e.key) !== -1)
        e.preventDefault();
    }
  });
  document.addEventListener('keyup', function(e) {
    DODGE.keys[e.key] = false;
  });

  // Mouse / touch — track X only
  DODGE.canvas.addEventListener('mousemove', function(e) {
    var rect   = DODGE.canvas.getBoundingClientRect();
    var scaleX = DODGE.W / rect.width;
    DODGE.mouse.x      = (e.clientX - rect.left) * scaleX;
    DODGE.mouse.active = true;
  });
  DODGE.canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    var rect   = DODGE.canvas.getBoundingClientRect();
    var scaleX = DODGE.W / rect.width;
    DODGE.mouse.x      = (e.touches[0].clientX - rect.left) * scaleX;
    DODGE.mouse.active = true;
  }, { passive: false });

  drawDodge();

  // Auto-start the game immediately
  setTimeout(startDodgeGame, 150);
});

/* ── Start / Reset ─────────────────────── */
function startDodgeGame() {
  resizeDodge();

  DODGE.active       = true;
  DODGE.time         = 0;
  DODGE.bgOffset     = 0;
  DODGE.scrollSpeed  = 90;
  DODGE.altitude     = DODGE.TOTAL_ALT;
  DODGE.player.x     = DODGE.W / 2;
  DODGE.player.lives = 3;
  DODGE.player.invincible     = false;
  DODGE.player.invincibleTime = 0;
  DODGE.mouse.active = false;
  DODGE.keys         = {};
  DODGE.obstacles    = [];
  DODGE.coins        = [];
  DODGE.messages     = [];
  DODGE.buildings    = [];
  DODGE.tokens       = 0;
  DODGE.score        = 0;
  DODGE.spawnTimer   = 0;
  DODGE.coinTimer    = 0;
  DODGE.buildTimer   = 0;

  initStars();
  initTickers();
  // Pre-spawn some buildings so screen isn't empty
  for (var i = 0; i < 5; i++) spawnBuilding(true);

  document.getElementById('dodge-start-screen').classList.add('hidden');
  document.getElementById('dodge-gameover').classList.add('hidden');
  document.getElementById('dodge-hud').classList.remove('hidden');

  if (DODGE.animFrame) cancelAnimationFrame(DODGE.animFrame);
  var last = performance.now();
  function loop(ts) {
    if (!DODGE.active) return;
    var dt = Math.min((ts - last) / 1000, 0.05);
    last = ts;
    updateDodge(dt);
    drawDodge();
    DODGE.animFrame = requestAnimationFrame(loop);
  }
  DODGE.animFrame = requestAnimationFrame(loop);
}

/* ── Update ────────────────────────────── */
function updateDodge(dt) {
  DODGE.time += dt;
  var p = DODGE.player;

  // ── Scroll speed ramp (faster as you fall) ──
  DODGE.scrollSpeed = Math.min(280, 90 + DODGE.time * 5);

  // ── Altitude countdown ──
  var fallRate = 50 + DODGE.time * 3.5; // m/s, accelerating
  DODGE.altitude = Math.max(0, DODGE.altitude - fallRate * dt);
  DODGE.bgOffset += DODGE.scrollSpeed * dt;

  // ── Player: left/right only ──
  var usingKeys = false;
  var ks = DODGE.keys;
  if (ks['ArrowLeft']  || ks['a'] || ks['A']) { p.x -= p.speed * dt; usingKeys = true; }
  if (ks['ArrowRight'] || ks['d'] || ks['D']) { p.x += p.speed * dt; usingKeys = true; }

  // Mouse follow (X only)
  if (DODGE.mouse.active && !usingKeys) {
    var dx = DODGE.mouse.x - p.x;
    if (Math.abs(dx) > 3) p.x += dx * 7 * dt;
  }
  p.x = Math.max(p.r, Math.min(DODGE.W - p.r, p.x));

  // ── Invincibility ──
  if (p.invincible) {
    p.invincibleTime -= dt;
    if (p.invincibleTime <= 0) p.invincible = false;
  }

  // ── Win check ──
  if (DODGE.altitude <= 0) { dodgeSuccess(); return; }

  // ── Scroll background elements ──
  var scroll = DODGE.scrollSpeed * dt;
  DODGE.stars.forEach(function(s) {
    s.y -= scroll * s.speed;
    if (s.y < -3) { s.y = DODGE.H + 3; s.x = Math.random() * DODGE.W; }
  });
  for (var ti = DODGE.tickers.length - 1; ti >= 0; ti--) {
    var tk = DODGE.tickers[ti];
    tk.y -= DODGE.scrollSpeed * tk.speed * dt;
    if (tk.y < -50) DODGE.tickers[ti] = newTicker(false);
  }
  DODGE.buildings.forEach(function(b) { b.screenY -= scroll; });
  DODGE.buildings = DODGE.buildings.filter(function(b) { return b.screenY > -b.h; });

  // ── Spawn buildings ──
  DODGE.buildTimer += dt;
  if (DODGE.buildTimer >= 3.0) { DODGE.buildTimer -= 3.0; spawnBuilding(false); }

  // ── Spawn obstacles ──
  DODGE.spawnTimer += dt;
  var rate = Math.max(0.3, 1.6 - (1 - DODGE.altitude / DODGE.TOTAL_ALT) * 1.2);
  if (DODGE.spawnTimer >= rate) { DODGE.spawnTimer -= rate; spawnDodgeObs(); }

  // ── Spawn coins ──
  DODGE.coinTimer += dt;
  if (DODGE.coinTimer >= 1.7) { DODGE.coinTimer -= 1.7; spawnDodgeCoin(); }

  // ── Update obstacles ──
  for (var i = DODGE.obstacles.length - 1; i >= 0; i--) {
    var ob = DODGE.obstacles[i];
    // Obstacles move with scroll + their own upward velocity
    ob.x += ob.vx * dt;
    ob.y -= (DODGE.scrollSpeed + ob.vy) * dt; // moving upward
    ob.angle += dt * 2.5;

    // Wall bounce for horizontal patrollers
    if (ob.bounces) {
      if (ob.x < ob.r && ob.vx < 0) ob.vx *= -1;
      if (ob.x > DODGE.W - ob.r && ob.vx > 0) ob.vx *= -1;
    }
    // Chasing
    if (ob.chases) {
      var cx = p.x - ob.x;
      ob.vx += Math.sign(cx) * 50 * dt;
      ob.vx = Math.max(-120, Math.min(120, ob.vx));
    }
    // Zigzag timer
    if (ob.zigzag) {
      ob.zt += dt;
      if (ob.zt > 0.5) { ob.vx *= -1; ob.zt = 0; }
    }

    // Remove if off screen (top or sides)
    if (ob.y < -60 || ob.x < -80 || ob.x > DODGE.W + 80) {
      DODGE.obstacles.splice(i, 1); continue;
    }

    // Collision
    if (!p.invincible) {
      var ox = p.x - ob.x, oy = p.y - ob.y;
      if (Math.sqrt(ox*ox + oy*oy) < p.r + ob.r - 5) {
        hitDodgePlayer();
        DODGE.obstacles.splice(i, 1);
      }
    }
  }

  // ── Update coins ──
  for (var j = DODGE.coins.length - 1; j >= 0; j--) {
    var c = DODGE.coins[j];
    c.y -= scroll;  // coins scroll up with world
    c.age += dt;
    var cx2 = p.x - c.x, cy2 = p.y - c.y;
    if (Math.sqrt(cx2*cx2 + cy2*cy2) < p.r + c.r) {
      DODGE.tokens += c.value;
      DODGE.score  += c.value;
      var cmsg = ['+' + c.value + ' 🪙', 'LFG! +' + c.value, 'WAGMI +' + c.value, 'APE! +' + c.value][Math.floor(Math.random() * 4)];
      DODGE.messages.push({ text: cmsg, x: c.x, y: c.y, color: '#FFE000', age: 0 });
      DODGE.coins.splice(j, 1); continue;
    }
    if (c.y < -30 || c.age > 8) DODGE.coins.splice(j, 1);
  }

  // ── Messages decay ──
  for (var m = DODGE.messages.length - 1; m >= 0; m--) {
    DODGE.messages[m].age += dt;
    DODGE.messages[m].y   -= 55 * dt;
    if (DODGE.messages[m].age > 1.1) DODGE.messages.splice(m, 1);
  }

  // ── Update HUD ──
  var hearts = '';
  for (var h = 0; h < p.lives; h++) hearts += '❤️';
  document.getElementById('dodge-lives').textContent = hearts || '';
  document.getElementById('dodge-score').textContent = formatNum(DODGE.score);
  document.getElementById('dodge-altitude').textContent =
    'ALT: ' + Math.ceil(DODGE.altitude) + 'm';
}

/* ── Spawn helpers ─────────────────────── */
function spawnBuilding(scattered) {
  var side = Math.random() < 0.5 ? 0 : 1;
  var w = 55 + Math.random() * 120;
  var h = 90 + Math.random() * 240;
  // Buildings on left or right edge only
  var x = side === 0
    ? -15 + Math.random() * (DODGE.W * 0.22)
    : DODGE.W * 0.78 + Math.random() * (DODGE.W * 0.22 + 15) - w;
  var startY = scattered
    ? -h + Math.random() * (DODGE.H + h)  // random placement for pre-spawn
    : DODGE.H + h;                          // always from below
  DODGE.buildings.push({ x: x, w: w, h: h, screenY: startY, wins: makeWindows(w, h) });
}

function makeWindows(w, h) {
  var wins = [];
  var cols = Math.floor(w / 13), rows = Math.floor(h / 16);
  for (var c = 0; c < cols; c++) {
    for (var r = 0; r < rows; r++) {
      if (Math.random() < 0.32)
        wins.push({ rx: c * 13 + 2, ry: r * 16 + 2, rw: 6, rh: 8 });
    }
  }
  return wins;
}

function spawnDodgeObs() {
  var prog = 1 - DODGE.altitude / DODGE.TOTAL_ALT; // 0 at start, 1 at end
  var pool = ['sybil', 'bomb', 'sec'];
  if (prog > 0.4) pool.push('bot', 'bot');
  if (prog > 0.7) pool.push('sybil', 'sec'); // more frequent near ground
  var type = pool[Math.floor(Math.random() * pool.length)];
  var ob = { type: type, vx: 0, vy: 0, r: 20, angle: 0, zt: 0 };

  switch (type) {
    case 'sybil': // horizontal patrol, rises with scroll
      ob.emoji = '🕵️'; ob.r = 21;
      ob.x = Math.random() < 0.5 ? -30 : DODGE.W + 30;
      ob.y = DODGE.H + 40;
      ob.vx = (ob.x < 0 ? 1 : -1) * (80 + Math.random() * 70 + prog * 40);
      ob.vy = 20;  // extra upward push beyond scroll
      ob.bounces = true;
      break;
    case 'bomb': // fast riser, straight up
      ob.emoji = '💣'; ob.r = 17;
      ob.x = 30 + Math.random() * (DODGE.W - 60);
      ob.y = DODGE.H + 30;
      ob.vx = (Math.random() - 0.5) * 40;
      ob.vy = 60 + Math.random() * 70 + prog * 50;
      break;
    case 'sec': // chases player X
      ob.emoji = '🚔'; ob.r = 22;
      ob.x = Math.random() * DODGE.W;
      ob.y = DODGE.H + 40;
      ob.vx = 0;
      ob.vy = 30 + Math.random() * 40;
      ob.chases = true;
      break;
    case 'bot': // zigzag riser
      ob.emoji = '🤖'; ob.r = 18;
      ob.x = Math.random() < 0.5 ? 30 : DODGE.W - 30;
      ob.y = DODGE.H + 40;
      ob.vx = (ob.x < DODGE.W / 2 ? 1 : -1) * (50 + Math.random() * 60);
      ob.vy = 35 + Math.random() * 45;
      ob.zigzag = true;
      break;
  }
  DODGE.obstacles.push(ob);
}

function spawnDodgeCoin() {
  var roll = Math.random();
  var c = {
    x: 40 + Math.random() * (DODGE.W - 80),
    y: DODGE.H + 20,  // starts below, scrolls up
    r: 14, age: 0
  };
  if      (roll < 0.5)  { c.value = 500;  c.emoji = '💰'; }
  else if (roll < 0.82) { c.value = 1000; c.emoji = '⭐'; }
  else                  { c.value = 2500; c.emoji = '💎'; c.r = 16; }
  DODGE.coins.push(c);
}

/* ── Hit / Win / Lose ──────────────────── */
function hitDodgePlayer() {
  var p = DODGE.player;
  p.lives--;
  p.invincible = true;
  p.invincibleTime = 2.8;
  DODGE.messages.push({ text: '💀 FLAGGED!', x: p.x, y: p.y - 44, color: '#FF2D78', age: 0 });
  if (p.lives <= 0) dodgeFail();
}

function dodgeSuccess() {
  DODGE.active = false;
  cancelAnimationFrame(DODGE.animFrame);
  var bonus = Math.floor(4000 + (DODGE.TOTAL_ALT - DODGE.altitude) * 2 + DODGE.time * 50);
  DODGE.tokens += bonus;
  DODGE.score  += bonus;
  GAME.coins      += DODGE.tokens;
  GAME.totalCoins += DODGE.tokens;
  GAME.pumpMeter  += 30;
  showDodgeEnd(true, DODGE.tokens);
  launchConfetti(500);
  screenShake();
  showToast('🪂 AIRDROP SECURED! +' + formatNum(DODGE.tokens) + ' TOKENS!', 3500);
  addToNewsFeed('🪂 Airdrop secured! Landed safely. Earned ' + formatNum(DODGE.tokens) + ' tokens!');
  GAME.updateDisplay();
}

function dodgeFail() {
  DODGE.active = false;
  cancelAnimationFrame(DODGE.animFrame);
  GAME.coins      += DODGE.tokens;
  GAME.totalCoins += DODGE.tokens;
  showDodgeEnd(false, DODGE.tokens);
  addToNewsFeed('💀 Sybil-flagged at ' + Math.ceil(DODGE.altitude) + 'm. Kept ' + formatNum(DODGE.tokens) + ' tokens.');
  GAME.updateDisplay();
}

function showDodgeEnd(won, earned) {
  document.getElementById('dodge-hud').classList.add('hidden');
  document.getElementById('dodge-gameover').classList.remove('hidden');
  document.getElementById('dodge-result-icon').textContent   = won ? '🪂' : '💀';
  document.getElementById('dodge-result-title').textContent  = won ? 'AIRDROP SECURED!' : 'SYBIL-FLAGGED!';
  document.getElementById('dodge-result-sub').textContent    = won ? 'You reached the landing zone!' : 'You ran out of lives at ' + Math.ceil(DODGE.altitude) + 'm';
  document.getElementById('dodge-result-tokens').textContent = '+' + formatNum(earned) + ' tokens added';
}

/* ── Draw ──────────────────────────────── */
function drawDodge() {
  var ctx = DODGE.ctx;
  var W = DODGE.W, H = DODGE.H, t = DODGE.time;
  var alt = DODGE.altitude, TOTAL = DODGE.TOTAL_ALT;
  var prog = 1 - alt / TOTAL;  // 0=start, 1=end

  // ── Background ──
  // Sky gradient shifts from deep blue-black to orange-red as you approach ground
  var skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  var r1 = Math.floor(5  + prog * 30),  g1 = Math.floor(5  + prog * 5),   b1 = Math.floor(16 + prog * 5);
  var r2 = Math.floor(10 + prog * 60),  g2 = Math.floor(5  + prog * 20),  b2 = Math.floor(20 - prog * 10);
  skyGrad.addColorStop(0, 'rgb(' + r1 + ',' + g1 + ',' + b1 + ')');
  skyGrad.addColorStop(1, 'rgb(' + r2 + ',' + g2 + ',' + b2 + ')');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // ── Scrolling grid (horizontal lines only — gives speed sensation) ──
  ctx.save();
  var lineSpacing = 38;
  var lineOff = DODGE.bgOffset % lineSpacing;
  ctx.strokeStyle = 'rgba(0,255,148,0.045)';
  ctx.lineWidth = 1;
  for (var ly = -lineOff; ly < H + lineSpacing; ly += lineSpacing) {
    ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(W, ly); ctx.stroke();
  }
  // Vertical lines (static — gives sense of horizontal reference)
  ctx.strokeStyle = 'rgba(0,255,148,0.025)';
  for (var lx = 0; lx < W; lx += 44) {
    ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, H); ctx.stroke();
  }
  ctx.restore();

  // ── Stars (parallax) ──
  ctx.save();
  DODGE.stars.forEach(function(s) {
    ctx.fillStyle = s.col + (s.alpha * (0.5 + 0.5 * prog * 0 + 1)) + ')';
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  });
  ctx.restore();

  // ── Memecoin tickers (drifting background text) ──
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  DODGE.tickers.forEach(function(tk) {
    ctx.font = 'bold ' + tk.size + 'px Bangers, sans-serif';
    ctx.fillStyle = 'rgba(' + tk.col + ',' + tk.alpha + ')';
    ctx.fillText(tk.text, tk.x, tk.y);
  });
  ctx.restore();

  // ── City buildings (left/right edges) ──
  ctx.save();
  DODGE.buildings.forEach(function(b) {
    var topY = b.screenY - b.h;
    if (topY > H) return;
    // Body
    ctx.fillStyle = '#07071a';
    ctx.fillRect(b.x, topY, b.w, b.h);
    // Neon border
    ctx.strokeStyle = 'rgba(0,255,148,0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x, topY, b.w, b.h);
    // Lit windows
    ctx.fillStyle = 'rgba(255,220,80,0.35)';
    b.wins.forEach(function(win) {
      ctx.fillRect(b.x + win.rx, topY + win.ry, win.rw, win.rh);
    });
  });
  ctx.restore();

  // ── Ground glow (orange warmth from below as you approach) ──
  if (alt < 500) {
    var groundIntensity = Math.pow(1 - alt / 500, 1.5) * 0.45;
    var gGrad = ctx.createLinearGradient(0, H * 0.5, 0, H);
    gGrad.addColorStop(0, 'rgba(255,100,20,0)');
    gGrad.addColorStop(1, 'rgba(255,80,10,' + groundIntensity + ')');
    ctx.fillStyle = gGrad;
    ctx.fillRect(0, H * 0.5, W, H * 0.5);
  }

  // ── Safe zone platform (rises from below when alt < 400m) ──
  if (alt < 400) {
    var playerFrac = DODGE.player.y / H;
    var platformY  = DODGE.player.y + (alt / 400) * (H - DODGE.player.y);
    var glowA = Math.min(1, (400 - alt) / 400);
    var pulse = 0.7 + 0.3 * Math.sin(t * 5);

    // Glow from below
    var sfGrad = ctx.createLinearGradient(0, platformY, 0, H);
    sfGrad.addColorStop(0, 'rgba(0,255,148,' + (glowA * 0.3) + ')');
    sfGrad.addColorStop(1, 'rgba(0,255,148,' + (glowA * 0.08) + ')');
    ctx.fillStyle = sfGrad;
    ctx.fillRect(0, platformY, W, H - platformY);

    // Platform line
    ctx.save();
    ctx.strokeStyle = 'rgba(0,255,148,' + (glowA * pulse) + ')';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00FF94';
    ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.moveTo(0, platformY); ctx.lineTo(W, platformY); ctx.stroke();
    ctx.restore();

    // Dashed safe zone label
    ctx.save();
    ctx.font = 'bold 14px Bangers, sans-serif';
    ctx.fillStyle = 'rgba(0,255,148,' + (glowA * pulse * 0.9) + ')';
    ctx.textAlign = 'center';
    ctx.fillText('▓ SAFE ZONE — CLAIM AIRDROP ▓', W / 2, platformY + 22);
    ctx.restore();
  }

  // ── Coins ──
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  DODGE.coins.forEach(function(c) {
    var pulse = 0.7 + 0.3 * Math.sin(t * 4 + c.x * 0.05);
    ctx.globalAlpha = pulse;
    // Glow ring behind coin
    ctx.save();
    ctx.strokeStyle = c.value >= 2500 ? 'rgba(0,229,255,0.5)' : 'rgba(255,224,0,0.4)';
    ctx.lineWidth = 2;
    ctx.shadowColor = c.value >= 2500 ? '#00E5FF' : '#FFE000';
    ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 4, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
    ctx.font = (c.value >= 2500 ? '28px' : '24px') + ' serif';
    ctx.fillText(c.emoji, c.x, c.y);
  });
  ctx.globalAlpha = 1;
  ctx.restore();

  // ── Obstacles ──
  var OB_LABELS = { sybil: 'KYC CHECK', bomb: 'RUG PULL', sec: 'SEC RAID', bot: 'SYBIL BOT' };
  ctx.save();
  ctx.font = '30px serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  DODGE.obstacles.forEach(function(ob) {
    ctx.save();
    ctx.translate(ob.x, ob.y);
    ctx.rotate(Math.sin(ob.angle) * 0.18);
    ctx.fillText(ob.emoji, 0, 0);
    ctx.restore();
    // Danger label below
    ctx.save();
    ctx.font = 'bold 8px Share Tech Mono, monospace';
    ctx.fillStyle = 'rgba(255,45,120,0.8)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(OB_LABELS[ob.type] || '', ob.x, ob.y + 19);
    ctx.restore();
  });
  ctx.restore();

  // ── Player (custom-drawn parachute) ──
  if (DODGE.active) {
    var p = DODGE.player;
    var flash = p.invincible && Math.floor(t * 9) % 2 === 0;
    if (!flash) {
      ctx.save();
      var px = p.x, py = p.y;
      var cw     = p.r * 2.3;        // canopy half-width ≈ 60px
      var canY   = py - p.r - 10;    // canopy arc centre
      var harnY  = py - 4;           // cords converge here
      var coinY  = py + 15;          // gold coin centre
      var pulse  = 0.78 + 0.22 * Math.sin(t * 3.5);

      // Ambient glow behind entire character
      var aura = ctx.createRadialGradient(px, canY, 0, px, canY, cw + 24);
      aura.addColorStop(0,   'rgba(0,255,148,0.14)');
      aura.addColorStop(0.6, 'rgba(0,255,148,0.04)');
      aura.addColorStop(1,   'rgba(0,255,148,0)');
      ctx.fillStyle = aura;
      ctx.beginPath(); ctx.arc(px, canY, cw + 24, 0, Math.PI*2); ctx.fill();

      // Suspension cords (8 lines, canopy edge → harness)
      ctx.strokeStyle = 'rgba(0,255,148,0.5)';
      ctx.lineWidth = 0.85;
      for (var ci = 0; ci < 8; ci++) {
        var cordX = px - cw + ci / 7 * cw * 2;
        ctx.beginPath(); ctx.moveTo(cordX, canY); ctx.lineTo(px, harnY); ctx.stroke();
      }

      // Canopy gores — 8 alternating slices
      var GORE_COLS = [
        'rgba(0,255,148,',  // neon green
        'rgba(0,35,22,',    // dark
        'rgba(0,229,255,',  // cyan
        'rgba(0,20,35,',    // dark
        'rgba(0,255,148,',
        'rgba(0,35,22,',
        'rgba(0,229,255,',
        'rgba(0,20,35,'
      ];
      ctx.shadowColor = '#00FF94'; ctx.shadowBlur = 26;
      for (var g = 0; g < 8; g++) {
        var a1 = Math.PI + (g / 8) * Math.PI;
        var a2 = Math.PI + ((g + 1) / 8) * Math.PI;
        ctx.fillStyle = GORE_COLS[g] + (g % 2 === 0 ? 0.9 * pulse : 0.82) + ')';
        ctx.beginPath();
        ctx.moveTo(px, canY);
        ctx.arc(px, canY, cw, a1, a2, false);
        ctx.closePath();
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Canopy rim (glowing arc)
      ctx.strokeStyle = 'rgba(0,255,148,' + (0.7 + 0.3 * Math.sin(t * 4)) + ')';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00FF94'; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(px, canY, cw, Math.PI, 0, false); ctx.stroke();
      ctx.shadowBlur = 0;

      // Canopy chord (bottom straight edge)
      ctx.strokeStyle = 'rgba(0,255,148,0.28)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px - cw, canY); ctx.lineTo(px + cw, canY); ctx.stroke();

      // Harness ring
      ctx.fillStyle = 'rgba(0,255,148,0.6)';
      ctx.beginPath(); ctx.arc(px, harnY, 3.5, 0, Math.PI*2); ctx.fill();

      // Gold coin payload
      ctx.shadowColor = '#FFE000'; ctx.shadowBlur = 22;
      ctx.strokeStyle = 'rgba(255,200,0,0.75)';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(px, coinY, 16, 0, Math.PI*2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,200,0,0.9)';
      ctx.beginPath(); ctx.arc(px, coinY, 12, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#050510';
      ctx.font = 'bold 14px Bangers, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('$', px, coinY + 1);

      ctx.restore();
    }
  }

  // ── Altitude progress bar (right edge) ──
  if (DODGE.active) {
    var barH = H * 0.6;
    var barY = H * 0.2;
    var barX = W - 14;
    var filled = barH * (1 - DODGE.altitude / DODGE.TOTAL_ALT);
    // Track
    ctx.fillStyle = 'rgba(0,255,148,0.08)';
    ctx.fillRect(barX, barY, 8, barH);
    // Fill (top to bottom = high to low altitude)
    ctx.fillStyle = 'rgba(0,255,148,0.5)';
    ctx.fillRect(barX, barY, 8, filled);
    // Marker dot on bar
    var markerY = barY + filled;
    ctx.fillStyle = '#FFE000';
    ctx.shadowColor = '#FFE000'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(barX + 4, markerY, 4.5, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
  }

  // ── Floating messages ──
  ctx.save();
  ctx.textAlign = 'center';
  DODGE.messages.forEach(function(m) {
    ctx.globalAlpha = Math.max(0, 1 - m.age / 1.1);
    ctx.font = 'bold 17px Bangers, sans-serif';
    ctx.fillStyle = m.color;
    ctx.fillText(m.text, m.x, m.y);
  });
  ctx.globalAlpha = 1;
  ctx.restore();

  // ── Chain & context watermarks ──
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.font = 'bold 11px Bangers, sans-serif';
  ctx.fillStyle = 'rgba(198,120,255,0.22)';
  ctx.fillText('◎ SOLANA MAINNET · FARM YOUR AIRDROP', W / 2, H - 5);
  ctx.restore();
}
