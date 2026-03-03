/* ═══════════════════════════════════════
   effects.js — Cursor, Trail, Confetti,
                Toast, Shake, Float Text
   ═══════════════════════════════════════ */

var cursorEl = document.getElementById('cursor');
var lastTrailTime = 0;

var TRAIL_COLORS = ['#FFE000','#FF2D78','#00E5FF','#00FF94','#C678FF','#FF6B35'];

// ── Cursor position ──
document.addEventListener('mousemove', function(e) {
  cursorEl.style.left = e.clientX + 'px';
  cursorEl.style.top  = e.clientY + 'px';
  spawnTrail(e.clientX, e.clientY);
});
document.addEventListener('mouseleave', function() { cursorEl.style.opacity = '0'; });
document.addEventListener('mouseenter', function() { cursorEl.style.opacity = '1'; });

// ── Rainbow cursor trail ──
function spawnTrail(x, y) {
  var now = Date.now();
  if (now - lastTrailTime < 32) return;
  lastTrailTime = now;
  var el = document.createElement('div');
  el.className = 'trail';
  var sz = 4 + Math.random() * 8;
  var color = TRAIL_COLORS[Math.floor(Math.random() * TRAIL_COLORS.length)];
  el.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + sz + 'px;height:' + sz + 'px;background:' + color;
  document.body.appendChild(el);
  setTimeout(function() { el.remove(); }, 520);
}

// ── Confetti ──
var confCanvas = document.getElementById('confetti-canvas');
var cCtx = confCanvas.getContext('2d');
var CONF_COLORS = ['#FFE000','#FF2D78','#00E5FF','#00FF94','#C678FF','#fff','#FF6B35'];
var confPieces = [];
var confRaf = null;

function resizeConf() {
  confCanvas.width  = window.innerWidth;
  confCanvas.height = window.innerHeight;
}
resizeConf();
window.addEventListener('resize', resizeConf);

function launchConfetti(n) {
  n = n || 200;
  for (var i = 0; i < n; i++) {
    confPieces.push({
      x: Math.random() * confCanvas.width,
      y: -20 - Math.random() * 60,
      w: Math.random() * 12 + 4,
      h: Math.random() * 7  + 3,
      color: CONF_COLORS[Math.floor(Math.random() * CONF_COLORS.length)],
      vx: (Math.random() - .5) * 7,
      vy: Math.random() * 3 + 2,
      angle: Math.random() * Math.PI * 2,
      spin:  (Math.random() - .5) * .22,
      grav:  .08 + Math.random() * .07,
      life:  1,
      decay: .005 + Math.random() * .007
    });
  }
  if (confRaf) cancelAnimationFrame(confRaf);
  animConf();
}

function animConf() {
  cCtx.clearRect(0, 0, confCanvas.width, confCanvas.height);
  confPieces = confPieces.filter(function(p) { return p.life > 0; });
  confPieces.forEach(function(p) {
    p.x += p.vx; p.vy += p.grav; p.y += p.vy;
    p.angle += p.spin; p.life -= p.decay;
    cCtx.save();
    cCtx.globalAlpha = Math.max(0, p.life);
    cCtx.translate(p.x, p.y);
    cCtx.rotate(p.angle);
    cCtx.fillStyle = p.color;
    cCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    cCtx.restore();
  });
  if (confPieces.length > 0) {
    confRaf = requestAnimationFrame(animConf);
  } else {
    cCtx.clearRect(0, 0, confCanvas.width, confCanvas.height);
    confRaf = null;
  }
}

// ── Toast notification ──
var toastEl = document.getElementById('toast');
var toastTimer = null;

function showToast(msg, duration) {
  msg = msg || '✅ APE IN!';
  duration = duration || 2500;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { toastEl.classList.remove('show'); }, duration);
}

// ── Screen shake ──
function screenShake() {
  document.body.classList.add('shake');
  setTimeout(function() { document.body.classList.remove('shake'); }, 420);
}

// ── Floating "+N $PIP" text ──
function spawnFloatCoin(x, y, amount) {
  var el = document.createElement('div');
  el.className = 'float-coin';
  el.textContent = '+' + formatNum(amount) + ' $PIP';
  el.style.left = x + 'px';
  el.style.top  = y + 'px';
  document.body.appendChild(el);
  setTimeout(function() { el.remove(); }, 860);
}

// ── Number formatter (shared across all modules) ──
function formatNum(n) {
  n = Math.floor(n);
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toString();
}

// ── Cursor ring on interactive elements ──
document.querySelectorAll('button').forEach(function(el) {
  el.addEventListener('mouseenter', function() { cursorEl.classList.add('big'); });
  el.addEventListener('mouseleave', function() { cursorEl.classList.remove('big'); });
});
