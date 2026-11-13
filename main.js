/* ==========================================================================
   LUMEN STUDIO - Interactive Bilingual & Booking Engine (js/main.js)
   Course: WEB Application Development (MGIS 372) - Jazan University
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Language Switcher (English <-> Arabic with RTL/LTR persistence)
  const savedLang = localStorage.getItem('lumen_lang') || 'en';
  applyLanguage(savedLang);

  const langBtn = document.getElementById('langSwitchBtn');
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      const currentLang = document.documentElement.getAttribute('lang') || 'en';
      const nextLang = currentLang === 'en' ? 'ar' : 'en';
      applyLanguage(nextLang);
    });
  }

  // 2. Studios Page Category Filter & Search
  initStudioFilters();

  // 3. Booking Page Live Calculator, URL Pre-select & RGB Lighting Preview
  initBookingSystem();
});

/**
 * Switches all elements with [data-en] / [data-ar] and updates dir="rtl" / "ltr"
 */
function applyLanguage(lang) {
  const htmlEl = document.documentElement;
  htmlEl.setAttribute('lang', lang);
  htmlEl.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  localStorage.setItem('lumen_lang', lang);

  // Update text content
  document.querySelectorAll('[data-en][data-ar]').forEach(el => {
    const val = lang === 'ar' ? el.getAttribute('data-ar') : el.getAttribute('data-en');
    if (el.hasAttribute('data-html')) {
      el.innerHTML = val;
    } else {
      el.textContent = val;
    }
  });

  // Update input placeholders
  document.querySelectorAll('[data-en-placeholder][data-ar-placeholder]').forEach(el => {
    el.setAttribute(
      'placeholder',
      lang === 'ar' ? el.getAttribute('data-ar-placeholder') : el.getAttribute('data-en-placeholder')
    );
  });

  // Update language button label
  const langLabel = document.getElementById('langBtnText');
  if (langLabel) {
    langLabel.textContent = lang === 'ar' ? 'English (EN)' : 'العربية (AR)';
  }

  // Refresh booking calculator labels if on booking page
  if (typeof updateBookingSummary === 'function') {
    updateBookingSummary();
  }
}

/**
 * Studio Catalog Filtering & Live Search (studios.html)
 */
function initStudioFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const studioCards = document.querySelectorAll('.studio-item-card');
  const searchInput = document.getElementById('studioSearchInput');

  if (!studioCards.length) return;

  let activeCategory = 'all';

  function filterCatalog() {
    const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
    studioCards.forEach(card => {
      const cat = card.getAttribute('data-category');
      const text = card.textContent.toLowerCase();
      const matchesCat = activeCategory === 'all' || cat === activeCategory;
      const matchesSearch = !query || text.includes(query);

      card.style.display = matchesCat && matchesSearch ? 'flex' : 'none';
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-filter');
      filterCatalog();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', filterCatalog);
  }
}

/**
 * Interactive Studio Booking System (booking.html)
 */
let updateBookingSummary = null;

function initBookingSystem() {
  const bookingForm = document.getElementById('studioBookingForm');
  if (!bookingForm) return;

  const studioSelect = document.getElementById('studioSelect');
  const hoursInput = document.getElementById('hoursInput');
  const dateInput = document.getElementById('bookingDate');
  const lightingRange = document.getElementById('lightingIntensity');
  const lightingValOut = document.getElementById('lightingValOut');
  const colorPicker = document.getElementById('backdropColor');
  const colorOrb = document.getElementById('lightingPreviewOrb');
  const colorHexText = document.getElementById('colorHexText');
  const ambientOverlay = document.getElementById('rgbAmbientOverlay');
  const previewImg = document.getElementById('summaryStudioImg');
  const studentCheck = document.getElementById('jazanStudentDiscount');
  const gearCheckboxes = document.querySelectorAll('.gear-addon-check');

  // Set default date to tomorrow
  if (dateInput && !dateInput.value) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.value = tomorrow.toISOString().split('T')[0];
  }

  // Pre-select studio from URL query param (?studio=podcast)
  const params = new URLSearchParams(window.location.search);
  const preselected = params.get('studio');
  if (preselected && studioSelect) {
    for (let i = 0; i < studioSelect.options.length; i++) {
      if (studioSelect.options[i].value === preselected) {
        studioSelect.selectedIndex = i;
        break;
      }
    }
  }

  const studioImages = {
    'apex-photo': 'images/photo-studio-1.jpg',
    'voxpro-podcast': 'images/podcast-studio-1.jpg',
    'neon-creative': 'images/creative-studio-1.jpg',
    'daylight-cyc': 'images/cyclorama-studio.jpg',
    'soundwave-audio': 'images/audio-studio.jpg',
    'cinema-stage': 'images/cinema-studio.jpg'
  };

  updateBookingSummary = function () {
    const lang = document.documentElement.getAttribute('lang') || 'en';
    const cur = lang === 'ar' ? 'ر.س' : 'SAR';

    const selectedOpt = studioSelect.options[studioSelect.selectedIndex];
    const rate = parseFloat(selectedOpt.getAttribute('data-rate') || '250');
    const studioKey = selectedOpt.value;
    const hours = Math.max(1, parseInt(hoursInput.value || '2', 10));

    // Update studio preview image
    if (previewImg && studioImages[studioKey]) {
      previewImg.src = studioImages[studioKey];
    }

    // Calculate add-ons
    let addonsTotal = 0;
    gearCheckboxes.forEach(cb => {
      if (cb.checked) {
        addonsTotal += parseFloat(cb.getAttribute('data-price') || '0');
      }
    });

    const baseCost = rate * hours;
    const subtotal = baseCost + addonsTotal;
    const isStudent = studentCheck && studentCheck.checked;
    const discount = isStudent ? Math.round(subtotal * 0.25) : 0;
    const finalTotal = subtotal - discount;

    // Update DOM summary
    const elStudioName = document.getElementById('sumStudioName');
    const elRateHours = document.getElementById('sumRateHours');
    const elBaseCost = document.getElementById('sumBaseCost');
    const elAddonsCost = document.getElementById('sumAddonsCost');
    const elDiscountCost = document.getElementById('sumDiscountCost');
    const elFinalTotal = document.getElementById('sumFinalTotal');

    if (elStudioName) elStudioName.textContent = selectedOpt.textContent;
    if (elRateHours) elRateHours.textContent = `${rate} ${cur} × ${hours}h`;
    if (elBaseCost) elBaseCost.textContent = `${baseCost} ${cur}`;
    if (elAddonsCost) elAddonsCost.textContent = `+${addonsTotal} ${cur}`;
    if (elDiscountCost) elDiscountCost.textContent = `-${discount} ${cur}`;
    if (elFinalTotal) elFinalTotal.textContent = `${finalTotal} ${cur}`;
  };

  // Event listeners for live calculation
  studioSelect.addEventListener('change', updateBookingSummary);
  hoursInput.addEventListener('input', updateBookingSummary);
  if (studentCheck) studentCheck.addEventListener('change', updateBookingSummary);
  gearCheckboxes.forEach(cb => cb.addEventListener('change', updateBookingSummary));

  // Range slider listener
  if (lightingRange && lightingValOut) {
    lightingRange.addEventListener('input', () => {
      lightingValOut.textContent = `${lightingRange.value}%`;
    });
  }

  // RGB Backdrop Color Picker listener
  if (colorPicker) {
    colorPicker.addEventListener('input', () => {
      const hex = colorPicker.value;
      if (colorOrb) {
        colorOrb.style.background = hex;
        colorOrb.style.boxShadow = `0 0 18px ${hex}`;
      }
      if (colorHexText) {
        colorHexText.textContent = hex.toUpperCase();
      }
      if (ambientOverlay) {
        ambientOverlay.style.background = `radial-gradient(circle at 80% 20%, ${hex}88, transparent 68%)`;
      }
    });
  }

  // Form Submit Confirmation Modal
  const modal = document.getElementById('bookingSuccessModal');
  const closeModalBtn = document.getElementById('closeModalBtn');

  bookingForm.addEventListener('submit', e => {
    e.preventDefault();
    const clientName = document.getElementById('clientName').value;
    const refCode = 'LMN-' + Math.floor(100000 + Math.random() * 900000);
    const refEl = document.getElementById('modalBookingRef');
    const nameEl = document.getElementById('modalClientName');
    if (refEl) refEl.textContent = refCode;
    if (nameEl) nameEl.textContent = clientName;
    if (modal) modal.classList.add('show');
  });

  bookingForm.addEventListener('reset', () => {
    setTimeout(updateBookingSummary, 50);
  });

  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', () => {
      modal.classList.remove('show');
    });
  }

  updateBookingSummary();
}
