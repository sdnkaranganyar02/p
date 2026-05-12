# SDN Karanganyar 02

Website profil sekolah dasar berbasis HTML, CSS, dan JavaScript statis.

## Buka Website

Buka file `index.html` langsung di browser, atau jalankan server lokal dari folder ini:

```powershell
python -m http.server 8080
```

Lalu kunjungi `http://localhost:8080`.

## Google Sheets

Website sudah memiliki form pendaftaran siswa baru dan cek kelulusan berbasis NIK. Agar data tersambung ke Google Sheets:

1. Buat Google Sheets baru.
2. Salin Spreadsheet ID dari URL Google Sheets.
3. Buka Apps Script dari Google Sheets.
4. Salin isi `google-apps-script/Code.gs` ke editor Apps Script.
5. Isi `CONFIG.spreadsheetId` dengan Spreadsheet ID.
6. Deploy Apps Script sebagai Web App dengan akses `Anyone`.
7. Salin URL Web App ke `GOOGLE_SHEETS_WEB_APP_URL` di `script.js`.
8. Jika ingin token sederhana, isi `CONFIG.token` dan isi nilai yang sama pada `GOOGLE_SHEETS_FORM_TOKEN` di `script.js`.

Sheet `Pendaftaran` akan dibuat otomatis saat ada pendaftar. Untuk cek kelulusan, isi sheet `Kelulusan` dengan kolom:

`NIK`, `Nama Siswa`, `Status`, `Keterangan`, `Tahun Ajaran`

Nilai `Status` gunakan `Lulus` atau `Tidak Lulus`. Sebaiknya format kolom `NIK` sebagai teks agar angka nol di depan tidak hilang.

Token bersifat opsional. Yang wajib dibutuhkan adalah URL Web App Apps Script.

## Jadwal Pelajaran

Apps Script juga menyiapkan sheet `Jadwal Pelajaran` untuk input guru. Setelah kode Apps Script terbaru dideploy, buka URL berikut sekali untuk membuat format sheet otomatis:

```text
https://script.google.com/macros/s/AKfycbzOaWc0bJVPlxdTdhS9JpT6yej3Zsc992-tWEcqBWSMZzS8bmBXEDONyu6ijaKbaKVj/exec?action=setupSheets
```

Kolom sheet `Jadwal Pelajaran`:

`Kelas`, `Hari`, `Jam Ke`, `Waktu Mulai`, `Waktu Selesai`, `Mata Pelajaran`, `Guru`, `Ruang`, `Catatan`, `Aktif`

Isi `Aktif` dengan `Ya` agar jadwal tampil di website. Isi `Tidak` jika jadwal ingin disimpan tetapi tidak ditampilkan.

Sheet `Kalender Libur` juga disiapkan untuk tanggal merah atau libur khusus sekolah:

`Tanggal`, `Keterangan`, `Aktif`

Gunakan format tanggal `yyyy-mm-dd`, isi `Keterangan` dengan nama libur, dan isi `Aktif` dengan `Ya`.
