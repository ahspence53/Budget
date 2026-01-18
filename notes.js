const NOTES_KEY = "diaryNotes";

const dateInput = document.getElementById("note-date");
const textArea  = document.getElementById("note-text");
const saveBtn   = document.getElementById("save-note");
const clearBtn  = document.getElementById("clear-note");
const deleteBtn = document.getElementById("delete-note");
const notesList = document.getElementById("notes-list");
const searchInput = document.getElementById("search-notes");
const currentDate = new Date().toISOString().split('T')[0];



// ---------------- storage helpers ----------------
function getNotes() {
  return JSON.parse(localStorage.getItem(NOTES_KEY)) || {};
}

function saveNotes(notes) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

// ---------------- init date ----------------
const params = new URLSearchParams(window.location.search);
const preselectedDate = params.get("date");
const today = new Date().toISOString().slice(0, 10);

dateInput.value = preselectedDate || today;
textArea.value = getNotes()[dateInput.value] || "";

// ---------------- render list ----------------
function renderNotesList(filter = "") {
  notesList.innerHTML = "";
  const notes = getNotes();

  Object.keys(notes)
    .sort()
    .forEach(date => {
      const text = notes[date] || "";

      if (filter && !text.toLowerCase().includes(filter)) return;

      // 🔹 create short preview
      const preview = text
        .replace(/\n+/g, " ")
        .trim()
        .slice(0, 40);

      const li = document.createElement("li");
      li.textContent =
        date + (preview ? " — " + preview + "…" : "");

      li.style.cursor = "pointer";
      li.style.fontSize = "1.1rem";

      li.onclick = () => {
        dateInput.value = date;
        textArea.value = notes[date];
        localStorage.setItem("diaryReturnIso", date);
      };

      notesList.appendChild(li);
    });
}

// ---------------- events ----------------
saveBtn.onclick = () => {
  const date = dateInput.value;
  const text = textArea.value.trim();
  if (!date || !text) return alert("Choose a date and enter a note");

  const notes = getNotes();
  notes[date] = text;
  saveNotes(notes);
  markDiaryUpdated();
  renderNotesList();
  alert("Note saved");
};

clearBtn.onclick = () => {
  textArea.value = "";
};

deleteBtn.onclick = () => {
  const date = dateInput.value;
  if (!date) return;
  if (!confirm(`Delete note for ${date}?`)) return;

  const notes = getNotes();
  delete notes[date];
  saveNotes(notes);
  textArea.value = "";
  markDiaryUpdated();
  renderNotesList();
};

dateInput.addEventListener("change", () => {
  const notes = getNotes();
  textArea.value = notes[dateInput.value] || "";
});
// ---------------
function markDiaryUpdated() {
  localStorage.setItem("diaryUpdated", Date.now());
}
// ---------------- autosave ----------------
let autosaveTimer = null;

textArea.addEventListener("input", () => {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    const date = dateInput.value;
    const text = textArea.value.trim();
    if (!date || !text) return;

    const notes = getNotes();
    notes[date] = text;
    saveNotes(notes);
    markDiaryUpdated();
    renderNotesList();
    if (window.opener && window.opener.renderProjectionTable) {
  window.opener.renderProjectionTable();
}
  }, 600);
});

// ---------------- search ----------------
searchInput.addEventListener("input", () => {
  renderNotesList(searchInput.value.trim().toLowerCase());
});

// ---------------- export helpers ----------------
function download(filename, content) {
  const blob = new Blob(
    [content],
    { type: "application/json" }
  );

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();

  URL.revokeObjectURL(a.href);
}

document.getElementById("export-txt").onclick = () => {
  const notes = getNotes();
  let out = "";
  Object.keys(notes).sort().forEach(d => {
    out += `=== ${d} ===\n${notes[d]}\n\n`;
  });
  download("diary-notes.txt", out);
};

document.getElementById("export-csv").onclick = () => {
  const notes = getNotes();
  let csv = "Date,Note\n";
  Object.keys(notes).sort().forEach(d => {
    csv += `"${d}","${notes[d].replace(/"/g,'""')}"\n`;
  });
  download("diary-notes.csv", csv);
};

document.getElementById("backup-notes").onclick = () => {
  download(`diary-backup${currentDate}.json`, JSON.stringify(getNotes(), null, 2));
};

document.getElementById("restore-notes").addEventListener("change", e => {
  const file = e.target.files[0];
    // ✅ Filename guard
  if (!file.name.toLowerCase().startsWith("diary")) {
    alert(
      `Wrong file selected.\n\nExpected a diary backup file.\n\nYou selected:\n${file.name}`
    );
    e.target.value = ""; // reset file input
    return;
  }
  if (!file) return;




  const reader = new FileReader();
  reader.onload = () => {
    try {
      saveNotes(JSON.parse(reader.result));
      renderNotesList();
      alert("Diary restored");
    } catch {
      alert("Invalid backup file");
    }
  };
  reader.readAsText(file);
});

// ---------------- init ----------------
renderNotesList();
