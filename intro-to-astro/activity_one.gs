var DIALOG_TITLE = 'Student Location Survey';

function onOpen() {
  var menu = [
    {name: 'Open Form', functionName: 'createAndOpenForm'}
  ];
  SpreadsheetApp.getActive().addMenu('Map', menu);    
}

function createAndOpenForm() {
  var ui = HtmlService.createTemplateFromFile('Form')
      .evaluate()
      .setWidth(400)
      .setHeight(215)
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  SpreadsheetApp.getUi().showModalDialog(ui, DIALOG_TITLE);
}

function setupHeaders(sheet, lastColumnWithContent) {
  var headerRow = sheet.getSheetValues(1, 1, 1, lastColumnWithContent);
  
  if (headerRow[0].indexOf('Student latitude') === -1) {
    sheet.getRange(1, lastColumnWithContent + 1, 1, 5).setValues([['Student longitude', 'Student latitude', 'Institution longitude', 'Institution latitude', 'Calculated Distance']]);
  }
}

function addFormSubmission(institution, institutionAddress, location, locationAddress) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Student Responses'),
      lastColumnWithContent = sheet.getLastColumn(),
      lastRowWithContent = sheet.getLastRow(), 
      lastCellValue = sheet.getRange(lastRowWithContent, 2).getValues(),
      geocoder = Maps.newGeocoder(),
      ui = SpreadsheetApp.getUi(),
      date = getDate(),
      submission = [date];
  
  var rowPositionToStart = sheet.getLastRow() + 1;
  var institutionGeocoded = geolocate(geocoder, institutionAddress);
  var locationGeocoded = geolocate(geocoder, locationAddress);

  // Setup latitude and longitude headers if needed
  setupHeaders(sheet, lastColumnWithContent);
  
  sheet.appendRow([date, location, institution, locationGeocoded[0], locationGeocoded[1], institutionGeocoded[0], institutionGeocoded[1]]);
}

function getDate() {
  var formattedDate;
  var date = new Date();
  
  var year = date.getUTCFullYear();
  var month = date.getUTCMonth();
  var day = date.getUTCDate();
  var hour = date.getUTCHours();
  var minutes = date.getUTCMinutes();
  var seconds = date.getUTCSeconds();
  
  //month 2 digits
  month = ("0" + (month + 1)).slice(-2);
  formattedDate = month + '/' + day  + "/" + year + " " + hour + ":" + minutes + ":" + seconds;
  
  return formattedDate;
}

function geolocate(geocoder, location) {
  var latLongResults = [];
  var ui = SpreadsheetApp.getUi()
  
  var geocodedLocation = geocoder.geocode(location);

  if (geocodedLocation.status === "OK") {
    var results = geocodedLocation.results;
    var lat = results[0].geometry.location.lat;
    var long = results[0].geometry.location.lng;

    latLongResults = [long, lat];
  } else {
    ui.alert("Error parsing location. Check form responses for invalid location.");
    latLongResults = ["invalid", "invalid"];
  }

  return latLongResults;
}