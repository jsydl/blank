const form = document.getElementById("profile-form");
const preview = document.getElementById("profile-json");
const commandEl = document.getElementById("cli-command");
const downloadBtn = document.getElementById("download-profile");
const downloadRunnerBtn = document.getElementById("download-runner");
const copyCmdBtn = document.getElementById("copy-command");
const weightTotalEl = document.getElementById("weight-total");
const profileNameInput = document.getElementById("profile-name");
const jsonlPathInput = document.getElementById("jsonl-path");
const profilePathLabel = document.getElementById("profile-path-label");
const csvInput = document.getElementById("csv-input");
const csvTable = document.getElementById("csv-table");

const weightSliders = [
  "w-overall",
  "w-fees",
  "w-distance",
  "w-wellbeing",
  "w-arabic",
  "w-math",
  "w-inclusion",
  "w-leadership",
  "w-curriculum",
  "w-recency",
  "w-confidence",
];

function numberOrNull(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function buildProfile() {
  const yearGroupCustom = document.getElementById("year-group-custom").value.trim();
  const yearGroupSelect = document.getElementById("year-group-select").value.trim();
  const yearGroup = yearGroupCustom || yearGroupSelect;

  const curriculumSelections = Array.from(document.querySelectorAll(".curriculum:checked")).map(
    (input) => input.value
  );

  const locationMapInput = document.getElementById("location-map").value.trim();
  let locationMap = null;
  if (locationMapInput) {
    try {
      locationMap = JSON.parse(locationMapInput);
    } catch (err) {
      locationMap = null;
    }
  }

  const preferences = {
    max_budget_aed: numberOrNull(document.getElementById("max-budget").value),
    budget_buffer_percent: numberOrNull(document.getElementById("budget-buffer-percent").value),
    budget_buffer_aed: numberOrNull(document.getElementById("budget-buffer-aed").value),
    curriculum_preference: curriculumSelections,
    strict_curriculum: document.getElementById("strict-curriculum").checked,
    min_overall_rating: document.getElementById("min-rating").value || null,
    commute_max_minutes: numberOrNull(document.getElementById("commute-max").value),
    commute_speed_kmph: numberOrNull(document.getElementById("commute-speed").value),
    location_center: {
      lat: numberOrNull(document.getElementById("home-lat").value),
      lon: numberOrNull(document.getElementById("home-lon").value),
    },
    freshness_important: true,
  };

  if (!preferences.location_center.lat || !preferences.location_center.lon) {
    preferences.location_center = null;
  }
  if (locationMap) {
    preferences.location_map = locationMap;
  }

  const mustHave = {
    must_offer_arabic: document.getElementById("must-arabic").checked,
    must_have_bus: document.getElementById("must-bus").checked,
    must_be_mixed_or_girls_only: document.getElementById("must-mixed").checked,
    must_be_in_dubai_only: document.getElementById("must-dubai").checked,
  };

  const priorities = {
    overall_quality: { weight: numberOrNull(document.getElementById("w-overall").value), strict: false },
    fees: { weight: numberOrNull(document.getElementById("w-fees").value), strict: document.getElementById("strict-fees").checked },
    distance: { weight: numberOrNull(document.getElementById("w-distance").value), strict: document.getElementById("strict-distance").checked },
    wellbeing: { weight: numberOrNull(document.getElementById("w-wellbeing").value), strict: false },
    arabic: { weight: numberOrNull(document.getElementById("w-arabic").value), strict: false },
    math: { weight: numberOrNull(document.getElementById("w-math").value), strict: false },
    inclusion_SEND: { weight: numberOrNull(document.getElementById("w-inclusion").value), strict: false },
    leadership: { weight: numberOrNull(document.getElementById("w-leadership").value), strict: false },
    curriculum_fit: { weight: numberOrNull(document.getElementById("w-curriculum").value), strict: false },
    recency: { weight: numberOrNull(document.getElementById("w-recency").value), strict: false },
    confidence: { weight: numberOrNull(document.getElementById("w-confidence").value), strict: false },
  };

  const diversity = {
    ensure: {
      budget_friendly: numberOrNull(document.getElementById("ensure-budget").value) || 0,
      stretch: numberOrNull(document.getElementById("ensure-stretch").value) || 0,
      closest: numberOrNull(document.getElementById("ensure-closest").value) || 0,
      arabic_fit: numberOrNull(document.getElementById("ensure-arabic").value) || 0,
    },
    max_share: {
      curriculum: numberOrNull(document.getElementById("max-curriculum").value),
      location: numberOrNull(document.getElementById("max-location").value),
      fee_band: numberOrNull(document.getElementById("max-fee").value),
      rating_band: numberOrNull(document.getElementById("max-rating").value),
    },
  };

  const profile = {
    student: {
      name: document.getElementById("student-name").value.trim() || null,
      age: numberOrNull(document.getElementById("student-age").value),
      year_group: yearGroup || null,
    },
    preferences,
    must_have: mustHave,
    priorities,
    diversity,
  };

  return cleanEmpty(profile);
}

function cleanEmpty(obj) {
  if (Array.isArray(obj)) {
    return obj.filter((item) => item !== null && item !== "").map(cleanEmpty);
  }
  if (obj && typeof obj === "object") {
    const cleaned = {};
    Object.entries(obj).forEach(([key, value]) => {
      const cleanedValue = cleanEmpty(value);
      const isEmptyArray = Array.isArray(cleanedValue) && cleanedValue.length === 0;
      const isEmptyObject =
        cleanedValue && typeof cleanedValue === "object" && !Array.isArray(cleanedValue) && Object.keys(cleanedValue).length === 0;
      if (
        cleanedValue === null ||
        cleanedValue === "" ||
        isEmptyArray ||
        isEmptyObject
      ) {
        return;
      }
      cleaned[key] = cleanedValue;
    });
    return cleaned;
  }
  return obj;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "profile";
}

function updateSliderValues() {
  let total = 0;
  weightSliders.forEach((id) => {
    const slider = document.getElementById(id);
    const value = parseFloat(slider.value || 0);
    total += value;
    const valueSpan = document.querySelector(`.value[data-for='${id}']`);
    if (valueSpan) {
      valueSpan.textContent = value.toFixed(2);
    }
  });
  weightTotalEl.textContent = total.toFixed(2);
}

function updateOutputs() {
  updateSliderValues();
  const profile = buildProfile();
  preview.textContent = JSON.stringify(profile, null, 2);
  const profileName = slugify(profileNameInput.value.trim());
  const inputPath = jsonlPathInput.value.trim() || "data/raw/khda_schools_YYYYMMDD_HHMMSS.jsonl";
  const profilePath = `outputs/profiles/${profileName}.json`;
  profilePathLabel.textContent = profilePath;
  const outputBase = `outputs/filtered/${profileName}`;
  const command = `python filter_schools.py --input ${inputPath} --profile ${profilePath} --output ${outputBase}.json --output-jsonl ${outputBase}.filtered.jsonl --output-csv ${outputBase}.filtered.csv --explain outputs/reports/${profileName}.md`;
  commandEl.textContent = command;
}

function downloadProfile() {
  const profile = buildProfile();
  const profileName = slugify(profileNameInput.value.trim());
  const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${profileName}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function downloadRunner() {
  const command = commandEl.textContent.trim();
  if (!command) return;
  let runCmd = command.replace(/^python(\.exe)?\s+/i, "%PYTHON% ");
  const lines = [
    "@echo off",
    "setlocal",
    "set SCRIPT_DIR=%~dp0",
    "pushd %SCRIPT_DIR%",
    "set PYTHON=",
    "if exist .venv\\Scripts\\python.exe set PYTHON=.venv\\Scripts\\python.exe",
    "if \"%PYTHON%\"==\"\" set PYTHON=python",
    runCmd,
    "echo.",
    "echo Done. Press any key to exit.",
    "pause",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "run_filter.bat";
  link.click();
  URL.revokeObjectURL(link.href);
}

function copyCommand() {
  const text = commandEl.textContent.trim();
  if (!text) return;
  navigator.clipboard.writeText(text).catch(() => {});
}

function parseCSV(text) {
  const rows = [];
  let current = "";
  let insideQuotes = false;
  let row = [];
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"' && text[i + 1] === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }
    if (char === "," && !insideQuotes) {
      row.push(current);
      current = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && text[i + 1] === "\n") {
        i += 1;
      }
      row.push(current);
      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }
    current += char;
  }
  if (current || row.length) {
    row.push(current);
    rows.push(row);
  }
  return rows;
}

function renderCSV(rows) {
  csvTable.innerHTML = "";
  if (!rows.length) return;
  const header = rows[0];
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  header.forEach((cell) => {
    const th = document.createElement("th");
    th.textContent = cell;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  csvTable.appendChild(thead);

  const tbody = document.createElement("tbody");
  rows.slice(1, 21).forEach((row) => {
    const tr = document.createElement("tr");
    header.forEach((_, idx) => {
      const td = document.createElement("td");
      td.textContent = row[idx] || "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  csvTable.appendChild(tbody);
}

function handleCSVUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const rows = parseCSV(String(e.target.result || ""));
    renderCSV(rows);
  };
  reader.readAsText(file);
}

form.addEventListener("input", updateOutputs);
profileNameInput.addEventListener("input", updateOutputs);
jsonlPathInput.addEventListener("input", updateOutputs);
downloadBtn.addEventListener("click", downloadProfile);
downloadRunnerBtn.addEventListener("click", downloadRunner);
copyCmdBtn.addEventListener("click", copyCommand);
csvInput.addEventListener("change", handleCSVUpload);

updateOutputs();
