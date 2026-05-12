const CONFIG = {
  spreadsheetId: "11cTgWc-MuiAxLq04xvE4o6dufix1Q76FtIl8l4fpxmU",
  registrationSheetName: "Pendaftaran",
  graduationSheetName: "Kelulusan",
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

function validateToken(data) {
  if (CONFIG.token && data.token !== CONFIG.token) {
    return { ok: false, message: "Token tidak valid." };
  }

  return null;
}

function getOrCreateSheet(sheetName, headers) {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
  ensureHeaders(sheet, headers);

  if (sheetName === CONFIG.graduationSheetName) {
    sheet.getRange("A:A").setNumberFormat("@");
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
  }
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
