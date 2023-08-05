const spanSelector = '#react-root > div > div > div.css-1dbjc4n.r-18u37iz.r-13qz1uu.r-417010 > main > div > div > div > div.css-1dbjc4n.r-14lw9ot.r-jxzhtn.r-1ljd8xs.r-13l2t4g.r-1phboty.r-16y2uox.r-1jgb5lz.r-11wrixw.r-61z16t.r-1ye8kvj.r-13qz1uu.r-184en5c > div > div:nth-child(3) > div > div > div > div > div.css-1dbjc4n.r-13awgt0.r-18u37iz.r-1w6e6rj';
const infoId = "_bots_prec_info";
const savedWords = ["home", "explore", "notifications", "messages", , "i"];
const validForthPath = ["likes", "media", "with_replies"];
const OK = 1;
const NOT_DISPLAYED = -1;

/* Checking local storage*/
if (typeof(Storage) !== "undefined") {
    console.log("Code for localStorage/sessionStorage.");
} else {
    console.log("Sorry! No Web Storage support..");
}

/* For each user saved in this session, we aim to retain their data for a maximum of 30 days (when date= deletetionDate + 30).
 After that period, the data will be deleted, and recalculation will be necessary.*/
const currentDate = new Date();
const  expirationDate = new Date();
expirationDate .setDate(expirationDate .getDate() + 10);

/* An object that will be used for each user's value in the local storage- need to update classification*/
let userInStorage = {
    bot_precentage: -1,
    expiration: expirationDate,
};

/**
 * Adds bots precentage info 
 */
async function addInfo() {
    // If we are not in a profile page
    if (!checkUrl(window.location.href))
        return;

    console.log("In profile page");

    // Check if info is already displayed for this web page and current account
    var isDisplayed = checkDisplayedInfo(username);
    if (isDisplayed == OK)
        return;

    // Get username from url
    var username = window.location.href.split("/")[3];
    var targetElement = document.querySelector(spanSelector);
    
    var localStorageUserKey = `${username}_followers`
    var botPrecentage = checkAvailabilityAndExpiration(localStorageUserKey);

    console.log(`Got botPrecentage: ${botPrecentage} from local storage`);

    // If not in local storage- calculate
    if (botPrecentage == -1) {
        console.log("Not in local storage");

        // Make Http request
        var response = await fetch(`http://127.0.0.1:8000/followersBots/${username}`);
        botPrecentage = await response.json(); // response.json() is an int (-1 if there are no followers, precentage if there are)

        console.log(`Got botPrecentage: ${botPrecentage} from redis storage`);

        // Update local Storage
        userInStorage.bot_precentage = botPrecentage;
        localStorage.setItem(localStorageUserKey, JSON.stringify(userInStorage));
    }
    addElement(botPrecentage, targetElement, username, isDisplayed);
}

/**
 * Check if user is saved in local storage and up to date, if it is- return the classification, else- return null
 * @param {String} residUserKey 
 */
function checkAvailabilityAndExpiration(localStorageUserKey) {
    const userStorageValue = localStorage.getItem(localStorageUserKey);

    // Bot precentages of user is already calculated
    if (userStorageValue != null) {
        userDict = JSON.parse(userStorageValue);

        // User classification is not up to date
        if (currentDate > userDict.expiration) {
            localStorage.removeItem(user);
            return -1;
        }
        
        // Else- the user classification is avaliable and up to date return the result
        return userDict.bot_precentage;
    }
    return -1;
}

function checkDisplayedInfo(username) {
    /* Check if there is already shown info on this user*/
    var infoElement = document.getElementById(infoId);
    if (infoElement)
    {
        console.log(`There is an info element for ${infoElement.getAttribute('data-username')}`);
        // Check if it's info of current user
        if (infoElement.getAttribute('data-username') == username)
        {
            console.log("No need to change info");
            return 1;
        }
        console.log("Need to change info");
        while (infoElement.firstChild) {
            console.log(`delete: ${infoElement.firstChild}`);
            infoElement.removeChild(infoElement.firstChild);
        }
        return infoElement;
    }
    return null;
}

function addElement(botPrecentage, targetElement, username, container) {
    // If the target node hasnt been found- end func (we are not in profile page)
    if (!targetElement)
    {
        console.log("targetElement not exist");
        return;
    }

    var InjectContainer = (container == null) ? 1 : 0;

    // If there is no span displayed- create container
    if (InjectContainer == 1){
        container = document.createElement("span");
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
    imgElement.style.position = "relative";
    imgElement.style.display = "inline-block";
    imgElement.style.padding = "2px";
    imgElement.style.cursor = 'pointer';

    // Create a popup element
    var popup = document.createElement('div');
    popup.innerHTML = `We exmine 100 followers of this account (uniformly) and <br> got ${botPrecentage} accounts that our model classifies as bots`;
    popup.style.position = 'fixed';
    popup.style.transition = 'opacity 0.3s ease-in-out'; // Add transition CSS property
    popup.style.opacity = 0; // Set initial opacity to 0
    popup.style.backgroundColor = "#f1f1f1";
    popup.style.padding = "10px";
    popup.style.borderRadius = "4px";
    popup.style.boxShadow = "0 0 5px rgba(0, 0, 0, 0.8)";
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
        showPopup();
        updatePopupPosition(event);
    });
    imgElement.addEventListener('mousemove', updatePopupPosition);
    imgElement.addEventListener('mouseleave', hidePopup);

    /* Add all to container*/
    container.appendChild(newDiv);
    container.appendChild(popup);
    container.appendChild(imgElement);
    container.id = infoId;
    container.setAttribute('data-username', username);

    /* Add to webpage*/
    // Set the content or attributes of the new div element
    newDiv.textContent = `${botPrecentage} out of 100 random followers are bots`;

    // Insert the new div element after the target element (only if the container hasnt been displayed yet)
    if (InjectContainer == 1)
        targetElement.parentNode.appendChild(container, targetElement.nextSibling);
    
}


/**
 * Gets a url and check if we are in a profile page
 */
function checkUrl(url){
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

/* ============================================== Listeners SETUP ============================================== */
console.log("In content-script");

/* Make sure content script can recieve messages*/
chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    // Listen for messages sent from background.js
    if (request.message === 'urlMessage') {
      await addInfo();
    }
});
console.log("Content script listens to messages");

// Let the background script know that the content script is ready
chrome.runtime.sendMessage({ message: 'contentScriptIsReady' });
console.log("Content script sent READY message to background");
/* ============================================ DONE Listeners SETUP ============================================= */



window.onload = function() {
    if (checkUrl(window.location.href)) {
        console.log("in first attemp")
        addInfo();
    }
};
