/* ═══════════════════════════════════════
   events.js — Random market events
   ═══════════════════════════════════════ */

var RANDOM_EVENTS = [
  { banner: '🐳 WHALE ALERT — $2M BUY!!',          pump: +25, coins: 0,     news: '🐳 Massive whale buy detected — $2M market order.' },
  { banner: '😨 China bans crypto (again lol)',     pump: -10, coins: 0,     news: '😨 China banned crypto again. Nobody cares anymore.' },
  { banner: '🦅 ELON JUST TWEETED 🐶🐶🐶!!',        pump: +35, coins: 0,     news: '🦅 Elon posted three dog emojis. Chart going vertical.' },
  { banner: '🎁 AIRDROP! FREE COINS INCOMING!',     pump: +5,  coins: 2000,  news: '🎁 Surprise airdrop! 2000 $PIP to active pumpers.' },
  { banner: '📺 CNBC: "THE NEXT 1000X"',            pump: +18, coins: 0,     news: '📺 CNBC anchor said the words "generational wealth."' },
  { banner: '🔥 10% OF SUPPLY JUST BURNED!!',       pump: +22, coins: 0,     news: '🔥 Dev burned 10% of supply. Scarcity incoming.' },
  { banner: '🏛️ SEC DROPS ALL CRYPTO CASES!',       pump: +28, coins: 0,     news: '🏛️ SEC tweet: "crypto is fine actually." Euphoria.' },
  { banner: '💸 COINBASE LISTING RUMOUR!!',         pump: +20, coins: 0,     news: '💸 Coinbase listing rumoured. Unconfirmed but who cares.' },
  { banner: '📈 BLACKROCK BUYS $PIP??',            pump: +15, coins: 1500,  news: '📈 BlackRock wallet spotted accumulating. Based.' },
  { banner: '🌕 DOGECOIN FOUNDER SHILLS US!',       pump: +30, coins: 0,     news: '🌕 OG doge founder says $PIP is the real deal.' },
  { banner: '🤝 PARTNERSHIP: NASA 🚀',              pump: +12, coins: 0,     news: '🤝 NASA partnership rumour somehow going viral.' },
  { banner: '💰 VCs APE IN — $50M RAISE!',          pump: +18, coins: 3000,  news: '💰 $50M raise confirmed. Institutions can\'t resist.' }
];

function initEvents(game) {
  // First event fires quickly — hook them immediately
  setTimeout(function() { triggerRandomEvent(game); }, 4000);
  setTimeout(function() { scheduleNextEvent(game); },  4000);
}

function scheduleNextEvent(game) {
  var delay = 4000 + Math.random() * 6000; // 4–10 seconds — constant action
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
    var bonus = ev.coins * (1 + game.moons * 1.0); // doubles with each moon
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

  // Keep max 25 items
  while (feed.children.length > 25) {
    feed.removeChild(feed.lastChild);
  }
}
