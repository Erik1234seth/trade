/* ═══════════════════════════════════════
   activity.js — Live claims feed + leaderboard
   ═══════════════════════════════════════ */

// Generate 40 fake Solana-style short addresses
var FAKE_ADDRS = (function() {
  var chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  function rnd(n) {
    var s = '';
    for (var i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }
  var list = [];
  for (var i = 0; i < 40; i++) list.push(rnd(4) + '...' + rnd(3));
  return list;
})();

var CLAIM_VERBS = [
  'claimed airdrop', 'farmed tokens', 'dodged sybil', 'bypassed KYC',
  'reached safe zone', 'ape\'d in', 'secured allocation', 'got eligible',
  'passed snapshot', 'farmed eligibility'
];

var liveTotal    = 0;
var leaderboard  = [];

/* ── Init ────────────────────────────── */
function initActivity() {
  // Seed leaderboard with 6 random wallets
  leaderboard = [];
  for (var i = 0; i < 6; i++) {
    leaderboard.push({
      addr:   FAKE_ADDRS[i],
      tokens: Math.floor(40000 + Math.random() * 460000)
    });
  }
  leaderboard.sort(function(a, b) { return b.tokens - a.tokens; });

  // Seed live total from leaderboard
  liveTotal = leaderboard.reduce(function(s, e) { return s + e.tokens; }, 0)
              + Math.floor(Math.random() * 200000);
  updateLiveTotal();
  renderLeaderboard();

  // Seed initial feed entries (silent, no flash)
  for (var j = 0; j < 9; j++) addLiveClaim(true);

  scheduleActivity();
}

function scheduleActivity() {
  var delay = 900 + Math.random() * 2400;
  setTimeout(function() {
    addLiveClaim(false);
    scheduleActivity();
  }, delay);
}

/* ── Live claim entry ────────────────── */
function addLiveClaim(silent) {
  var addr   = FAKE_ADDRS[Math.floor(Math.random() * FAKE_ADDRS.length)];
  var amount = Math.floor(800 + Math.random() * 18000);
  var verb   = CLAIM_VERBS[Math.floor(Math.random() * CLAIM_VERBS.length)];

  liveTotal += amount;
  updateLiveTotal();

  // Bump a random leaderboard entry
  var li = Math.floor(Math.random() * leaderboard.length);
  leaderboard[li].tokens += amount;
  leaderboard.sort(function(a, b) { return b.tokens - a.tokens; });
  renderLeaderboard();

  var feed = document.getElementById('live-feed');
  if (!feed) return;

  var item = document.createElement('div');
  item.className = 'live-item' + (silent ? '' : ' new');
  item.innerHTML =
    '<span class="li-dot">●</span>' +
    '<span class="li-addr">' + addr + '</span>' +
    '<span class="li-verb">' + verb + '</span>' +
    '<span class="li-amount">+' + formatNum(amount) + '</span>';

  feed.insertBefore(item, feed.firstChild);
  if (!silent) setTimeout(function() { item.classList.remove('new'); }, 600);

  // Cap at 22 entries
  while (feed.children.length > 22) feed.removeChild(feed.lastChild);
}

function updateLiveTotal() {
  var el = document.getElementById('live-total-val');
  if (el) el.textContent = formatNum(liveTotal);
}

/* ── Leaderboard ─────────────────────── */
function renderLeaderboard() {
  var lb = document.getElementById('leaderboard');
  if (!lb) return;
  lb.innerHTML = '';
  var medals = ['🥇', '🥈', '🥉'];
  leaderboard.forEach(function(entry, i) {
    var div = document.createElement('div');
    div.className = 'lb-item';
    div.innerHTML =
      '<span class="lb-rank">' + (medals[i] || '#' + (i + 1)) + '</span>' +
      '<span class="lb-addr">' + entry.addr + '</span>' +
      '<span class="lb-tokens">' + formatNum(entry.tokens) + '</span>';
    lb.appendChild(div);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(initActivity, 600);
});
