/**
 * Creates a menu entry in the Google Docs UI when the document is opened.
 *
 * @param {object} e The event parameter for a simple onOpen trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode.
 */
function onOpen(e) {
  DocumentApp.getUi().createAddonMenu()
      .addItem('Start', 'showSidebar')
      .addToUi();
  DocumentApp.getUi().createAddonMenu().addSeparator();
}

/**
 * Runs when the add-on is installed.
 *
 * @param {object} e The event parameter for a simple onInstall trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode. (In practice, onInstall triggers always
 *     run in AuthMode.FULL, but onOpen triggers may be AuthMode.LIMITED or
 *     AuthMode.NONE.)
 */
function onInstall(e) {
  onOpen(e);
}

function onEdit(event)
{
  Logger.log("Last modified: " + (new Date()));
}

/**
 * Opens a sidebar in the document containing the add-on's user interface.
 */
function showSidebar() {
  var ui = HtmlService.createHtmlOutputFromFile('Sidebar')
  .setTitle('EEXCESS');
  DocumentApp.getUi().showSidebar(ui);
}

/**
 * Gets the text the user has selected. If there is no selection,
 * this function displays an error message.
 *
 * @return {Array.<string>} The selected text.
 */
function getSelectedText() {
  var selection = DocumentApp.getActiveDocument().getSelection();
  if (selection) {
    var text = [];
    var elements = selection.getRangeElements();
    for (var i = 0; i < elements.length; i++) {
      if (elements[i].isPartial()) {
        var element = elements[i].getElement().asText();
        var startIndex = elements[i].getStartOffset();
        var endIndex = elements[i].getEndOffsetInclusive();

        text.push(element.getText().substring(startIndex, endIndex + 1));
      } else {
        var element = elements[i].getElement();
        // Only translate elements that can be edited as text; skip images and
        // other non-text elements.
        if (element.editAsText) {
          var elementText = element.asText().getText();
          // This check is necessary to exclude images, which return a blank
          // text element.
          if (elementText != '') {
            text.push(elementText);
          }
        }
      }
    }
    if (text.length == 0) {
      throw 'Please select some text.';
    }
    return text;
  } else {
    throw 'Please select some text.';
  }
}

/**
 * Gets the recommendations from the selected user text.
 *
 * @return {String} The response as JSON string.
 */
function getRecommendations() {
  
  var text = getSelectedText();
  
  var terms = [];
  
  // Split the text into terms
  for(t in text) {
    var tmp = text[t].split(" ");
    for(i in tmp) {
      // Replace multiple whitespaces and punctuation marks from the terms
      terms.push(tmp[i].replace(/\s/g, "").replace(/[\.,#-\/!$%\^&\*;:{}=\-_`~()]/g,""));
    }
  }
  // privacy proxy URL
  var url = "http://eexcess-dev.joanneum.at/eexcess-privacy-proxy/api/v1/recommend";
  
  // POST payload
  var data = { "numResults" : 60, "contextKeywords" : [] };

   
  // Fill the context array
  for(i in terms) {
    data["contextKeywords"].push({ "weight" : 1.0 / terms.length, "text" : terms[i] });
  }
  
  Logger.log(data);
  
  // Options object, that specifies the method, content type and payload of the HTTPRequest
  var options = {
    "method" : "POST",
    "contentType" : "application/json",
    "payload" : JSON.stringify(data)
  };
 
  try {
    return UrlFetchApp.fetch(url, options).getContentText();
  } catch(err) {
    
  }
}

