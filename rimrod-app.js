// RIMROD - Sleep Cycle Calculator
// Calculates optimal sleep/wake times based on 90-minute cycles + 15 minutes to fall asleep

class RimrodApp {
    constructor() {
        this.mode = 'wake'; // 'wake' or 'sleep'
        this.settings = this.loadSettings();
this.applyTheme(this.settings.theme);

        this.init();
    }

    loadSettings() {
  const saved = JSON.parse(localStorage.getItem("rimrodSettings") || "{}");
  return {
    theme: saved.theme || "system",
    sleepLatency: Number.isFinite(saved.sleepLatency) ? saved.sleepLatency : 15,
    cycleLength: Number.isFinite(saved.cycleLength) ? saved.cycleLength : 90,
    numOptions: Number.isFinite(saved.numOptions) ? saved.numOptions : 10
  };
}

saveSettings(next) {
  this.settings = { ...this.settings, ...next };
  localStorage.setItem("rimrodSettings", JSON.stringify(this.settings));
}

applyTheme(theme) {
  // "system" = on enlève data-theme pour laisser le navigateur gérer
  if (theme === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

    init() {
        // Get DOM elements
        this.timeInput = document.getElementById('timeInput');
        this.calculateBtn = document.getElementById('calculateBtn');
        this.resultsSection = document.getElementById('resultsSection');
        this.timelineContainer = document.getElementById('timelineContainer');
        this.timeLabel = document.getElementById('timeLabel');
        this.resultsTitle = document.getElementById('resultsTitle');
        this.modeButtons = document.querySelectorAll('.mode-btn');

        // Event listeners
        this.calculateBtn.addEventListener('click', () => this.calculate());
        this.timeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.calculate();
        });

        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchMode(btn.dataset.mode));
        });

        // Settings elements
this.settingsSection = document.getElementById('settingsSection');
this.openSettingsBtn = document.getElementById('openSettingsBtn');
this.closeSettingsBtn = document.getElementById('closeSettingsBtn');

this.themeSelect = document.getElementById('themeSelect');
this.sleepLatencyInput = document.getElementById('sleepLatencyInput');
this.cycleLengthInput = document.getElementById('cycleLengthInput');
this.numOptionsInput = document.getElementById('numOptionsInput');

// Init settings UI with saved values
this.themeSelect.value = this.settings.theme;
this.sleepLatencyInput.value = this.settings.sleepLatency;
this.cycleLengthInput.value = this.settings.cycleLength;
this.numOptionsInput.value = this.settings.numOptions;

// Open/close settings
this.openSettingsBtn.addEventListener('click', () => {
  this.settingsSection.style.display = 'block';
  this.settingsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
this.closeSettingsBtn.addEventListener('click', () => {
  this.settingsSection.style.display = 'none';
});

// Save settings on change
this.themeSelect.addEventListener('change', () => {
  this.saveSettings({ theme: this.themeSelect.value });
  this.applyTheme(this.settings.theme);
});

const saveAndRecalc = () => {
  this.saveSettings({
    sleepLatency: parseInt(this.sleepLatencyInput.value || "15", 10),
    cycleLength: parseInt(this.cycleLengthInput.value || "90", 10),
    numOptions: parseInt(this.numOptionsInput.value || "10", 10)
  });
  this.calculate();
};

this.sleepLatencyInput.addEventListener('change', saveAndRecalc);
this.cycleLengthInput.addEventListener('change', saveAndRecalc);
this.numOptionsInput.addEventListener('change', saveAndRecalc);


        // Auto-calculate on load
        this.calculate();
    }

    switchMode(mode) {
        this.mode = mode;
        
        // Update active button
        this.modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Update labels
        if (mode === 'wake') {
            this.timeLabel.textContent = 'Heure de réveil';
            this.resultsTitle.textContent = 'Heures de coucher idéales';
        } else {
            this.timeLabel.textContent = 'Heure de coucher';
            this.resultsTitle.textContent = 'Heures de réveil idéales';
        }

        // Recalculate
        this.calculate();
    }

    calculate() {
        const timeValue = this.timeInput.value;
        if (!timeValue) return;

        const [hours, minutes] = timeValue.split(':').map(Number);
        const inputDate = new Date();
        inputDate.setHours(hours, minutes, 0, 0);

        let results;
        if (this.mode === 'wake') {
            results = this.calculateBedtimes(inputDate);
        } else {
            results = this.calculateWakeTimes(inputDate);
        }

        this.displayResults(results);
    }

    calculateBedtimes(wakeTime) {
  const results = [];
  const CYCLE_MINUTES = this.settings.cycleLength;
  const FALL_ASLEEP_MINUTES = this.settings.sleepLatency;

  const NUM_OPTIONS = this.settings.numOptions;

  for (let cycles = NUM_OPTIONS; cycles >= 1; cycles--) {
    const bedtime = new Date(wakeTime);
    const totalMinutes = (cycles * CYCLE_MINUTES) + FALL_ASLEEP_MINUTES;
    bedtime.setMinutes(bedtime.getMinutes() - totalMinutes);

    results.push({
      time: bedtime,
      cycles: cycles,
      recommended: cycles >= 5 && cycles <= 6
    });
  }

  return results;
}

calculateWakeTimes(bedtime) {
  const results = [];
  const CYCLE_MINUTES = this.settings.cycleLength;
  const FALL_ASLEEP_MINUTES = this.settings.sleepLatency;

  const NUM_OPTIONS = this.settings.numOptions; //

  for (let cycles = 1; cycles <= NUM_OPTIONS; cycles++) {
    const wakeTime = new Date(bedtime);
    const totalMinutes = (cycles * CYCLE_MINUTES) + FALL_ASLEEP_MINUTES;
    wakeTime.setMinutes(wakeTime.getMinutes() + totalMinutes);

    results.push({
      time: wakeTime,
      cycles: cycles,
      recommended: cycles >= 5 && cycles <= 6
    });
  }

  return results;
}


    displayResults(results) {
        // Clear previous results
        this.timelineContainer.innerHTML = '';

        // Show results section
        this.resultsSection.style.display = 'block';

        // Create timeline items
        results.forEach(result => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            if (result.recommended) {
                item.classList.add('recommended');
            }

            const timeStr = this.formatTime(result.time);
            const cyclesText = result.cycles === 1 ? 'cycle' : 'cycles';
            
            item.innerHTML = `
                <div class="timeline-time">${timeStr}</div>
                <div class="timeline-cycles">${result.cycles} ${cyclesText} de sommeil</div>
                ${result.recommended ? '<span class="recommended-badge">RECOMMANDÉ</span>' : ''}
            `;

            this.timelineContainer.appendChild(item);
        });

        // Scroll to results smoothly
        setTimeout(() => {
            this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }

    formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new RimrodApp());
} else {
    new RimrodApp();
}