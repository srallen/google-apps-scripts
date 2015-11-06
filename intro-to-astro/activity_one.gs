function onOpen() {
  var menu = [{name: 'Geolocate', functionName: 'convertToLatLong'}, {name: 'Add institution to form', functionName: 'openDialog'}];
  SpreadsheetApp.getActive().addMenu('Map', menu);    
}

function convertToLatLong() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Student Responses'),
      lastColumnWithContent = sheet.getLastColumn(),
      lastRowWithContent = sheet.getLastRow(), 
      headerRow = sheet.getSheetValues(1, 1, 1, lastColumnWithContent),
      lastCellValue = sheet.getRange(lastRowWithContent, 2).getValues(),
      geocoder = Maps.newGeocoder(),
      ui = SpreadsheetApp.getUi();
  
  // Setup latitude and longitude headers if needed
  if (headerRow[0].indexOf('Student latitude') === -1) {
    sheet.getRange(1, lastColumnWithContent + 1, 1, 5).setValues([['Student longitude', 'Student latitude', 'Institution longitude', 'Institution latitude', 'Calculated Distance']]);
  }
  
  // geolocate students response and university/institution
  var rowPositionToStart = determineRowPositionToStart(sheet, lastRowWithContent);

  if (rowPositionToStart - 1 !== lastRowWithContent) {
    var studentLocationsToBeGeocoded = sheet.getRange(rowPositionToStart, 2, lastRowWithContent - rowPositionToStart + 1).getValues();
    var studentRangeToInsert = sheet.getRange(rowPositionToStart, 4, lastRowWithContent - rowPositionToStart + 1, 2);
    var institutionLocationsToBeGeocoded = sheet.getRange(rowPositionToStart, 3, lastRowWithContent - rowPositionToStart + 1).getValues();
    var institutionRangeToInsert = sheet.getRange(rowPositionToStart, 6, lastRowWithContent - rowPositionToStart + 1, 2);
    geolocate(geocoder, studentLocationsToBeGeocoded, studentRangeToInsert);
    geolocate(geocoder, institutionLocationsToBeGeocoded, institutionRangeToInsert);
  } else {
    ui.alert("No new locations to geolocate");
  }
}

function geolocate(geocoder, locationsToBeGeocoded, rangeToInsert) {
  var latLongResults = [];
  var ui = SpreadsheetApp.getUi()
  
  for (var i = 0; i < locationsToBeGeocoded.length; i++) {
    var geocodedLocation = geocoder.geocode(locationsToBeGeocoded[i]);

    if (geocodedLocation.status === "OK") {
      var results = geocodedLocation.results;
      var lat = results[0].geometry.location.lat;
      var long = results[0].geometry.location.lng;

      latLongResults.push([long, lat]);
    } else {
      ui.alert("Error parsing location. Check form responses for invalid location.");
      latLongResults.push(["invalid", "invalid"]);
    }
  }
  if (latLongResults.length > 0) {
     rangeToInsert.setValues(latLongResults); 
  }
}

function sendToMaps_() {
  Logger.log('sendToMaps');
}

function lastValue(column) {
  var lastRow = SpreadsheetApp.getActiveSheet().getMaxRows();
  var values = SpreadsheetApp.getActiveSheet().getRange(column + "1:" + column + lastRow).getValues();

  for (; values[lastRow - 1] == "" && lastRow > 0; lastRow--) {}
  return values[lastRow - 1];
}

function determineRowPositionToStart(sheet, lastRowWithContent) {
  var rowPositionToStart;
  var latLongColumn = sheet.getRange(2, 4, lastRowWithContent, 1).getValues();
  // Remove empty objects out of returned range
  var newArray = [];
  for (var i = 0; i < latLongColumn.length; i++) {
    for (var j = 0; j < latLongColumn[i].length; j++) {
      if (latLongColumn[i][j]) {
        newArray.push(latLongColumn[i][j]);
      }
    }
  }
  
  if (newArray.length) {
    rowPositionToStart = newArray.length + 2;
  } else {
    rowPositionToStart = 2;
  }
  return rowPositionToStart;
}

function openDialog() {
  var ui = SpreadsheetApp.getUi();
  
  var result = ui.prompt(
    'Add the full name of your institution or university.',
    'Please enter your institution\'s name:',
    ui.ButtonSet.OK_CANCEL);

  // Process the user's response.
  var button = result.getSelectedButton();
  var institutionName = result.getResponseText();
  if (button == ui.Button.OK) {
    // User clicked "OK".
    addInstitution(institutionName);
  } 
}

function addInstitution(institutionName) {
  var existingForm = FormApp.openById('1SHB8B7JXYVAY0MNydfsJMq5PNRWa5poRATofDjTUW2s');
  var items = existingForm.getItems();
  var ui = SpreadsheetApp.getUi();
  var geocoder = Maps.newGeocoder();
  
  if (items[1].getTitle() === "What is your institution?") {
    var listItem = items[1].asListItem()
    var choices = listItem.getChoices();
    var newInstitution,
        geocodedLocation;
    
    for (var i = 0; i < choices.length; i++) {
      var choiceValue = choices[i].getValue();
      if (institutionName === choiceValue) {
        ui.alert("Institution is already in the list.")
      } else {
        geocodedLocation = geocoder.geocode(institutionName);
      }   
    }   
    
    if (geocodedLocation.status === "OK") {
      newInstitution = listItem.createChoice(institutionName);
      choices.push(newInstitution);
      listItem.setChoices(choices);
      
      ui.alert('Institution added to form.');
    } else {
      ui.alert('Error with institution name. Not found by Google Maps.');
    }

  }
}