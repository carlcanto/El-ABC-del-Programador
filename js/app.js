(function () {
  'use strict';

  const slides = document.querySelectorAll('.slide');
  const totalSlides = slides.length;
  let current = 0;
  let transitioning = false;
  let presenterWindow = null;

  const channel = new BroadcastChannel('abc-presentacion');

  const keyboardHint = document.querySelector('.keyboard-hint');
  const progress = document.querySelector('.progress');
  const slideCounter = document.querySelector('.slide-counter');
  const navArrows = document.querySelector('.nav-arrows');
  const sideNav = document.querySelector('.side-nav');
  const presenterMode = new URLSearchParams(window.location.search).has('presenter');

  // ===== PRESENTER MODE =====
  if (presenterMode) {
    document.body.classList.add('presenter');
    document.querySelector('.presentation').style.display = 'none';
    document.querySelector('.side-nav').style.display = 'none';
    document.querySelector('.progress').style.display = 'none';
    document.querySelector('.keyboard-hint').style.display = 'none';
    document.querySelector('.slide-counter').style.display = 'none';
    document.querySelector('.nav-arrows').style.display = 'none';

    channel.postMessage('sync-request');
    document.querySelector('.presenter-layout').style.display = 'flex';

    channel.onmessage = function (e) {
      if (e.data && e.data.type === 'sync') {
        updatePresenter(e.data.current, e.data.total, e.data.notes);
      }
    };

    function updatePresenter(index, total, notes) {
      const currentSlideEl = slides[index];
      const nextIndex = Math.min(index + 1, total - 1);
      const nextSlideEl = slides[nextIndex];

      // Current slide preview
      const currentPreview = document.getElementById('preview-current-content');
      const nextPreview = document.getElementById('preview-next-content');
      if (currentPreview && currentSlideEl) {
        const clone = currentSlideEl.querySelector('.slide-inner').cloneNode(true);
        clone.querySelectorAll('.entry-fade, .entry-up, .entry-zoom').forEach(function (el) {
          el.style.opacity = '1';
          el.style.transform = 'none';
          el.style.animation = 'none';
        });
        currentPreview.innerHTML = '';
        currentPreview.appendChild(clone);
        currentPreview.style.display = 'flex';
        currentPreview.style.alignItems = 'center';
        currentPreview.style.justifyContent = 'center';
      }

      if (nextPreview && nextSlideEl) {
        const clone = nextSlideEl.querySelector('.slide-inner').cloneNode(true);
        clone.querySelectorAll('.entry-fade, .entry-up, .entry-zoom').forEach(function (el) {
          el.style.opacity = '1';
          el.style.transform = 'none';
          el.style.animation = 'none';
        });
        nextPreview.innerHTML = '';
        nextPreview.appendChild(clone);
        nextPreview.style.display = 'flex';
        nextPreview.style.alignItems = 'center';
        nextPreview.style.justifyContent = 'center';
      }

      // Timer
      const timerEl = document.querySelector('.timer');
      if (timerEl && !timerEl.dataset.started) {
        timerEl.dataset.started = 'true';
        startTimer(timerEl);
      }

      // Notes
      const notesEl = document.querySelector('.notes-text');
      if (notesEl) {
        notesEl.textContent = notes || 'Sin notas para esta diapositiva.';
      }
    }

    function startTimer(el) {
      const start = Date.now();
      el.classList.add('running');
      setInterval(function () {
        const elapsed = Math.floor((Date.now() - start) / 1000);
        const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const s = String(elapsed % 60).padStart(2, '0');
        el.textContent = m + ':' + s;
      }, 1000);
    }

    return;
  }

  // ===== MAIN PRESENTATION =====
  // Build side nav
  if (sideNav) {
    slides.forEach(function (slide, i) {
      const a = document.createElement('a');
      a.href = '#' + slide.id;
      a.dataset.index = i;
      a.dataset.title = (slide.dataset.title || '') + '';
      a.addEventListener('click', function (e) {
        e.preventDefault();
        goTo(i);
      });
      sideNav.appendChild(a);
    });
    // Remove placeholder dots
    sideNav.querySelectorAll('a').forEach(function (a, i) {
      if (i >= totalSlides) a.remove();
    });
  }

  const allDots = sideNav ? sideNav.querySelectorAll('a') : [];

  // Arrow buttons
  const prevBtn = document.querySelector('.nav-prev');
  const nextBtn = document.querySelector('.nav-next');
  if (prevBtn) prevBtn.addEventListener('click', function () { prev(); });
  if (nextBtn) nextBtn.addEventListener('click', function () { next(); });

  // Keyboard hint auto-hide after first interaction
  let hintHidden = false;
  function hideHint() {
    if (!hintHidden) {
      keyboardHint && keyboardHint.classList.remove('visible');
      hintHidden = true;
    }
  }

  setTimeout(function () {
    keyboardHint && keyboardHint.classList.add('visible');
  }, 2000);

  // ===== NAVIGATION =====
  function goTo(index) {
    if (transitioning) return;
    if (index === current) return;
    if (index < 0 || index >= totalSlides) return;

    transitioning = true;
    hideHint();

    // Remove active from all
    slides.forEach(function (s) { s.classList.remove('active'); });

    // Re-trigger animations by removing and re-adding
    // Actually, just add active to new slide
    current = index;
    slides[current].classList.add('active');

    updateUI();

    broadcastState();

    setTimeout(function () { transitioning = false; }, 400);
  }

  function next() {
    if (current < totalSlides - 1) goTo(current + 1);
  }

  function prev() {
    if (current > 0) goTo(current - 1);
  }

  // ===== UI UPDATES =====
  function updateUI() {
    // Progress bar
    if (progress) {
      var pct = ((current + 1) / totalSlides) * 100;
      progress.style.width = pct + '%';
    }

    // Slide counter
    if (slideCounter) {
      slideCounter.textContent = String(current + 1).padStart(2, '0') + ' / ' + String(totalSlides).padStart(2, '0');
      slideCounter.classList.add('visible');
    }

    // Nav arrows visibility
    navArrows && navArrows.classList.add('visible');

    // Side nav dots
    allDots.forEach(function (dot, i) {
      dot.classList.toggle('active', i === current);
    });

    // Arrow button states
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current === totalSlides - 1;

    // Update hash
    if (slides[current]) {
      history.replaceState(null, '', '#' + slides[current].id);
    }
  }

  // ===== BROADCAST =====
  function broadcastState() {
    var notes = slides[current] ? (slides[current].dataset.notes || '') : '';
    channel.postMessage({
      type: 'sync',
      current: current,
      total: totalSlides,
      notes: notes
    });
  }

  // Listen for sync requests from presenter
  channel.onmessage = function (e) {
    if (e.data === 'sync-request') {
      broadcastState();
    }
  };

  // ===== KEYBOARD =====
  document.addEventListener('keydown', function (e) {
    var key = e.key;

    if (key === 'ArrowDown' || key === 'ArrowRight' || key === ' ') {
      e.preventDefault();
      next();
    } else if (key === 'ArrowUp' || key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    } else if (key === 'Home') {
      e.preventDefault();
      goTo(0);
    } else if (key === 'End') {
      e.preventDefault();
      goTo(totalSlides - 1);
    } else if (key === 'p' || key === 'P') {
      e.preventDefault();
      togglePresenter();
    }
  });

  // ===== SCROLL WHEEL =====
  let scrollTimeout = null;
  document.addEventListener('wheel', function (e) {
    e.preventDefault();
    if (scrollTimeout) return;
    scrollTimeout = true;
    if (e.deltaY > 0) {
      next();
    } else {
      prev();
    }
    setTimeout(function () { scrollTimeout = false; }, 600);
  }, { passive: false });

  // ===== TOUCH SUPPORT =====
  let touchStartY = 0;
  document.addEventListener('touchstart', function (e) {
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  document.addEventListener('touchend', function (e) {
    var diff = touchStartY - e.changedTouches[0].screenY;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  }, { passive: true });

  // ===== PRESENTER WINDOW =====
  function togglePresenter() {
    if (presenterWindow && !presenterWindow.closed) {
      presenterWindow.focus();
      return;
    }
    presenterWindow = window.open(
      window.location.href.split('?')[0].split('#')[0] + '?presenter',
      'presenter',
      'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no'
    );
    // Broadcast state immediately
    setTimeout(broadcastState, 500);
  }

  // ===== WORKSHOP TABS (Slide 19) =====
  var tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = btn.dataset.tab;
      // Update buttons
      tabBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      // Update content
      document.querySelectorAll('.tab-content').forEach(function (c) {
        c.classList.remove('active');
      });
      var targetContent = document.getElementById('tab-' + target);
      if (targetContent) targetContent.classList.add('active');
    });
  });

  // ===== COPY BUTTONS =====
  document.querySelectorAll('.cmd-block').forEach(function (block) {
    var copyBtn = block.querySelector('.copy-btn');
    if (!copyBtn) return;
    copyBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var text = block.querySelector('.cmd-text');
      if (!text) return;
      var cmd = text.textContent.trim();

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(cmd).then(function () {
          showCopied(block);
        });
      } else {
        // Fallback
        var ta = document.createElement('textarea');
        ta.value = cmd;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showCopied(block);
      }
    });
  });

  function showCopied(block) {
    block.classList.add('copied');
    var svg = block.querySelector('.copy-btn svg');
    if (svg) {
      var original = svg.innerHTML;
      svg.innerHTML = '<polyline points="20 6 9 17 4 12" style="fill:none;stroke:#10B981;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"/>';
      setTimeout(function () {
        svg.innerHTML = original;
        block.classList.remove('copied');
      }, 1800);
    } else {
      setTimeout(function () {
        block.classList.remove('copied');
      }, 1800);
    }
  }

  // ===== TYPEWRITER EFFECT FOR SLIDE 11 =====
  var typewriterSlide = document.getElementById('slide-11');
  if (typewriterSlide) {
    var observer = new MutationObserver(function () {
      if (typewriterSlide.classList.contains('active')) {
        triggerTypewriter();
        observer.disconnect();
      }
    });
    observer.observe(typewriterSlide, { attributes: true, attributeFilter: ['class'] });
  }

  function triggerTypewriter() {
    var lines = document.querySelectorAll('#slide-11 .cmd-line[data-cmd]');
    if (!lines.length) return;

    lines.forEach(function (line, idx) {
      var cmdEl = line.querySelector('.cmd');
      if (!cmdEl) return;
      var fullCmd = cmdEl.textContent;
      cmdEl.textContent = '';
      cmdEl.style.display = 'inline';

      var typeDelay = 500 + idx * 600;
      setTimeout(function () {
        typeChar(cmdEl, fullCmd, 0, function () {
          // Show cursor blink after typing
          var cursor = line.querySelector('.cursor-blink');
          if (cursor) cursor.style.display = 'inline-block';
          // Show output if exists
          var output = line.querySelector('.output');
          if (output) {
            setTimeout(function () {
              output.style.display = 'inline';
            }, 200);
          }
        });
      }, typeDelay);
    });
  }

  function typeChar(el, text, index, callback) {
    if (index < text.length) {
      el.textContent += text.charAt(index);
      setTimeout(function () {
        typeChar(el, text, index + 1, callback);
      }, 30 + Math.random() * 20);
    } else if (callback) {
      callback();
    }
  }

  // ===== BRANCH ANIMATION FOR SLIDE 8 =====
  var branchSlide = document.getElementById('slide-08');
  if (branchSlide) {
    var branchObserver = new MutationObserver(function () {
      if (branchSlide.classList.contains('active')) {
        animateBranches();
        branchObserver.disconnect();
      }
    });
    branchObserver.observe(branchSlide, { attributes: true, attributeFilter: ['class'] });
  }

  function animateBranches() {
    var dots = document.querySelectorAll('#slide-08 .branch-dot');
    dots.forEach(function (dot, i) {
      dot.style.opacity = '0';
      dot.style.transform = 'scale(0)';
      setTimeout(function () {
        dot.style.opacity = '1';
        dot.style.transform = 'scale(1)';
        dot.style.transition = 'all 0.4s cubic-bezier(0.22,1,0.36,1)';
      }, 200 + i * 120);
    });

    var connectors = document.querySelectorAll('#slide-08 .branch-connector');
    connectors.forEach(function (conn, i) {
      conn.style.transform = 'scaleY(0)';
      conn.style.transformOrigin = 'top';
      setTimeout(function () {
        conn.style.transform = 'scaleY(1)';
        conn.style.transition = 'transform 0.3s cubic-bezier(0.22,1,0.36,1)';
      }, 300 + i * 100);
    });
  }

  // ===== GLITCH TRIGGER FOR SLIDE 12 =====
  var glitchSlide = document.getElementById('slide-12');
  if (glitchSlide) {
    var glitchObserver = new MutationObserver(function () {
      if (glitchSlide.classList.contains('active')) {
        var screens = glitchSlide.querySelectorAll('.machine.fails .machine-icon');
        screens.forEach(function (s) {
          s.classList.add('screen-glitch');
        });
        glitchObserver.disconnect();
      }
    });
    glitchObserver.observe(glitchSlide, { attributes: true, attributeFilter: ['class'] });
  }

  // ===== KINETIC FLOW ANIMATION FOR SLIDE 18 =====
  var kineticSlide = document.getElementById('slide-18');
  if (kineticSlide) {
    var kineticObserver = new MutationObserver(function () {
      if (kineticSlide.classList.contains('active')) {
        animateKineticFlow();
        kineticObserver.disconnect();
      }
    });
    kineticObserver.observe(kineticSlide, { attributes: true, attributeFilter: ['class'] });
  }

  function animateKineticFlow() {
    var items = document.querySelectorAll('#slide-18 .flow-item');
    items.forEach(function (item, i) {
      item.style.opacity = '0';
      item.style.transform = 'translateY(20px)';
      setTimeout(function () {
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
        item.style.transition = 'all 0.5s cubic-bezier(0.22,1,0.36,1)';
      }, 300 + i * 200);
    });

    var arrows = document.querySelectorAll('#slide-18 .flow-arrow-down');
    arrows.forEach(function (arrow, i) {
      arrow.style.opacity = '0';
      setTimeout(function () {
        arrow.style.opacity = '1';
        arrow.style.transition = 'opacity 0.3s ease';
      }, 500 + i * 200);
    });
  }

  // ===== INIT =====
  function init() {
    // Activate first slide
    slides.forEach(function (s) { s.classList.remove('active'); });
    current = 0;
    slides[0].classList.add('active');

    // Check hash for direct navigation
    var hash = window.location.hash;
    if (hash) {
      var targetSlide = document.querySelector(hash);
      if (targetSlide) {
        var idx = Array.from(slides).indexOf(targetSlide);
        if (idx >= 0) {
          slides[0].classList.remove('active');
          current = idx;
          slides[idx].classList.add('active');
        }
      }
    }

    updateUI();

    // Remove initial opacity from HTML (entry animations handle it)
    setTimeout(function () {
      // Ensure first slide's content is visible
      updateUI();
    }, 100);

    // Remove any leftover placeholder dots from sideNav template
    if (sideNav) {
      var dots = sideNav.querySelectorAll('a');
      if (dots.length > totalSlides) {
        for (var i = totalSlides; i < dots.length; i++) {
          dots[i].remove();
        }
      }
    }
  }

  init();
})();
