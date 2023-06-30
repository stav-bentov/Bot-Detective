const spanSelector = '#react-root > div > div > div.css-1dbjc4n.r-18u37iz.r-13qz1uu.r-417010 > main > div > div > div > div.css-1dbjc4n.r-14lw9ot.r-jxzhtn.r-1ljd8xs.r-13l2t4g.r-1phboty.r-16y2uox.r-1jgb5lz.r-11wrixw.r-61z16t.r-1ye8kvj.r-13qz1uu.r-184en5c > div > div:nth-child(3) > div > div > div > div > div.css-1dbjc4n.r-13awgt0.r-18u37iz.r-1w6e6rj';

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

async function addInfo(targetElement) {
    
    // Get username from url
    var url = window.location.href
    var username = url.split("/")[3];

    var localStorageUserKey = `${username}_followers`
    var botPrecentage = checkAvailabilityAndExpiration(localStorageUserKey);

    // If not in local storage- calculate
    if (botPrecentage == -1) {
        // Make Http request
        var response = await fetch(`http://127.0.0.1:8000/followersBots/${username}`);
        botPrecentage = await response.json(); // response.json() is an int (-1 if there are no followers, precentage if there are)

        // Update local Storage
        userInStorage.bot_precentage = botPrecentage
        localStorage.setItem(localStorageUserKey, JSON.stringify(userInStorage));
    }

    addElement(botPrecentage, targetElement);
}

const observer = new MutationObserver(async (mutations) => {
    console.log("in observer");
    // mutations is a list of mutation
    mutations.forEach(async function (mutation) {
        // If there is at least 1 added node
        if (mutation.addedNodes.length) {
            // Pass each node of addedNodes
            for (let addedNode of mutation.addedNodes) {
                // If node is HTMLElement- check if it's a span with usernameClass and starts with @ -> it's our username
                if (addedNode instanceof HTMLElement) {
                    /* Take every span with usernameClass (convert to array for filltering), filter to get just username*/
                    const spanElement = addedNode.querySelector(spanSelector);
                    if(spanElement)
                    {
                        console.log(spanElement.textContent);
                        console.log(spanElement);
                        observer.disconnect();
                        await addInfo(spanElement);
                    }
                }
            }
        }
    });
});

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

function addElement(botPrecentage, targetElement) {
    var container = document.createElement("span");
    
    if (targetElement)
        console.log("exist");
    console.log(targetElement);
    // Create a new div element
    var newDiv = document.createElement('span');

    // Set the style properties
    newDiv.style.color = 'Red';
    newDiv.style.fontFamily = 'TwitterChirp';
    container.style.paddingTop  = '10px';

    var imgElement = document.createElement('img');
    // Grey bot
    //imgElement.src = 'https://i.imgur.com/D2uoogs.png';
    // Red bot
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

    // Add event listeners to the image element
    imgElement.addEventListener('mouseenter', function(event) {
        showPopup();
        updatePopupPosition(event);
    });

    imgElement.addEventListener('mousemove', updatePopupPosition);

    imgElement.addEventListener('mouseleave', hidePopup);

    container.appendChild(newDiv);
    container.appendChild(popup);
    container.appendChild(imgElement);

    // Set the content or attributes of the new div element
    newDiv.textContent = `${botPrecentage}% out of 100 random followers are bots`; // tamir
    // Insert the new div element after the target element
    targetElement.parentNode.insertBefore(container, targetElement.nextSibling);
    
}


observer.observe(document, {childList: true, subtree: true});


/**
 * TODO: 
 *  1. Make redis work
 *  2. Make loading
 *  3. Write diffrent sentence in popup
 *  4. Make it run every page load
 */