// RIMROD - Sleep Cycle Calculator
// Calculates optimal sleep/wake times based on sleep cycles + sleep latency

const SLEEP_TIPS = [
  "Se coucher et se lever à heure fixe aide ton cerveau à mieux anticiper le sommeil.",
  "L’exposition à la lumière le matin améliore la qualité du sommeil le soir.",
  "L’alcool peut aider à s’endormir, mais dégrade la qualité du sommeil.",
  "Faire du sport tard peut retarder l’endormissement chez certaines personnes.",
  "Une chambre fraîche (18–19°C) favorise un sommeil plus profond.",
  "Les écrans avant le coucher peuvent retarder la production de mélatonine.",
  "Un manque de sommeil chronique affecte la mémoire et la concentration.",
  "Dormir trop longtemps peut aussi augmenter la sensation de fatigue.",
  "Les cycles de sommeil sont plus réguliers en début de nuit.",
  "Le stress augmente les micro-réveils pendant la nuit."
];

class RimrodApp {
  constructor() {
    this.mode = 'wake'; // 'wake' or 'sleep'
    this.settings = this.loadSettings();
    this.applyTheme(this.settings.theme);
    this.init();
  }

  /* ---------- TIPS ---------- */

  showRandomTip() {
    const lastIndex = parseInt(localStorage.getItem("rimrodLastTip") || "-1", 10);

    let index;
    do {
      index = Math.floor(Math.random() * SLEEP_TIPS.length);
    } while (index === lastIndex && SLEEP_TIPS.length > 1);

    localStorage.setItem("rimrodLastTip", index);

    const tipEl = document.getElementById("sleepTipText");
    if (tipEl) {
      tipEl.textContent = SLEEP_TIPS[index];
    }
  }

  /* ---------- INIT ---------- */

  init() {
    // Core elements
    this.timeInput = document.getElementById('timeInput');
    this.calculateBtn = document.getElementById('calculateBtn');
    this.resultsSection = document.getElementById('resultsSection');
    this.timelineContainer = document.getElementById('timelineContainer');
    this.timeLabel = document.getElementById('timeLabel');
    this.resultsTitle = document.getElementById('resultsTitle');
    this.modeButtons = document.querySelectorAll('.mode-btn');

    // Settings UI
    this.settingsSection = document.getElementById('settingsSection');
    this.openSettingsBtn = document.getElementById('openSettingsBtn');
    this.closeSettingsBtn = document.getElementById('closeSettingsBtn');

    this.themeSelect = document.getElementById('themeSelect');
    this.sleepLatencyInput = document.getElementById('sleepLatencyInput');
    this.cycleLengthInput = document.getElementById('cycleLengthInput');
    this.numOptionsInput = document.getElementById('numOptionsInput');

    // Profile UI
    this.ageInput = document.getElementById('ageInput');
    this.sexSelect = document.getElementById('sexSelect');
    this.activitySelect = document.getElementById('activitySelect');

    // Init UI values
    this.themeSelect.value = this.settings.theme;
    this.sleepLatencyInput.value = this.settings.sleepLatency;
    this.cycleLengthInput.value = this.settings.cycleLength;
    this.numOptionsInput.value = this.settings.numOptions;

    this.ageInput.value = this.settings.age;
    this.sexSelect.value = this.settings.sex;
    this.activitySelect.value = this.settings.activity;

    const saveAndRecalc = () => {
      this.saveSettings({
        sleepLatency: parseInt(this.sleepLatencyInput.value || "15", 10),
        cycleLength: parseInt(this.cycleLengthInput.value || "90", 10),
        numOptions: parseInt(this.numOptionsInput.value || "10", 10),
        age: parseInt(this.ageInput.value || "30", 10),
        activity: this.activitySelect.value
      });
      this.calculate();
    };

    // Events
    this.calculateBtn.addEventListener('click', () => this.calculate());
    this.timeInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') this.calculate();
    });

    this.modeButtons.forEach(btn => {
      btn.addEventListener('click', () => this.switchMode(btn.dataset.mode));
    });

    this.openSettingsBtn.addEventListener('click', () => {
      this.settingsSection.style.display = 'block';
      this.settingsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    this.closeSettingsBtn.addEventListener('click', () => {
      this.settingsSection.style.display = 'none';
    });

    this.themeSelect.addEventListener('change', () => {
      this.saveSettings({ theme: this.themeSelect.value });
      this.applyTheme(this.settings.theme);
    });

    this.sleepLatencyInput.addEventListener('change', saveAndRecalc);
    this.cycleLengthInput.addEventListener('change', saveAndRecalc);
    this.numOptionsInput.addEventListener('change', saveAndRecalc);

    this.ageInput.addEventListener('change', saveAndRecalc);
    this.activitySelect.addEventListener('change', saveAndRecalc);

    this.sexSelect.addEventListener('change', () => {
      this.saveSettings({ sex: this.sexSelect.value });
    });

    // First calculation
    this.calculate();
  }

  /* ---------- SETTINGS ---------- */

  loadSettings() {
    const saved = JSON.parse(localStorage.getItem("rimrodSettings") || "{}");

    return {
      theme: saved.theme || "system",
      sleepLatency: Number.isFinite(saved.sleepLatency) ? saved.sleepLatency : 15,
      cycleLength: Number.isFinite(saved.cycleLength) ? saved.cycleLength : 90,
      numOptions: Number.isFinite(saved.numOptions) ? saved.numOptions : 10,
      age: Number.isFinite(saved.age) ? saved.age : 30,
      sex: saved.sex || "na",
      activity: saved.activity || "moderate"
    };
  }

  saveSettings(next) {
    this.settings = { ...this.settings, ...next };
    localStorage.setItem("rimrodSettings", JSON.stringify(this.settings));
  }

  applyTheme(theme) {
    if (theme === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }

  /* ---------- CALCUL ---------- */

  calculate() {
    const timeValue = this.timeInput.value;
    if (!timeValue) return;

    const [hours, minutes] = timeValue.split(':').map(Number);
    const inputDate = new Date();
    inputDate.setHours(hours, minutes, 0, 0);

    const results =
      this.mode === 'wake'
        ? this.calculateBedtimes(inputDate)
        : this.calculateWakeTimes(inputDate);

    this.showRandomTip();
    this.displayResults(results);
  }

  switchMode(mode) {
    this.mode = mode;

    this.modeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    if (mode === 'wake') {
      this.timeLabel.textContent = 'Heure de réveil';
      this.resultsTitle.textContent = 'Heures de coucher idéales';
    } else {
      this.timeLabel.textContent = 'Heure de coucher';
      this.resultsTitle.textContent = 'Heures de réveil idéales';
    }

    this.calculate();
  }

  getRecommendedCycleRange() {
    let min = 5;
    let max = 6;

    if (this.settings.activity === "high") {
      min = 6;
      max = 7;
    }

    if (this.settings.activity === "low") {
      min = 4;
      max = 6;
    }

    if (this.settings.age >= 65) {
      min = Math.max(4, min - 1);
      max = Math.min(6, max);
    }

    return {
      min: Math.max(1, min),
      max: Math.min(this.settings.numOptions, max)
    };
  }

  calculateBedtimes(wakeTime) {
    const results = [];
    const { cycleLength, sleepLatency, numOptions } = this.settings;
    const { min, max } = this.getRecommendedCycleRange();

    for (let cycles = numOptions; cycles >= 1; cycles--) {
      const bedtime = new Date(wakeTime);
      bedtime.setMinutes(bedtime.getMinutes() - (cycles * cycleLength + sleepLatency));

      results.push({
        time: bedtime,
        cycles,
        recommended: cycles >= min && cycles <= max
      });
    }

    return results;
  }

  calculateWakeTimes(bedtime) {
    const results = [];
    const { cycleLength, sleepLatency, numOptions } = this.settings;
    const { min, max } = this.getRecommendedCycleRange();

    for (let cycles = 1; cycles <= numOptions; cycles++) {
      const wakeTime = new Date(bedtime);
      wakeTime.setMinutes(wakeTime.getMinutes() + (cycles * cycleLength + sleepLatency));

      results.push({
        time: wakeTime,
        cycles,
        recommended: cycles >= min && cycles <= max
      });
    }

    return results;
  }

  /* ---------- UI ---------- */

  displayResults(results) {
    this.timelineContainer.innerHTML = '';
    this.resultsSection.style.display = 'block';

    results.forEach(result => {
      const item = document.createElement('div');
      item.className = 'timeline-item';
      if (result.recommended) item.classList.add('recommended');

      item.innerHTML = `
        <div class="timeline-time">${this.formatTime(result.time)}</div>
        <div class="timeline-cycles">${result.cycles} cycle${result.cycles > 1 ? 's' : ''} de sommeil</div>
        ${result.recommended ? '<span class="recommended-badge">RECOMMANDÉ</span>' : ''}
      `;

      this.timelineContainer.appendChild(item);
    });

    setTimeout(() => {
      this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }

  formatTime(date) {
    return `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  }
}

/* ---------- BOOT ---------- */

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new RimrodApp());
} else {
  new RimrodApp();
}
