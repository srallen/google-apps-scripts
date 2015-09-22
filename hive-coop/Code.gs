/**
 * @OnlyCurrentDoc  Limits the script to only accessing the current spreadsheet.
 */

var SIDEBAR_TITLE = 'Process Images';

/**
 * Adds a custom menu with items to show the sidebar and dialog.
 *
 * @param {Object} e The event parameter for a simple onOpen trigger.
 */
function onOpen(e) {
  SpreadsheetApp.getUi()
      .createAddonMenu()
      .addItem('Show sidebar', 'showSidebar')
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
      .setTitle(SIDEBAR_TITLE);
  SpreadsheetApp.getUi().showSidebar(ui);
}

function listImageFiles(folder) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  var files = getFilesFromFolder(folder);
  var sheetHeaders = ["id", "file_created_date", "image_exif_date", "title",  "location", "latitude", "longitude", "thumbnail_url", "web_content_url"];
  
  addSheetHeaders(sheet, sheetHeaders);
  while (files.hasNext()) {
    var file = files.next();
    addMetadata(file, sheet);   
  }
}

// Add sheet headers
function addSheetHeaders(sheet, sheetHeaders) {
  var firstRowValues = sheet.getRange(1, 9, 1);
  Logger.log(firstRowValues.isBlank());
  if (firstRowValues.isBlank()) {
    sheet.appendRow(sheetHeaders);
  }
}

// Get files from inputted folder name
function getFilesFromFolder(folder) {
  return DriveApp.getFoldersByName(folder).next().getFiles();
}

// Add metadata to spreadsheet
function addMetadata(file, sheet) {
  var allowedMimeTypes = ["image/jpeg", "image/png", "video/mp4"];
  var mimeType = file.getMimeType();

  // Only allow images and mp4 videos
  if (allowedMimeTypes.indexOf(mimeType) > -1) {
    var metadata = getMetadata(file.getId() || 'unknown');
    sheet.appendRow(metadata);
  }
}

// Get photo metadata
function getMetadata(fileId) {
  var file = Drive.Files.get(fileId);
  var NA = "N/A";
  var location = NA;
  var latitude = NA;
  var longitude = NA;
  var imageDate = NA;
  var contentUrl = file.webContentLink.split("&")[0];
    if (file.imageMediaMetadata !== undefined) {
    if (file.imageMediaMetadata.location !== undefined) {
      location = file.imageMediaMetadata.location.latitude + ", " + file.imageMediaMetadata.location.longitude;
      latitude = file.imageMediaMetadata.location.latitude;
      longitude = file.imageMediaMetadata.location.longitude;    
    }
    imageDate = file.imageMediaMetadata.date;
  }  
  
  var metadata = [file.id, file.createdDate, imageDate , file.title, location, latitude, longitude, file.thumbnailLink, contentUrl];

  // If metaData is 'undefined', return an empty object
  return metadata ? metadata : {};
}