const CONFIG = {
  spreadsheetId: "11cTgWc-MuiAxLq04xvE4o6dufix1Q76FtIl8l4fpxmU",
  registrationSheetName: "Pendaftaran",
  graduationSheetName: "Kelulusan",
  scheduleSheetName: "Jadwal Pelajaran",
  token: ""
};

const REGISTRATION_HEADERS = [
  "Timestamp",
  "Nama Calon Siswa",
  "Jenis Kelamin",
  "Tempat Lahir",
  "Tanggal Lahir",
  "Nama Orang Tua/Wali",
  "No HP/WhatsApp Wali",
  "Alamat",
  "Asal TK/PAUD",
  "Catatan",
  "Sumber"
];

const GRADUATION_HEADERS = [
  "NIK",
  "Nama Siswa",
  "Status",
  "Keterangan",
  "Tahun Ajaran"
];

const SCHEDULE_HEADERS = [
  "Kelas",
  "Hari",
  "Jam Ke",
  "Waktu Mulai",
  "Waktu Selesai",
  "Mata Pelajaran",
  "Guru",
  "Ruang",
  "Catatan",
  "Aktif"
];

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const CLASSES = ["I", "II", "III", "IV", "V", "VI"];

function doPost(e) {
  try {
    const data = e.parameter || {};
    const tokenError = validateToken(data);

    if (tokenError) {
      return jsonResponse(tokenError);
    }

    saveRegistration(data);
    return jsonResponse({ ok: true, message: "Pendaftaran berhasil disimpan." });
  } catch (error) {
    return jsonResponse({ ok: false, message: error.message });
  }
}

function doGet(e) {
  try {
    const data = e.parameter || {};
    const tokenError = validateToken(data);
    let payload;

    if (tokenError) {
      payload = tokenError;
    } else if (data.action === "checkGraduation") {
      payload = checkGraduation(data.nik);
    } else if (data.action === "getSchedule") {
      payload = getSchedule(data);
    } else if (data.action === "setupSheets") {
      payload = setupSheets();
    } else {
      payload = { ok: true, message: "Endpoint SDN Karanganyar 02 aktif." };
    }

    if (data.callback) {
      return jsonpResponse(data.callback, payload);
    }

    return jsonResponse(payload);
  } catch (error) {
    const payload = { ok: false, message: error.message };

    if (e.parameter && e.parameter.callback) {
      return jsonpResponse(e.parameter.callback, payload);
    }

    return jsonResponse(payload);
  }
}

function saveRegistration(data) {
  const sheet = getOrCreateSheet(CONFIG.registrationSheetName, REGISTRATION_HEADERS);

  sheet.appendRow([
    new Date(),
    data.studentName || "",
    data.gender || "",
    data.birthPlace || "",
    data.birthDate || "",
    data.parentName || "",
    data.phone || "",
    data.address || "",
    data.previousSchool || "",
    data.notes || "",
    data.source || "Website"
  ]);
}

function checkGraduation(nik) {
  const cleanNik = String(nik || "").trim();

  if (!cleanNik) {
    return { ok: false, found: false, message: "NIK wajib diisi." };
  }

  const sheet = getOrCreateSheet(CONFIG.graduationSheetName, GRADUATION_HEADERS);
  const values = sheet.getDataRange().getDisplayValues();

  for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    const row = values[rowIndex];

    if (String(row[0] || "").trim() === cleanNik) {
      return {
        ok: true,
        found: true,
        nik: cleanNik,
        name: row[1] || "",
        status: row[2] || "",
        note: row[3] || "",
        schoolYear: row[4] || ""
      };
    }
  }

  return {
    ok: true,
    found: false,
    message: "NIK tidak ditemukan."
  };
}

function getSchedule(data) {
  const className = String(data.className || "").trim();
  const day = String(data.day || "").trim();
  const sheet = getOrCreateSheet(CONFIG.scheduleSheetName, SCHEDULE_HEADERS);
  const values = sheet.getDataRange().getDisplayValues();
  const entries = [];

  for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    const row = values[rowIndex];
    const entry = {
      className: row[0] || "",
      day: row[1] || "",
      period: row[2] || "",
      startTime: row[3] || "",
      endTime: row[4] || "",
      subject: row[5] || "",
      teacher: row[6] || "",
      room: row[7] || "",
      note: row[8] || "",
      active: row[9] || ""
    };

    if (!entry.className && !entry.day && !entry.subject) {
      continue;
    }

    if (!entry.day || !entry.subject) {
      continue;
    }

    if (!isActiveSchedule(entry.active)) {
      continue;
    }

    if (className && className !== "Semua" && entry.className !== className) {
      continue;
    }

    if (day && day !== "Semua" && entry.day !== day) {
      continue;
    }

    entries.push(entry);
  }

  entries.sort(sortScheduleEntries);

  return {
    ok: true,
    entries,
    headers: SCHEDULE_HEADERS,
    classes: CLASSES,
    days: DAYS,
    message: entries.length ? "Jadwal ditemukan." : "Jadwal belum tersedia."
  };
}

function setupSheets() {
  getOrCreateSheet(CONFIG.registrationSheetName, REGISTRATION_HEADERS);
  getOrCreateSheet(CONFIG.graduationSheetName, GRADUATION_HEADERS);
  getOrCreateSheet(CONFIG.scheduleSheetName, SCHEDULE_HEADERS, true);

  return {
    ok: true,
    message: "Format sheet Pendaftaran, Kelulusan, dan Jadwal Pelajaran sudah disiapkan."
  };
}

function isActiveSchedule(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return !["tidak", "nonaktif", "false", "0", "no"].includes(normalized);
}

function sortScheduleEntries(a, b) {
  const dayDiff = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);

  if (dayDiff !== 0) {
    return dayDiff;
  }

  const classDiff = CLASSES.indexOf(a.className) - CLASSES.indexOf(b.className);

  if (classDiff !== 0) {
    return classDiff;
  }

  return Number(a.period || 0) - Number(b.period || 0);
}

function validateToken(data) {
  if (CONFIG.token && data.token !== CONFIG.token) {
    return { ok: false, message: "Token tidak valid." };
  }

  return null;
}

function getOrCreateSheet(sheetName, headers, forceFormat) {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const existingSheet = spreadsheet.getSheetByName(sheetName);
  const sheet = existingSheet || spreadsheet.insertSheet(sheetName);
  const headersCreated = ensureHeaders(sheet, headers);

  if (sheetName === CONFIG.graduationSheetName) {
    sheet.getRange("A:A").setNumberFormat("@");
  }

  if (sheetName === CONFIG.scheduleSheetName && (forceFormat || !existingSheet || headersCreated)) {
    formatScheduleSheet(sheet);
  }

  return sheet;
}

function ensureHeaders(sheet, headers) {
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  const currentHeaders = headerRange.getValues()[0];
  const hasHeaders = currentHeaders.some(String);

  if (!hasHeaders) {
    headerRange.setValues([headers]);
    headerRange.setFontWeight("bold");
    sheet.setFrozenRows(1);
    return true;
  }

  return false;
}

function formatScheduleSheet(sheet) {
  const dayValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(DAYS, true)
    .setAllowInvalid(false)
    .build();
  const classValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(CLASSES, true)
    .setAllowInvalid(false)
    .build();
  const activeValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Ya", "Tidak"], true)
    .setAllowInvalid(false)
    .build();

  sheet.getRange("A2:A501").setDataValidation(classValidation);
  sheet.getRange("B2:B501").setDataValidation(dayValidation);
  sheet.getRange("J2:J501").setDataValidation(activeValidation);
  sheet.getRange("C2:C501").setNumberFormat("0");
  sheet.getRange("D2:E501").setNumberFormat("HH:mm");
  sheet.setColumnWidths(1, SCHEDULE_HEADERS.length, 150);
  sheet.setColumnWidth(6, 220);
  sheet.setColumnWidth(9, 240);
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonpResponse(callback, payload) {
  const safeCallback = String(callback || "").match(/^[A-Za-z_$][0-9A-Za-z_$]*$/)
    ? callback
    : "callback";

  return ContentService
    .createTextOutput(`${safeCallback}(${JSON.stringify(payload)});`)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
