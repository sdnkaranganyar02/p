const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const splash = document.querySelector("[data-splash]");
const registrationForm = document.querySelector("[data-registration-form]");
const registrationStatus = document.querySelector("[data-registration-status]");
const registrationToken = document.querySelector("[data-registration-token]");
const graduationForm = document.querySelector("[data-graduation-form]");
const graduationResult = document.querySelector("[data-graduation-result]");
const scheduleClassSelect = document.querySelector("[data-schedule-class]");
const scheduleDaySelect = document.querySelector("[data-schedule-day]");
const scheduleRefreshButton = document.querySelector("[data-schedule-refresh]");
const scheduleList = document.querySelector("[data-schedule-list]");
const scheduleStatus = document.querySelector("[data-schedule-status]");
const modalOpenButtons = document.querySelectorAll("[data-modal-open]");
const modalCloseButtons = document.querySelectorAll("[data-modal-close]");
const modals = document.querySelectorAll("[data-modal]");
const messageboxBackdrop = document.querySelector("[data-messagebox]");
const messageboxDialog = messageboxBackdrop.querySelector(".messagebox");
const messageboxIcon = document.querySelector("[data-messagebox-icon]");
const messageboxTitle = document.querySelector("[data-messagebox-title]");
const messageboxMessage = document.querySelector("[data-messagebox-message]");
const messageboxCloseButton = document.querySelector("[data-messagebox-close]");

const GOOGLE_SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzje0cYobLUZCDcUQfanrbsByfFjB4r9M9QVDqiXRZE82nmHOOAenvktX1c2osFd4r5/exec";
const GOOGLE_SHEETS_FORM_TOKEN = "";
let modalReturnFocus = null;
let messageboxReturnFocus = null;

function syncHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 8);
}

function closeNav() {
  nav.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
}

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

navToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

nav.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    closeNav();
  }
});

function hideSplash() {
  splash.classList.add("is-hidden");
  document.body.classList.remove("is-loading");
}

window.addEventListener("load", () => {
  window.setTimeout(hideSplash, 550);
});

window.setTimeout(hideSplash, 2200);

function getOpenModal() {
  return Array.from(modals).find((modal) => !modal.hidden);
}

function isMessageBoxOpen() {
  return messageboxBackdrop && !messageboxBackdrop.hidden;
}

function openModal(modalId, trigger) {
  const modal = document.querySelector(`[data-modal="${modalId}"]`);

  if (!modal) {
    return;
  }

  modalReturnFocus = trigger;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  closeNav();

  window.requestAnimationFrame(() => {
    const dialog = modal.querySelector(".modal-dialog");
    dialog.focus();
  });
}

function closeModal(modal = getOpenModal(), options = {}) {
  if (!modal) {
    return;
  }

  modal.hidden = true;
  if (!isMessageBoxOpen()) {
    document.body.classList.remove("modal-open");
  }

  if (modalReturnFocus) {
    if (options.restoreFocus !== false) {
      modalReturnFocus.focus();
    }
    modalReturnFocus = null;
  }
}

function showMessageBox({ title, message, type = "success", icon = "check_circle" }) {
  messageboxReturnFocus = document.activeElement;
  messageboxDialog.classList.remove("is-success", "is-error", "is-warning", "is-info");
  messageboxDialog.classList.add(`is-${type}`);
  messageboxIcon.textContent = icon;
  messageboxTitle.textContent = title;
  messageboxMessage.textContent = message;
  messageboxBackdrop.hidden = false;
  document.body.classList.add("modal-open");
  messageboxDialog.focus();
}

function closeMessageBox() {
  messageboxBackdrop.hidden = true;

  if (!getOpenModal()) {
    document.body.classList.remove("modal-open");
  }

  if (messageboxReturnFocus && document.contains(messageboxReturnFocus) && messageboxReturnFocus.offsetParent !== null) {
    messageboxReturnFocus.focus();
  }

  messageboxReturnFocus = null;
}

modalOpenButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openModal(button.dataset.modalOpen, button);
  });
});

modalCloseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    closeModal(button.closest("[data-modal]"));
  });
});

modals.forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal(modal);
    }
  });
});

messageboxCloseButton.addEventListener("click", closeMessageBox);

messageboxBackdrop.addEventListener("click", (event) => {
  if (event.target === messageboxBackdrop) {
    closeMessageBox();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (isMessageBoxOpen()) {
      closeMessageBox();
      return;
    }

    const openModalElement = getOpenModal();

    if (openModalElement) {
      closeModal(openModalElement);
      return;
    }

    closeNav();
  }
});

function setRegistrationStatus(message, type = "") {
  registrationStatus.textContent = message;
  registrationStatus.classList.toggle("is-error", type === "error");
  registrationStatus.classList.toggle("is-success", type === "success");
}

async function submitRegistration(event) {
  event.preventDefault();

  if (!registrationForm.checkValidity()) {
    registrationForm.reportValidity();
    setRegistrationStatus("Lengkapi data wajib terlebih dahulu.", "error");
    return;
  }

  if (!GOOGLE_SHEETS_WEB_APP_URL) {
    setRegistrationStatus("Form sudah siap. Masukkan URL Web App Google Apps Script di script.js agar data tersimpan ke Google Sheets.", "error");
    return;
  }

  const submitButton = registrationForm.querySelector("button[type='submit']");
  const formData = new FormData(registrationForm);
  formData.set("submittedAt", new Date().toISOString());

  if (GOOGLE_SHEETS_FORM_TOKEN) {
    formData.set("token", GOOGLE_SHEETS_FORM_TOKEN);
  } else {
    formData.delete("token");
  }

  submitButton.disabled = true;
  setRegistrationStatus("Mengirim data pendaftaran...", "");

  try {
    await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: "POST",
      mode: "no-cors",
      body: new URLSearchParams(formData)
    });

    registrationForm.reset();
    setRegistrationStatus("", "");
    closeModal(registrationForm.closest("[data-modal]"), { restoreFocus: false });
    showMessageBox({
      title: "Pendaftaran Terkirim",
      message: "Data pendaftaran berhasil dikirim. Panitia sekolah akan melakukan konfirmasi lanjutan.",
      type: "success",
      icon: "check_circle"
    });
  } catch (error) {
    setRegistrationStatus("Data belum terkirim. Periksa koneksi internet atau konfigurasi Google Apps Script.", "error");
    showMessageBox({
      title: "Pendaftaran Gagal",
      message: "Data belum terkirim. Periksa koneksi internet atau coba beberapa saat lagi.",
      type: "error",
      icon: "error"
    });
  } finally {
    submitButton.disabled = false;
  }
}

function setGraduationResult(message, type = "", icon = "info") {
  graduationResult.classList.toggle("is-error", type === "error");
  graduationResult.classList.toggle("is-passed", type === "passed");
  graduationResult.classList.toggle("is-not-passed", type === "not-passed");
  graduationResult.innerHTML = `
    <span class="material-symbols-rounded" aria-hidden="true">${icon}</span>
    <p>${message}</p>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function requestJsonp(url, params) {
  return new Promise((resolve, reject) => {
    const callbackName = `jsonpCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Waktu pengecekan habis."));
    }, 12000);

    function cleanup() {
      window.clearTimeout(timeout);
      script.remove();
      delete window[callbackName];
    }

    window[callbackName] = (payload) => {
      cleanup();
      resolve(payload);
    };

    const endpoint = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
      endpoint.searchParams.set(key, value);
    });
    endpoint.searchParams.set("callback", callbackName);

    script.onerror = () => {
      cleanup();
      reject(new Error("Endpoint kelulusan tidak dapat diakses."));
    };
    script.src = endpoint.toString();
    document.body.appendChild(script);
  });
}

function setScheduleStatus(message, type = "", icon = "sync") {
  scheduleStatus.classList.toggle("is-error", type === "error");
  scheduleStatus.innerHTML = `
    <span class="material-symbols-rounded" aria-hidden="true">${icon}</span>
    <span>${escapeHtml(message)}</span>
  `;
}

function renderScheduleEmpty(title, message, icon = "calendar_month") {
  scheduleList.innerHTML = `
    <article class="schedule-empty">
      <span class="material-symbols-rounded" aria-hidden="true">${icon}</span>
      <div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(message)}</p>
      </div>
    </article>
  `;
}

function renderSchedule(entries) {
  if (!entries.length) {
    renderScheduleEmpty(
      "Jadwal belum tersedia",
      "Guru dapat mengisi sheet Jadwal Pelajaran di Google Sheets. Setelah terisi, jadwal akan tampil di sini.",
      "event_busy"
    );
    return;
  }

  scheduleList.innerHTML = entries.map((entry) => {
    const timeRange = [entry.startTime, entry.endTime].filter(Boolean).map(escapeHtml).join(" - ");
    const metaItems = [
      entry.className ? `<span><span class="material-symbols-rounded" aria-hidden="true">groups</span>Kelas ${escapeHtml(entry.className)}</span>` : "",
      entry.teacher ? `<span><span class="material-symbols-rounded" aria-hidden="true">person</span>${escapeHtml(entry.teacher)}</span>` : "",
      entry.room ? `<span><span class="material-symbols-rounded" aria-hidden="true">meeting_room</span>${escapeHtml(entry.room)}</span>` : "",
      entry.note ? `<span><span class="material-symbols-rounded" aria-hidden="true">sticky_note_2</span>${escapeHtml(entry.note)}</span>` : ""
    ].filter(Boolean).join("");

    return `
      <article class="schedule-card">
        <div class="schedule-time">
          <strong>${entry.period ? `Jam ${escapeHtml(entry.period)}` : "Jadwal"}</strong>
          ${timeRange ? `<small>${timeRange}</small>` : ""}
        </div>
        <div class="schedule-main">
          <h3>${escapeHtml(entry.subject || "Mata pelajaran belum diisi")}</h3>
          <p>${escapeHtml(entry.day || "Hari belum diisi")}</p>
          ${metaItems ? `<div class="schedule-meta">${metaItems}</div>` : ""}
        </div>
        <div class="schedule-day">${escapeHtml(entry.day || "-")}</div>
      </article>
    `;
  }).join("");
}

async function loadSchedule(showAlert = false) {
  if (!scheduleList) {
    return;
  }

  if (!GOOGLE_SHEETS_WEB_APP_URL) {
    setScheduleStatus("Endpoint jadwal belum disiapkan.", "error", "warning");
    renderScheduleEmpty("Jadwal belum aktif", "Masukkan URL Web App Google Apps Script agar jadwal dapat dibaca.", "warning");
    return;
  }

  const params = {
    action: "getSchedule",
    className: scheduleClassSelect.value,
    day: scheduleDaySelect.value
  };

  if (GOOGLE_SHEETS_FORM_TOKEN) {
    params.token = GOOGLE_SHEETS_FORM_TOKEN;
  }

  scheduleRefreshButton.disabled = true;
  setScheduleStatus("Memuat jadwal...", "", "sync");

  try {
    const result = await requestJsonp(GOOGLE_SHEETS_WEB_APP_URL, params);
    const entries = Array.isArray(result.entries) ? result.entries : [];

    if (!result.ok) {
      throw new Error(result.message || "Jadwal belum dapat dibaca.");
    }

    renderSchedule(entries);
    setScheduleStatus(entries.length ? `${entries.length} jadwal tampil` : "Jadwal belum tersedia", "", entries.length ? "event_available" : "event_busy");
  } catch (error) {
    setScheduleStatus("Jadwal belum dapat dibaca.", "error", "warning");
    renderScheduleEmpty("Gagal memuat jadwal", "Perbarui Apps Script dengan kode terbaru, lalu deploy ulang.", "warning");

    if (showAlert) {
      showMessageBox({
        title: "Jadwal Belum Terbaca",
        message: "Perbarui Apps Script dengan kode terbaru dan pastikan sheet Jadwal Pelajaran sudah tersedia.",
        type: "warning",
        icon: "warning"
      });
    }
  } finally {
    scheduleRefreshButton.disabled = false;
  }
}

async function checkGraduation(event) {
  event.preventDefault();

  if (!graduationForm.checkValidity()) {
    graduationForm.reportValidity();
    return;
  }

  if (!GOOGLE_SHEETS_WEB_APP_URL) {
    setGraduationResult("Fitur cek kelulusan sudah siap. Masukkan URL Web App Google Apps Script di script.js agar bisa membaca data Google Sheets.", "error", "warning");
    showMessageBox({
      title: "Konfigurasi Belum Lengkap",
      message: "Masukkan URL Web App Google Apps Script agar fitur cek kelulusan dapat membaca data Google Sheets.",
      type: "warning",
      icon: "warning"
    });
    return;
  }

  const submitButton = graduationForm.querySelector("button[type='submit']");
  const nik = new FormData(graduationForm).get("nik").toString().trim();
  const params = { action: "checkGraduation", nik };

  if (GOOGLE_SHEETS_FORM_TOKEN) {
    params.token = GOOGLE_SHEETS_FORM_TOKEN;
  }

  submitButton.disabled = true;
  setGraduationResult("Mengecek data kelulusan...", "", "hourglass_top");

  try {
    const result = await requestJsonp(GOOGLE_SHEETS_WEB_APP_URL, params);

    if (!result.ok) {
      const message = result.message || "Data kelulusan belum dapat dibaca.";
      setGraduationResult(escapeHtml(message), "error", "warning");
      showMessageBox({
        title: "Data Belum Bisa Dibaca",
        message,
        type: "error",
        icon: "error"
      });
      return;
    }

    if (!result.found) {
      setGraduationResult("NIK tidak ditemukan. Pastikan NIK sudah benar atau hubungi pihak sekolah.", "error", "person_search");
      showMessageBox({
        title: "NIK Tidak Ditemukan",
        message: "Pastikan NIK sudah benar atau hubungi pihak sekolah untuk konfirmasi.",
        type: "warning",
        icon: "person_search"
      });
      return;
    }

    const passed = String(result.status).toLowerCase() === "lulus";
    const title = passed ? "Selamat, siswa dinyatakan lulus." : "Siswa belum dinyatakan lulus.";
    const detail = [result.name, result.schoolYear, result.note].filter(Boolean).map(escapeHtml).join(" - ");
    const plainDetail = [result.name, result.schoolYear, result.note].filter(Boolean).join(" - ");
    setGraduationResult(`<strong>${title}</strong>${detail}`, passed ? "passed" : "not-passed", passed ? "verified" : "cancel");
    showMessageBox({
      title: passed ? "Siswa Lulus" : "Belum Lulus",
      message: `${title}${plainDetail ? ` ${plainDetail}` : ""}`,
      type: passed ? "success" : "warning",
      icon: passed ? "verified" : "cancel"
    });
  } catch (error) {
    setGraduationResult("Pengecekan gagal. Periksa koneksi internet atau konfigurasi Google Apps Script.", "error", "warning");
    showMessageBox({
      title: "Pengecekan Gagal",
      message: "Periksa koneksi internet atau coba beberapa saat lagi.",
      type: "error",
      icon: "error"
    });
  } finally {
    submitButton.disabled = false;
  }
}

if (registrationForm) {
  if (registrationToken && GOOGLE_SHEETS_FORM_TOKEN) {
    registrationToken.value = GOOGLE_SHEETS_FORM_TOKEN;
  }

  registrationForm.addEventListener("submit", submitRegistration);
}

if (graduationForm) {
  graduationForm.addEventListener("submit", checkGraduation);
}

if (scheduleList) {
  scheduleRefreshButton.addEventListener("click", () => loadSchedule(true));
  scheduleClassSelect.addEventListener("change", () => loadSchedule(false));
  scheduleDaySelect.addEventListener("change", () => loadSchedule(false));
  loadSchedule(false);
}
