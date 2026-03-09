function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Create the PDF file from the base64 string
    const pdfBlob = Utilities.newBlob(
      Utilities.base64Decode(data.pdf), 
      'application/pdf', 
      'Health_History_' + data.clientName + '.pdf'
    );
    
    // Create the folder if it doesn't exist to save a backup
    const folderName = "Completed Health Forms";
    let folder;
    const folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }
    
    // Save to Drive
    folder.createFile(pdfBlob);

    // Send the Email [Target: eringlenrmt@gmail.com]
    GmailApp.sendEmail("eringlenrmt@gmail.com", "New Health History Form: " + data.clientName, 
      "Attached is the completed Health History & Entrance Form for " + data.clientName + " (" + data.clientEmail + ").", {
      attachments: [pdfBlob],
      name: "ErinGlen Wellness Form System"
    });

    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
    
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}