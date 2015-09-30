# Hive Coop Google Apps Script

This script will eventually be available in the Google Sheets add-on store, but until then, please visit [the how to instructions to manually set it up](https://docs.google.com/document/d/1uFcKUR2EzhHz_czetJtNbbABXTi8IZrRWXhO8vC0tow/edit).

## How to use

Once the add-on is installed, open up the sidebar by going to the Add-ons > Process Media > Start Media Processing. You will see a text field to input the exact name of the folder that contains the media you wish to scrape its relevant metadata from. Input the exact folder name and the metadata will automatically populate in the spreadsheet.

### Information about the metadata fields that are added


Column  | Explanation
------------- | -------------
id  | Unique id given to files when they are uploaded to Google Drive. Used to check for duplicates
file_created_datetime  | If the media file is uploaded directly to Google Drive, this is the datetime that the file was added to Drive. If uploaded to Google Photos, this may be the datetime of when the photo or video was taken.
image_exif_datetime | This is the datetime that is pulled specifically from the image media metadata. This may be N/A depending on the source camera the image was taken on. Also, there is a known issue associated with this and can be read about on [stackoverflow.](http://stackoverflow.com/questions/27434236/imagemediametadata-date-missing-when-jpg-upload-via-web-drive/32765821#32765821)
file_created_date | The date from the file_created_datetime field
file_created_time | The time from the file_created_datetime field
title | Name of the media file
location | Comma separated latitude and longitude coordinates if present in metadata
latitude | Just the latitude coordinate
longitude | Longitude coodinate
thumbnail_url | URL to the thumbnail preview of the file
web_content_url | URL to the full sized version of the file
duplicate | Indicates "Y" if the file has already been added to the spreadsheet
infobox_html | An HTML template for the infobox in CartoDB
