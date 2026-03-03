/* ═══════════════════════════════════════
   dog.js — Dog SVG animations & clicks
   ═══════════════════════════════════════ */

var dogWrap   = document.getElementById('dog-wrap');
var dogSvg    = document.getElementById('dog-svg');
var pupilL    = document.getElementById('pupil-l');
var pupilR    = document.getElementById('pupil-r');
var shineL    = document.getElementById('shine-l');
var shineR    = document.getElementById('shine-r');
var dollarL   = document.getElementById('dollar-l');
var dollarR   = document.getElementById('dollar-r');
var speechBub = document.getElementById('speech-bubble');

var DOG_PHRASES = ['wow', 'such pump', 'very moon', 'much gains', 'acorn ATH!', 'tail to moon', 'nutty returns', 'pip pip pip!', 'so coin', '🌕 wen moon'];
var phraseIdx = 0;
var dollarTimer = null;
var MAX_PUPIL_OFFSET = 5; // SVG units

// ── Eye tracking ──
document.addEventListener('mousemove', function(e) {
  var rect = dogSvg.getBoundingClientRect();
  if (!rect.width) return;

  var scaleX = 200 / rect.width;
  var scaleY = 220 / rect.height;
  var smx = (e.clientX - rect.left) * scaleX;
  var smy = (e.clientY - rect.top)  * scaleY;

  // [eyeCenterX, eyeCenterY, pupil el, shine el, shineDx, shineDy]
  [
    [76,  85, pupilL, shineL, -4, -5],
    [124, 85, pupilR, shineR, -4, -5]
  ].forEach(function(cfg) {
    var bx = cfg[0], by = cfg[1], pupil = cfg[2], shine = cfg[3];
    var sdx = cfg[4], sdy = cfg[5];
    var dx = smx - bx, dy = smy - by;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var s = dist > 0 ? Math.min(MAX_PUPIL_OFFSET / dist, 1) : 0;
    var ox = dx * s, oy = dy * s;
    pupil.setAttribute('cx', bx + ox);
    pupil.setAttribute('cy', by + oy);
    shine.setAttribute('cx', bx + ox + sdx);
    shine.setAttribute('cy', by + oy + sdy);
  });
});

// ── Speech bubble cycles on hover ──
dogWrap.addEventListener('mouseenter', function() {
  speechBub.textContent = DOG_PHRASES[phraseIdx % DOG_PHRASES.length];
  phraseIdx++;
});

// ── Click animation: squish + dollar eyes ──
function dogClickAnimation() {
  // Squish
  dogWrap.classList.remove('squish');
  void dogWrap.offsetWidth; // force reflow
  dogWrap.classList.add('squish');
  setTimeout(function() { dogWrap.classList.remove('squish'); }, 340);

  // Dollar eyes for 650ms
  dollarL.setAttribute('visibility', 'visible');
  dollarR.setAttribute('visibility', 'visible');
  pupilL.setAttribute('visibility',  'hidden');
  pupilR.setAttribute('visibility',  'hidden');
  shineL.setAttribute('visibility',  'hidden');
  shineR.setAttribute('visibility',  'hidden');

  clearTimeout(dollarTimer);
  dollarTimer = setTimeout(function() {
    dollarL.setAttribute('visibility', 'hidden');
    dollarR.setAttribute('visibility', 'hidden');
    pupilL.setAttribute('visibility',  'visible');
    pupilR.setAttribute('visibility',  'visible');
    shineL.setAttribute('visibility',  'visible');
    shineR.setAttribute('visibility',  'visible');
  }, 650);
}

// ── Init: wire up click + cursor change ──
function initDog(onClickCb) {
  dogWrap.addEventListener('click', function(e) {
    dogClickAnimation();
    onClickCb(e.clientX, e.clientY);
  });

  dogWrap.addEventListener('mouseenter', function() { cursorEl.classList.add('ring'); });
  dogWrap.addEventListener('mouseleave', function() { cursorEl.classList.remove('ring'); });
}
