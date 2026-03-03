/* ═══════════════════════════════════════
   chart.js — Fake real-time price chart
   ═══════════════════════════════════════ */

var chartCanvas = document.getElementById('price-chart');
var chartCtx    = chartCanvas.getContext('2d');
var CHART_LEN   = 60;
var priceHistory = [];

function initChart() {
  resizeChart();
  window.addEventListener('resize', resizeChart);

  // Seed with slightly-trending-up data
  var seed = 0.000001;
  for (var i = 0; i < CHART_LEN; i++) {
    seed *= (1 + (Math.random() - 0.3) * 0.02);
    priceHistory.push(seed);
  }
  drawChart();
}

function resizeChart() {
  var parent = chartCanvas.parentElement;
  chartCanvas.width  = parent ? parent.clientWidth - 14 : 280;
  chartCanvas.height = 140;
  drawChart();
}

function updateChart(currentPrice) {
  priceHistory.push(currentPrice);
  if (priceHistory.length > CHART_LEN * 2) priceHistory.shift();
  while (priceHistory.length > CHART_LEN) priceHistory.shift();
  drawChart();
}

function addPriceSpike(multiplier) {
  var last = priceHistory[priceHistory.length - 1] || 0.000001;
  var peak = last * multiplier;
  // Add spike shape: up, then partial retrace
  priceHistory.push(peak * 0.85);
  priceHistory.push(peak);
  priceHistory.push(peak * 0.92);
  priceHistory.push(peak * 0.80);
  priceHistory.push(peak * 0.75);
  while (priceHistory.length > CHART_LEN) priceHistory.shift();
  drawChart();
}

function drawChart() {
  var w = chartCanvas.width, h = chartCanvas.height;
  chartCtx.clearRect(0, 0, w, h);

  if (priceHistory.length < 2) return;

  var min = Math.min.apply(null, priceHistory) * 0.94;
  var max = Math.max.apply(null, priceHistory) * 1.06;
  var range = (max - min) || 1;
  var pad = 10;

  function toX(i) { return (i / (priceHistory.length - 1)) * w; }
  function toY(p) { return h - pad - ((p - min) / range) * (h - pad * 2); }

  // Gradient fill under line
  var grad = chartCtx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0,   'rgba(0,255,148,0.32)');
  grad.addColorStop(0.7, 'rgba(0,255,148,0.08)');
  grad.addColorStop(1,   'rgba(0,255,148,0.01)');

  // Draw filled area
  chartCtx.beginPath();
  chartCtx.moveTo(toX(0), toY(priceHistory[0]));
  for (var i = 1; i < priceHistory.length; i++) {
    var cpx = (toX(i - 1) + toX(i)) / 2;
    chartCtx.bezierCurveTo(cpx, toY(priceHistory[i-1]), cpx, toY(priceHistory[i]), toX(i), toY(priceHistory[i]));
  }
  chartCtx.lineTo(w, h);
  chartCtx.lineTo(0, h);
  chartCtx.closePath();
  chartCtx.fillStyle = grad;
  chartCtx.fill();

  // Draw price line
  chartCtx.beginPath();
  chartCtx.moveTo(toX(0), toY(priceHistory[0]));
  for (var j = 1; j < priceHistory.length; j++) {
    var cpx2 = (toX(j - 1) + toX(j)) / 2;
    chartCtx.bezierCurveTo(cpx2, toY(priceHistory[j-1]), cpx2, toY(priceHistory[j]), toX(j), toY(priceHistory[j]));
  }
  chartCtx.strokeStyle = '#00FF94';
  chartCtx.lineWidth   = 2;
  chartCtx.stroke();

  // Current price dot
  var lx = toX(priceHistory.length - 1);
  var ly = toY(priceHistory[priceHistory.length - 1]);
  chartCtx.beginPath();
  chartCtx.arc(lx, ly, 4, 0, Math.PI * 2);
  chartCtx.fillStyle = '#00FF94';
  chartCtx.fill();
  chartCtx.strokeStyle = '#fff';
  chartCtx.lineWidth   = 1.5;
  chartCtx.stroke();

  // Glow dot
  chartCtx.beginPath();
  chartCtx.arc(lx, ly, 8, 0, Math.PI * 2);
  chartCtx.fillStyle = 'rgba(0,255,148,0.2)';
  chartCtx.fill();
}
