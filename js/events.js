/* ═══════════════════════════════════════
   events.js — Airdrop market events
   ═══════════════════════════════════════ */

var RANDOM_EVENTS = [
  { banner: '🪂 RETROACTIVE AIRDROP ANNOUNCED!!',   pump: +30, coins: 0,     news: '🪂 Protocol announced retroactive airdrop for early farmers.' },
  { banner: '🔍 SYBIL FILTER ACTIVATED 😱',         pump: -15, coins: 0,     news: '😱 Sybil detection running. Suspicious wallets being flagged.' },
  { banner: '📸 SNAPSHOT IN 24 HOURS!!',            pump: +25, coins: 0,     news: '📸 Snapshot announced! Farm eligibility NOW or miss out.' },
  { banner: '🎁 MYSTERY AIRDROP — FREE TOKENS!',    pump: +5,  coins: 2000,  news: '🎁 Surprise: 2000 tokens airdropped to active farmers.' },
  { banner: '🐋 WHALE APED IN — $5M BUY!!',        pump: +20, coins: 0,     news: '🐋 Massive whale buy detected. Price pumping.' },
  { banner: '🔥 10% OF SUPPLY BURNED!!',            pump: +22, coins: 0,     news: '🔥 Dev burned 10% of supply. Scarcity incoming.' },
  { banner: '🏛️ SEC APPROVES CRYPTO ETF!',          pump: +28, coins: 0,     news: '🏛️ SEC approved crypto ETF. Euphoria mode.' },
  { banner: '💸 BINANCE LISTING CONFIRMED!!',       pump: +35, coins: 0,     news: '💸 Binance listing confirmed. Price discovery mode.' },
  { banner: '📈 BLACKROCK BUYS TOKEN??',            pump: +15, coins: 1500,  news: '📈 BlackRock wallet spotted accumulating. Institutional.' },
  { banner: '🤝 PARTNERSHIP: COINBASE!!',           pump: +18, coins: 0,     news: '🤝 Coinbase partnership announced. Legitimacy unlocked.' },
  { banner: '💰 VCs APE IN — $100M RAISE!',         pump: +18, coins: 3000,  news: '💰 $100M raise confirmed. VCs can\'t get enough.' },
  { banner: '😨 CHINA BANS CRYPTO (AGAIN)',         pump: -10, coins: 0,     news: '😨 China banned crypto again. Nobody cares. Buy the dip.' }
];

function initEvents(game) {
  setTimeout(function() { triggerRandomEvent(game); }, 4000);
  setTimeout(function() { scheduleNextEvent(game);  }, 4000);
}

function scheduleNextEvent(game) {
  var delay = 4000 + Math.random() * 6000;
  setTimeout(function() {
    triggerRandomEvent(game);
    scheduleNextEvent(game);
  }, delay);
}

function triggerRandomEvent(game) {
  var ev = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];

  showEventBanner(ev.banner);

  if (ev.pump !== 0) {
    game.pumpMeter = Math.max(0, Math.min(99.9, game.pumpMeter + ev.pump));
  }
  if (ev.coins > 0) {
    var bonus = ev.coins * (1 + game.moons * 1.0);
    game.coins      += bonus;
    game.totalCoins += bonus;
  }

  game.updateDisplay();
  addToNewsFeed(ev.news);
}

function showEventBanner(msg) {
  var banner = document.getElementById('event-banner');
  banner.textContent = msg;
  banner.classList.add('show');
  setTimeout(function() { banner.classList.remove('show'); }, 3500);
}

function addToNewsFeed(text) {
  var feed = document.getElementById('news-feed');
  var item = document.createElement('div');
  item.className = 'news-item new';
  item.textContent = text;
  feed.insertBefore(item, feed.firstChild);
  setTimeout(function() { item.classList.remove('new'); }, 600);

  while (feed.children.length > 25) {
    feed.removeChild(feed.lastChild);
  }
}
