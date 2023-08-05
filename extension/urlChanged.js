var isContentScriptReady = false;
const savedWords = ["home", "explore", "notifications", "messages", , "i"];
const validForthPath = ["likes", "media", "with_replies"];

/*  What is a url that I should add to it info? 
     https://twitter.com/username
     https://twitter.com/username/likes
     https://twitter.com/username/media
     https://twitter.com/username/with_replies
    What not?
      https://twitter.com/username/status/1665302793203113984
      https://twitter.com/home
      https://twitter.com/explore
      https://twitter.com/notifications
      https://twitter.com/messages
      https://twitter.com/username/lists
      https://twitter.com/username/communities
      https://twitter.com/i/verified-choose
     */

function checkUrl(url){
    var urlArray = url.split("/");
    if (urlArray.length == 5 || urlArray.length == 4)
    {
        // We are looking for urls: (1) https://twitter.com/username (2) https://twitter.com/username/(likes or media or with replies)
        // username != home, explore, notifications...
        if (!savedWords.includes(urlArray[3]))
        {
            // url = (1) https://twitter.com/username
            if (urlArray.length == 4)
                return true;
            // Check if it has only likes/media/with_replies
            if (validForthPath.includes(urlArray[4]))
            {
                return true;
            }
        }
    }
    return false;
}

/**
 * Sends url change to the content script
 * @param {int} tabId               The ID of the updated tab.
 * @param {object} changeInfo       Properties of the tab that changed.
 * @param {tab} tab                 The new state of the tab.
 */
function sendUrl(tabId, changeInfo, tab) {
    console.log("in chrome.runtime.onUpdated");
    if (changeInfo.url && tab.url.startsWith('https://twitter.com/')) {
        if (checkUrl(tab.url))
        {
            chrome.tabs.sendMessage(tabId, {
                message: 'urlMessage',
                url: changeInfo.url,
            });
        }
    }
}

// Wait for the content script to become ready
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("Got READY message from content script");
    if (request.message === 'contentScriptIsReady' && !isContentScriptReady) {
        isContentScriptReady = true;
        console.log('Content script is ready to receive messages!');

        // Adds listener to url changes
        chrome.tabs.onUpdated.addListener(sendUrl);
    }
});