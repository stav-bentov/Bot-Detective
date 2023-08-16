const MISSING = -2;
const UPDATED = 1;
const NOT_UPDATED = 0;
const STATUS = 'status';
const OK = 1;
const BOT_PREC_TYPE = 1;
const USER_BOT_TYPE = 2;
const unknown = -1;

/* An object that will be used for each user's value in the local storage- need to update classification*/
let userInStorageClassification = {
    classification: unknown,
    accuracy: 0,
    expiration: MISSING
};

/**
 * Check if user is saved in local storage and the required data is up to date.
 * Return: classification/ bot prec (if exist and update) [classification: 0 - human, 1- bot | bot prec: 0-100]
 *         else- MISSING
 * @param {String} localStorageUserKey 
 */
function checkAvailabilityAndExpiration(localStorageUserKey, searchType) {
    console.log(`checkAvailabilityAndExpiration for ${localStorageUserKey}`);
    var currentDate = new Date();
    var userStorageValue = localStorage.getItem(localStorageUserKey);

    // User classification(/Bot precentages of user) is done and saved in local storage
    if (userStorageValue != null) {
        userDict = JSON.parse(userStorageValue);
        console.log(`localStorageUserKey: ${localStorageUserKey}`);
        console.log(`userDict.expiration: ${userDict.expiration}`);
        console.log(`userDict.bot_precentage: ${userDict.bot_precentage}`);
        console.log(`userDict.classification: ${userDict.classification}`);
        console.log(`searchType: ${searchType}`);
        if (userDict.expiration == MISSING || currentDate > userDict.expiration) {
            userDict.expiration = MISSING;
            return MISSING;
        }
        // Else- data is up to date
        if (searchType == BOT_PREC_TYPE) {
            console.log(`from checkAvailabilityAndExpiration:${userDict.bot_precentage}`);
            return userDict.bot_precentage;
        }
        console.log(`from checkAvailabilityAndExpiration:${userDict.classification}`);
        return userDict.classification;
    }
    // Not in local storage
    return MISSING;
}

/**
 * Creates bot_image element
 */
function createBotHumanImage(accuracy, isBot) {
    var container = document.createElement("span");
    var imgElement = document.createElement('img');

    if (isBot)
    {
        imgElement.src = 'https://i.imgur.com/haGW0N6.png';
    }
    else
    {
        imgElement.src = 'https://i.ibb.co/hHqMhks/green-Bot.png';
    }
    imgElement.style.width = '20px';
    imgElement.style.height = '23px';
    imgElement.style.position = 'relative';
    imgElement.style.display = 'inline-block';
    imgElement.style.padding = '1px';
    imgElement.style.cursor = 'pointer';

    var popup = document.createElement('div');
    // add accuracy to popup
    if (isBot)
    {
        popup.innerHTML = `<p> ${botPopupTextPart1}${accuracy.toString()}${botPopupTextPart2} </p>`;
    }
    else
    {
        popup.innerHTML = `<p> ${humanPopupTextPart1}${accuracy.toString()}${humanPopupTextPart2} </p>`;
    }

    popup.style.position = 'fixed';
    // Add animate to the entry
    popup.style.transition = 'opacity 0.3s ease-in-out'; 
    popup.style.opacity = 0; 
    popup.style.backgroundColor = '#f1f1f1';
    popup.style.padding = '10px';
    popup.style.borderRadius = '4px';
    popup.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.8)';
    popup.style.fontFamily = 'TwitterChirp';
    popup.style.backgroundImage = 'https://i.imgur.com/haGW0N6.png'; // Replace with your image path
    popup.style.backgroundSize = "cover"; // Adjust to 'contain', 'cover', etc.
    popup.style.backgroundRepeat = "no-repeat";

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
    imgElement.addEventListener('mouseover', function(event) {
        updatePopupPosition(event);
        showPopup();
    });
    imgElement.addEventListener('mousemove', updatePopupPosition);
    imgElement.addEventListener('mouseout', hidePopup);
    // Add all to container
    container.appendChild(imgElement);
    document.body.appendChild(popup);

    return container; 
}

/**
 * Adds bot sign near username.
 * @param {string} elementId - the id of the element we want to add bot sign near.
 */
// Sign of bot, will be added to each suspected bot
// function that its input is string username. and it find the element with id = username and puts the imgElement near it
function addSign(elementId, isBot, accuracy) {  
    console.log(`In add sign for ${elementId}`);
    var usernameElement = document.getElementById(elementId);
    if (usernameElement) { 
        // ASSUMPTION: It has to have STATUS attr but check to prevent error
        if (usernameElement.hasAttribute(STATUS) && usernameElement.getAttribute(STATUS) == NOT_UPDATED) {
            var imgElement = createBotHumanImage(accuracy, isBot);

            // TODO: Added this for the situation where we move from profile page to another and the image doesnt deleted!
            imgElement.id = `${elementId}_img`;
            imgElement.setAttribute("SIGN_IMAGE", 1);
            
            usernameElement.setAttribute(STATUS, UPDATED);
            usernameElement.parentElement.parentElement.parentElement.insertAdjacentElement('afterend', imgElement); 
        }
    }
    else {
        console.log(`usernameElement is null for ${elementId}`);
    }
    console.log(`Done addSign ${elementId}`);
}