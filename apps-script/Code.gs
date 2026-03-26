/**
 * PM Polly – Google Apps Script Backend
 * ══════════════════════════════════════
 * Receives feedback submissions from the static website and writes them
 * into a Google Sheet.
 *
 * SETUP INSTRUCTIONS
 * ──────────────────
 * 1. Go to https://script.google.com and create a new project.
 * 2. Paste this entire file into the editor (replacing the default code).
 * 3. Save the project (Ctrl/Cmd + S).
 * 4. Click "Deploy" → "New deployment".
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone  (so students can submit without logging in)
 * 5. Click "Deploy" and copy the Web App URL.
 * 6. Paste that URL into js/app.js  →  CONFIG.APPS_SCRIPT_URL
 * 7. Re-deploy whenever you change the script (use "Manage deployments").
 *
 * The script will automatically create a Google Sheet named "PM Polly Responses"
 * in your Google Drive and append each submission as a new row.
 */

var SHEET_NAME = 'PM Polly Responses';

/**
 * Handle POST requests from the website.
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    appendRow(data);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET requests (used for testing the deployment).
 */
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'PM Polly backend is running.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Append a submission row to the Google Sheet.
 */
function appendRow(data) {
  var ss = getOrCreateSpreadsheet();
  var sheet = getOrCreateSheet(ss);

  // Write headers on first use
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp',
      'Student Name',
      'Case Study ID',
      'Case Study Title',
      'Team',
      'Presentation (1-10)',
      'Content (1-10)',
      'Group Participation (1-10)',
      'Average Score',
      'Comments',
    ]);
    sheet.setFrozenRows(1);
    // Bold the header row
    sheet.getRange(1, 1, 1, 10).setFontWeight('bold');
  }

  sheet.appendRow([
    data.timestamp        || new Date().toISOString(),
    data.studentName      || '',
    data.caseStudyId      || '',
    data.caseStudyTitle   || '',
    data.team             || '',
    data.presentation     || '',
    data.content          || '',
    data.participation    || '',
    data.average          || '',
    data.comments         || '',
  ]);
}

/**
 * Get or create the spreadsheet named SHEET_NAME.
 */
function getOrCreateSpreadsheet() {
  var files = DriveApp.getFilesByName(SHEET_NAME);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  return SpreadsheetApp.create(SHEET_NAME);
}

/**
 * Get or create the sheet tab named SHEET_NAME inside the spreadsheet.
 */
function getOrCreateSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  return sheet;
}
