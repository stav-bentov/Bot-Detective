/* DESCRIPTION:
    A content script that is responsible for adding information about the bot percentage in a (maximum) of 100 random followers. 
    It activates upon each entry to a profile page, triggered by a message from the urlChanged.js background script.*/

/* ============================================================================= */
/* ============================ Variable Defenition ============================ */
/* ============================================================================= */
const NUM_FOLLOWERS_CHECKED = 100;

// Div to find @username in Profile page
const spanSelector = '#react-root > div > div > div.css-1dbjc4n.r-18u37iz.r-13qz1uu.r-417010 > main > div > div > div > div.css-1dbjc4n.r-14lw9ot.r-jxzhtn.r-1ljd8xs.r-13l2t4g.r-1phboty.r-16y2uox.r-1jgb5lz.r-11wrixw.r-61z16t.r-1ye8kvj.r-13qz1uu.r-184en5c > div > div:nth-child(3) > div > div > div > div > div.css-1dbjc4n.r-13awgt0.r-18u37iz.r-1w6e6rj';
// Span of @username
const attributeSelectorPrec = '[data-testid="UserName"]'
// id for information span
const infoId = "_bots_prec_info";

// There are curtain paths to Profile Page
// The valid:
const validForthPath = ["likes", "media", "with_replies"];
// user can't be one of them:
const savedWords = ["home", "explore", "notifications", "messages", "i"];

// Object for saving followers information on local storage
let userInStorageBotPrec = {
    bot_precentage: MISSING,
    expiration: MISSING
};

/* Checking local storage*/
if (typeof(Storage) !== "undefined") {
    console.log("localStorage/sessionStorage is good to go!");
} else {
    console.log("Sorry! No Web Storage support..");
}


/* ============================================================================= */
/* ================================= FUNCTIONS ================================= */
/* ============================================================================= */

/**
 * Check if a bot sign is exist, if its not belongs to current user- delete and init attributes
 * @param {string} username 
 * @param {HTMLElement} targetElement the span that has '[data-testid="UserName"]' 
 * @returns True if sign exist and belongs to current user/ sign doesnt exist
            False if sign exist but not belongs*/
function isSignBelongs(username, targetElement) {
    /* REMEMBER: 
        Adding bot/human sign process include: 
        (1) Adding status, id (=username_count) to span = @username
        (2) Adding bot/ human image with parameters: id (=username_count), SIGN_IMAGE="1"
    */
    // Get image
    var spanImage = targetElement.querySelector('[SIGN_IMAGE="1"]');
    if (spanImage) {
        // Who the image is belongs to? 
        // Belongs to current user
        if (spanImage.id.startsWith(username)) {
            // Span (and info) belongs to current username
            return true;
        }
        // Else- the info not corresponds to current username
        // Delete bot image
        spanImage.remove();
        
        // Delete/ init attributes from the span that includes @username
        var usernameSpan = targetElement.querySelector("div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div.css-1dbjc4n.r-1awozwy.r-18u37iz.r-1wbh5a2 > div > div > div > span");
        if (usernameSpan){
            usernameSpan.removeAttribute("id");
            usernameSpan.removeAttribute(STATUS);
        }
        return false;
    }
    return true;
    
}

/**
 * Adds bots precentage info 
 */
async function addInfo() {

    // If we are not in a profile page
    if (!checkUrl(window.location.href))
        return;

    // Get username from url
    var username = window.location.href.split("/")[3];

    // request = true if we need to ask from server
    var requestClassification = false;
    var requestFollowersPrec = false;
    // change = true if info is not up to date
    var changeFollowersPrecInfo = false;
    var changeClassificationInfo = false;

    var response, botPrecentageData, botClassification;

    /* For each user saved in this session, we aim to retain their data for a maximum of 10 days (when date= deletetionDate + 30).
    After that period, the data will be deleted, and recalculation will be necessary.*/
    var expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 10);

    // Check if info is already displayed for this web page and current account
    var isDisplayed = checkDisplayedInfo(username);
    if (isDisplayed != OK)
        changeFollowersPrecInfo = true;
    
    var targetElement = document.querySelector(attributeSelectorPrec);
    
    if (targetElement) {
        if (!isSignBelongs(username, targetElement)) {
            changeClassificationInfo = true;
            // Sign not belongs, need to add sign bot
            // Check local storage
            botClassification = checkAvailabilityAndExpiration(username, USER_BOT_TYPE);
            // No need for classification request
            if (botClassification == MISSING) 
                requestClassification = true;
        }
        
        // If need to change prec info, check in local storage
        if (changeFollowersPrecInfo) {
            // Check followers prec info in local storage
            var localStorageUserKey = `${username}_followers`;
            botPrecentageData = checkAvailabilityAndExpiration(localStorageUserKey, BOT_PREC_TYPE);

            // Not in local storage- calculate
            if (botPrecentageData == MISSING)
                requestFollowersPrec = true;
        }
        
        // If at least one of the requests is required
        if (requestFollowersPrec || requestClassification) {
            try {
                // Make Http request
                // LOCAL:
                //response = await fetch(`http://127.0.0.1:8000/followersBots/?username=${username}&classification=${requestClassification}&followersPrec=${requestFollowersPrec}`);
                
                // VM: 
                response = await fetch(`https://34.165.1.66:3003/followersBots/?username=${username}&classification=${requestClassification}&followersPrec=${requestFollowersPrec}`)

                // Error occured in fetch
                if (!response) {
                    return;
                }

                requestData = await response.json(); // response.json() is a dict with keys humans, bots

                // =================== Update local Storage ===================
                if (requestClassification && requestData["classification_res"]) {
                    botClassification = requestData["classification_res"]["classification"];
                    userInStorageClassification.classification = requestData["classification_res"]["classification"];
                    userInStorageClassification.accuracy = requestData["classification_res"]["accuracy"];
                    userInStorageClassification.expiration = expirationDate;
                    localStorage.setItem(username, JSON.stringify(userInStorageClassification));
                }
                if (requestFollowersPrec && requestData["humans"]) {
                    delete requestData["classification_res"];
                    botPrecentageData = requestData;
                    userInStorageBotPrec.bot_precentage = requestData;
                    userInStorageBotPrec.expiration = expirationDate;
                    localStorage.setItem(localStorageUserKey, JSON.stringify(userInStorageBotPrec));
                }
            }
            catch (error) {
                console.log(`Error in addinfo for ${username}`);
            }
        }

        // Check local storage again
        if (changeClassificationInfo) {
            if (botClassification != MISSING) {
                // Now the classification result is in local storage (and in botClassification) then add sign
                var accuracy = JSON.parse(localStorage.getItem(username)).accuracy;
                var usernameSpan = targetElement.querySelector("div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div.css-1dbjc4n.r-1awozwy.r-18u37iz.r-1wbh5a2 > div > div > div > span");
                // Element is found
                if (usernameSpan) {
                    usernameSpan.id = `${username}_from_showBotPrec`;
                    usernameSpan.setAttribute(STATUS, NOT_UPDATED);
                    addSign(usernameSpan.id, botClassification, accuracy);
                }
            }    
        }
        if (changeFollowersPrecInfo) {
            if (botPrecentageData != MISSING) {
                addElement(requestData, targetElement, username, isDisplayed);
            }
        }
    
    }
}

/**
 * Checks span that includes followers prec information for given username
 * @param {string} username 
 * @returns OK if the info is displayed and corresponds to current user element
 *          The info Element- if info is displayed for other user
            Else- null (info is not displayed)
 */
function checkDisplayedInfo(username) {
    /* Check if there is already shown info on this user*/
    var infoElement = document.getElementById(infoId);
    if (infoElement)
    {
        // Check if it's info of current user
        if (infoElement.getAttribute('data-username') == username)
        {
            return OK;
        }
        // Delete element and childs
        while (infoElement.firstChild) {
            infoElement.removeChild(infoElement.firstChild);
        }
        return infoElement;
    }
    return null;
}

/**
 * Adds bots in followers information (and proper popup)
 * @param {int} botPrecentage            Number of bots in (max)100 selected followers
 * @param {HTMLElement} targetElement       Html element to add information to
 * @param {string} username 
 * @param {HTMLElement} container           If the inforamtion was wlready displayed (for other users), it will contain the element (else- null)
 * @returns 
 */
function addElement(botPrecentage, targetElement, username, container) {
    var numFollowersChecked = botPrecentage["bots"] + botPrecentage["humans"];
    // If the target node hasnt been found- end func (we are not in profile page)
    // Or there is no followers to this account
    if (!targetElement || numFollowersChecked == 0)
    {
        return;
    }

    var InjectContainer = (container == null) ? 1 : 0;

    // If there is no span displayed- create container
    if (InjectContainer == 1){
        container = document.createElement('span');
        container.style.paddingTop  = '10px';
    }
    
    // ==================== Create all elements and popups ====================
    // Create a new div element
    var newDiv = document.createElement('span');
    // Set the style properties
    newDiv.style.color = 'Red';
    newDiv.style.fontFamily = 'TwitterChirp';

    var imgElement = document.createElement('img');
    imgElement.src = 'https://i.ibb.co/BrYkxk5/question.png';
    imgElement.style.width = '15px';
    imgElement.style.height = '15px';
    imgElement.style.position = 'relative';
    imgElement.style.display = 'inline-block';
    imgElement.style.padding = '2px';
    imgElement.style.cursor = 'pointer';

    // Create a popup element
    var popup = document.createElement('div');
    popup.innerHTML = `We exmine ${numFollowersChecked} followers of this account (uniformly) and <br> got ${botPrecentage["bots"]} accounts that our model classifies as bots`;
    popup.style.position = 'fixed';
    // Add animate to the entry
    popup.style.transition = 'opacity 0.3s ease-in-out'; 
    popup.style.opacity = 0; 
    popup.style.backgroundColor = '#f1f1f1';
    popup.style.padding = '10px';
    popup.style.borderRadius = '4px';
    popup.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.8)';
    popup.style.fontFamily = 'TwitterChirp';

    /* =============================== INFO HOVER FUNCTIONS =============================== */
    // Function to update the popup position
    function updatePopupPosition(event) {
        var mouseX = event.clientX;
        var mouseY = event.clientY;
        popup.style.left = mouseX + 'px';
        popup.style.top = mouseY + 'px';
    }

    // Function to show the popup
    function showPopup() {
        popup.style.opacity = 1; // Set opacity to 1 to make it visible
    }

    // Function to hide the popup
    function hidePopup() {
        popup.style.opacity = 0; // Set opacity to 0 to fade it out
    }
    /* =============================== END =============================== */


    // Add event listeners to the image element
    imgElement.addEventListener('mouseenter', function(event) {
        updatePopupPosition(event);
        showPopup();
    });
    imgElement.addEventListener('mousemove', updatePopupPosition);
    imgElement.addEventListener('mouseleave', hidePopup);

    // Add all to container
    container.appendChild(newDiv);
    container.appendChild(imgElement);
    container.id = infoId;
    container.setAttribute('data-username', username);
    document.body.appendChild(popup);

    /* Add to webpage*/
    // Set the content or attributes of the new div element
    newDiv.textContent = `${botPrecentage["bots"]} out of ${numFollowersChecked} random followers are bots`;

    // Insert the new div element after the target element (only if the container hasnt been displayed yet)
    if (InjectContainer == 1)
        targetElement.parentNode.appendChild(container, targetElement.nextSibling);
    
}

/**
 * Check if we are in a profile page
 * @param {url} url 
 * @returns True if we are on profile page
 *          else- False
 */
function checkUrl(url){
    /*  What is a url that I should add to it info (profile page)? 
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


/* ============================================================================= */
/* ================================== "MAIN" =================================== */
/* ============================================================================= */

/* Listeners SETUP */

/* Make sure content script can recieve messages*/
chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    // Listen for messages sent from urlChanged.js
    if (request.message === 'urlMessage') {
      await addInfo();
    }
});

// Let the background script know that the content script is ready
chrome.runtime.sendMessage({ message: 'contentScriptIsReady' });
/* DONE Listeners SETUP */

// Handle current page
window.onload = async function() {
    if (checkUrl(window.location.href)) {
        await addInfo();
    }
};
