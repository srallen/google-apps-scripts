/**
 * @OnlyCurrentDoc  Limits the script to only accessing the current spreadsheet.
 */

var SIDEBAR_TITLE = 'Process Media';

/**
 * Adds a custom menu with items to show the sidebar and dialog.
 *
 * @param {Object} e The event parameter for a simple onOpen trigger.
 */
function onOpen(e) {
  SpreadsheetApp.getUi()
      .createAddonMenu()
      .addItem('Start Media Processing', 'showSidebar')
      .addToUi();
}

/**
 * Runs when the add-on is installed; calls onOpen() to ensure menu creation and
 * any other initializion work is done immediately.
 *
 * @param {Object} e The event parameter for a simple onInstall trigger.
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * Opens a sidebar. The sidebar structure is described in the Sidebar.html
 * project file.
 */
function showSidebar() {
  var ui = HtmlService.createTemplateFromFile('Sidebar')
      .evaluate()
      .setTitle(SIDEBAR_TITLE)
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  SpreadsheetApp.getUi().showSidebar(ui);
  PropertiesService.getScriptProperties().setProperty('selectedSheet', 'current-sheet'); // Set default value
}

function setSheetToAddTo(sheetToAddTo) {
  PropertiesService.getScriptProperties().setProperty('selectedSheet', sheetToAddTo);
}

var sheetHeaders = ["id", "file_created_datetime", "image_exif_datetime", "file_created_date", "file_created_time", "title",  "location", "latitude", "longitude", "thumbnail_url", "web_content_url", "duplicate", "infobox_html"];
function listMediaFiles(folderName) {
  var selectedSheet = PropertiesService.getScriptProperties().getProperty('selectedSheet');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  setupSheet(selectedSheet, ss, folderName);
  var sheet = ss.getActiveSheet();
  var files = getFilesFromFolder(folderName);
  
  addSheetHeaders(sheet);
  // Handle folders with the same exact name, iterate through
  for (var i = 0; i < files.length; i++) {
    if (files[i].hasNext()) {
      while (files[i].hasNext()) {
        var file = files[i].next();
        addMetadata(file, sheet);   
      }    
    }
  }
}

function setupSheet(selectedSheet, ss, folderName) {
  var sheet;
  
  if (selectedSheet == "current-sheet") {
    sheet = ss.getSheets()[0];
    if (sheet.getName() !== folderName) {
      sheet.setName(folderName)
    }
  } else if (selectedSheet == "new-sheet") {
    // Check to see if sheet already exists and make name unique
    if (ss.getSheetByName(folderName) != null) {
      ss.insertSheet(folderName + " " + Utilities.base64Encode(Math.random()));
    } else {
      ss.insertSheet(folderName);
    }
    sheet = ss.getSheetByName(folderName);
  } 
}

// Add sheet headers
function addSheetHeaders(sheet) {
  var firstRowValues = sheet.getRange(1, 9, 1);
  
  if (firstRowValues.isBlank()) {
    sheet.appendRow(sheetHeaders);
  }
}

// Get files from inputted folder name
function getFilesFromFolder(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  var files = [];
  
  if (folders.hasNext()) {
    while (folders.hasNext()) {
      var folder = folders.next();
      var currentFiles = folder.getFiles();
      files.push(currentFiles);
    }
  } else {
    throw new Error("No folder with that name."); 
  }
  return files
}

// Add metadata to spreadsheet
function addMetadata(file, sheet) {
  var allowedMimeTypes = ["image/jpeg", "image/png", "video/mp4"];
  var mimeType = file.getMimeType();

  // Only allow images and mp4 videos
  if (allowedMimeTypes.indexOf(mimeType) > -1) {
    var metadata = getMetadata(file.getId() || 'unknown', sheet);
    sheet.appendRow(metadata);
  } else {
    throw new Error("No jpg, png, or mp4 files were found in scrapped folder.");
  }
}

// Get photo metadata
function getMetadata(fileId, sheet) {
  var file = Drive.Files.get(fileId);
  
  // Default values
  var NA = "N/A";
  var location = NA;
  var latitude = NA;
  var longitude = NA;
  var imageDateTime = NA;
  
  // Get rid of key/value pair after & in URL
  var contentUrl = file.webContentLink.split("&")[0];
  
  // Get location metadata and date if imageMediaMetadata is not undefined
  if (file.imageMediaMetadata !== undefined) {
    if (file.imageMediaMetadata.location !== undefined) {
      location = file.imageMediaMetadata.location.latitude + ", " + file.imageMediaMetadata.location.longitude;
      latitude = file.imageMediaMetadata.location.latitude;
      longitude = file.imageMediaMetadata.location.longitude;    
    }
    imageDateTime = file.imageMediaMetadata.date || NA;
  }
  
  // Check for and indicate duplicates
  var lastRow = sheet.getLastRow();
  var duplicate = "";
  if (lastRow > 1) {
    var existingFileIds = checkForDuplicates(sheet, lastRow);
    for (var i = 0; i < existingFileIds.length; i++) {
      if (existingFileIds[i][0] == file.id) {
        duplicate = "Y";
      }
    }
  }

  // Format datetime, date, and time
  var createdDateTime = new Date(Date.parse(file.createdDate));
  var month = createdDateTime.getMonth() + 1; // zero based value
  var day = createdDateTime.getDate();
  var year = createdDateTime.getFullYear();
  var date = month + "/" + day + "/" + year;
  var hours = createdDateTime.getHours();
  var minutes = createdDateTime.getMinutes();
  var seconds = createdDateTime.getSeconds();
  var time = hours + ":" + minutes + ":" + seconds;

  var infoBox = 
    "<h4>" + sheetHeaders[1] + "</h4>" +
    "<p>" + createdDateTime + "</p>" +
    "<h4>" + sheetHeaders[6] + "</h4>" +
    "<p>" + location + "</p>" +
    "<h4>" + sheetHeaders[10] + "</h4>" +
    "<img src=" + contentUrl + " width='100px' />" +
    "<h4>" + sheetHeaders[5] + "</h4>" +
    "<p>" + file.title + "</p>";
  
  // Build metadata row
  var metadata = [file.id, createdDateTime, imageDateTime, date, time, file.title, location, latitude, longitude, file.thumbnailLink, contentUrl, duplicate, infoBox];

  // If metaData is 'undefined', return an empty object
  return metadata ? metadata : {};
}

function checkForDuplicates(sheet, lastRow) {
  var currentFileIds = sheet.getRange(2, 1, lastRow);
  
  return currentFileIds.getValues();
}

/**
 * Displays an HTML-service dialog in Google Sheets that contains client-side
 * JavaScript code for the Google Picker API.
 */
function showPicker() {
  var html = HtmlService.createHtmlOutputFromFile('Picker.html')
      .setWidth(600)
      .setHeight(425)
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  SpreadsheetApp.getUi().showModalDialog(html, 'Select a folder');
}

/**
 * Gets the user's OAuth 2.0 access token so that it can be passed to Picker.
 * This technique keeps Picker from needing to show its own authorization
 * dialog, but is only possible if the OAuth scope that Picker needs is
 * available in Apps Script. In this case, the function includes an unused call
 * to a DriveApp method to ensure that Apps Script requests access to all files
 * in the user's Drive.
 *
 * @return {string} The user's OAuth 2.0 access token.
 */
function getOAuthToken() {
  DriveApp.getRootFolder();
  return ScriptApp.getOAuthToken();
}