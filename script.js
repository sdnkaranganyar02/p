const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const splash = document.querySelector("[data-splash]");
const registrationForm = document.querySelector("[data-registration-form]");
const registrationStatus = document.querySelector("[data-registration-status]");
const registrationToken = document.querySelector("[data-registration-token]");
const graduationForm = document.querySelector("[data-graduation-form]");
const graduationResult = document.querySelector("[data-graduation-result]");

const GOOGLE_SHEETS_WEB_APP_URL = "";
const GOOGLE_SHEETS_FORM_TOKEN = "";

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

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
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
    setRegistrationStatus("Pendaftaran terkirim. Panitia sekolah akan melakukan konfirmasi lanjutan.", "success");
  } catch (error) {
    setRegistrationStatus("Data belum terkirim. Periksa koneksi internet atau konfigurasi Google Apps Script.", "error");
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

async function checkGraduation(event) {
  event.preventDefault();

  if (!graduationForm.checkValidity()) {
    graduationForm.reportValidity();
    return;
  }

  if (!GOOGLE_SHEETS_WEB_APP_URL) {
    setGraduationResult("Fitur cek kelulusan sudah siap. Masukkan URL Web App Google Apps Script di script.js agar bisa membaca data Google Sheets.", "error", "warning");
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
      setGraduationResult(escapeHtml(result.message || "Data kelulusan belum dapat dibaca."), "error", "warning");
      return;
    }

    if (!result.found) {
      setGraduationResult("NIK tidak ditemukan. Pastikan NIK sudah benar atau hubungi pihak sekolah.", "error", "person_search");
      return;
    }

    const passed = String(result.status).toLowerCase() === "lulus";
    const title = passed ? "Selamat, siswa dinyatakan lulus." : "Siswa belum dinyatakan lulus.";
    const detail = [result.name, result.schoolYear, result.note].filter(Boolean).map(escapeHtml).join(" - ");
    setGraduationResult(`<strong>${title}</strong>${detail}`, passed ? "passed" : "not-passed", passed ? "verified" : "cancel");
  } catch (error) {
    setGraduationResult("Pengecekan gagal. Periksa koneksi internet atau konfigurasi Google Apps Script.", "error", "warning");
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
