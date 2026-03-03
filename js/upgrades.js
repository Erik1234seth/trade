/* ═══════════════════════════════════════
   upgrades.js — Airdrop farming upgrades
   ═══════════════════════════════════════ */

var UPGRADES = [
  { id: 'altwallet',   icon: '🦊', name: 'Alt Wallet',      effect: '+1 /sec',    autoInc: 1,   clickInc: 0,   baseCost: 15     },
  { id: 'gasopt',      icon: '⚡', name: 'Gas Optimizer',   effect: '+5 /click',  autoInc: 0,   clickInc: 5,   baseCost: 50     },
  { id: 'farmbot',     icon: '🤖', name: 'Farm Bot',        effect: '+5 /sec',    autoInc: 5,   clickInc: 0,   baseCost: 180    },
  { id: 'bridge',      icon: '🌉', name: 'Bridge Hopper',   effect: '+20 /click', autoInc: 0,   clickInc: 20,  baseCost: 600    },
  { id: 'dexfarm',     icon: '📊', name: 'DEX Farmer',      effect: '+20 /sec',   autoInc: 20,  clickInc: 0,   baseCost: 2000   },
  { id: 'influencer',  icon: '🐦', name: 'Influencer Shill',effect: '+100 /click',autoInc: 0,   clickInc: 100, baseCost: 7000   },
  { id: 'cexlist',     icon: '🏦', name: 'CEX Listing',     effect: '+100 /sec',  autoInc: 100, clickInc: 0,   baseCost: 22000  },
  { id: 'ogstatus',    icon: '👑', name: 'OG Status',       effect: '+500 /click',autoInc: 0,   clickInc: 500, baseCost: 75000  }
];

var COST_SCALE = 1.15;

function getUpgradeCost(upg, count) {
  return Math.floor(upg.baseCost * Math.pow(COST_SCALE, count));
}

function renderUpgrades(game) {
  var panel = document.getElementById('upgrades-panel');
  panel.innerHTML = '<div class="panel-title">⚙ UPGRADES</div>';

  UPGRADES.forEach(function(upg) {
    var count     = game.upgrades[upg.id] || 0;
    var cost      = getUpgradeCost(upg, count);
    var canAfford = game.coins >= cost;

    var el = document.createElement('div');
    el.className = 'upgrade-item' + (canAfford ? '' : ' locked');
    el.innerHTML =
      '<div class="upg-row">' +
        '<span class="upgrade-icon">' + upg.icon + '</span>' +
        '<div class="upg-info">' +
          '<div class="upgrade-name">' + upg.name + '</div>' +
          '<div class="upgrade-effect">' + upg.effect + '</div>' +
          '<div class="upgrade-cost">◈ ' + formatNum(cost) + '</div>' +
        '</div>' +
      '</div>' +
      (count > 0 ? '<div class="upgrade-count">x' + count + '</div>' : '');

    el.addEventListener('click', function() { buyUpgrade(upg.id, game); });
    panel.appendChild(el);
  });
}

function buyUpgrade(id, game) {
  var upg = null;
  for (var i = 0; i < UPGRADES.length; i++) {
    if (UPGRADES[i].id === id) { upg = UPGRADES[i]; break; }
  }
  if (!upg) return;

  var count = game.upgrades[id] || 0;
  var cost  = getUpgradeCost(upg, count);

  if (game.coins < cost) {
    showToast('❌ NOT ENOUGH TOKENS!', 1400);
    return;
  }

  game.coins -= cost;
  game.upgrades[id] = count + 1;
  game.clickPower  += upg.clickInc;
  game.autoPerSec  += upg.autoInc;

  renderUpgrades(game);
  game.updateDisplay();
  showToast(upg.icon + ' ' + upg.name.toUpperCase() + ' ACTIVATED!', 1800);
  screenShake();
  addToNewsFeed(upg.icon + ' Upgraded: ' + upg.name + ' (x' + (count + 1) + ') — ' + upg.effect);
}
