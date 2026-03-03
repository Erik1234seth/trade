/* ═══════════════════════════════════════
   dog.js — Interact button handler
   (interact button removed; null-safe)
   ═══════════════════════════════════════ */

var dogWrap   = document.getElementById('dog-wrap');
var speechBub = document.getElementById('speech-bubble');

var PHRASES = [
  'farming...', 'eligible!', 'gm ser', 'LFG!',
  'ngmi → wagmi', 'snapshot?', 'aping in', 'based',
  'early adopter', 'IYKYK', 'ser please', 'degen move'
];
var phraseIdx = 0;
var speechTimer = null;
var clickTimer  = null;

function initDog(onClickCb) {
  var btn = document.getElementById('interact-btn');
  if (!btn) return; // interact button removed from layout

  btn.addEventListener('click', function(e) {
    if (speechBub) {
      clearTimeout(speechTimer);
      speechBub.textContent = PHRASES[phraseIdx % PHRASES.length];
      phraseIdx++;
      speechBub.classList.add('show');
      speechTimer = setTimeout(function() { speechBub.classList.remove('show'); }, 1100);
    }

    if (dogWrap) {
      dogWrap.classList.add('clicked');
      clearTimeout(clickTimer);
      clickTimer = setTimeout(function() { dogWrap.classList.remove('clicked'); }, 130);
    }

    onClickCb(e.clientX, e.clientY);
  });

  if (dogWrap) {
    dogWrap.addEventListener('mouseenter', function() { if (cursorEl) cursorEl.classList.add('ring'); });
    dogWrap.addEventListener('mouseleave', function() { if (cursorEl) cursorEl.classList.remove('ring'); });
  }
}
