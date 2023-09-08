/* DESCRIPTION:
    background script is responsible for sending a message to showBotPrec every time the URL changes (possibly when navigating to a profile page). 
    It becomes active after receiving a message from showBotPrec.js.*/

var isContentScriptReady = false;

/**
 * Sends url change to the content script ()
 * @param {int} tabId               The ID of the updated tab.
 * @param {object} changeInfo       Properties of the tab that changed.
 * @param {tab} tab                 The new state of the tab.
 */
async function sendUrl(tabId, changeInfo, tab) {
    if (changeInfo.url && tab.url.startsWith('https://twitter.com/')) {
        
        //chrome.webContentScripts.disable(3);
        chrome.tabs.sendMessage(tabId, {
                message: 'urlMessage',
                url: changeInfo.url,
            });
    }
}

// Wait for the content script to become ready
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message === 'contentScriptIsReady' && !isContentScriptReady) {
        isContentScriptReady = true;

        // Adds listener to url changes
        chrome.tabs.onUpdated.addListener(sendUrl);
    }
});