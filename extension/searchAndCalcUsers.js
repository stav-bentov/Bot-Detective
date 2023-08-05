// Class of usernames (and others)
const usernameClass = 'span.css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0';
/*const popupText = `This user account is suspected to be a bot. <br>
                   Be aware that the account's activities may not be performed by a human user. <br>
                   Please refrain from sharing personal or sensitive information`;*/
const botPopupText = `Be aware that the account's activities<br>
                    may not be performed by a human user.<br>
                    Please refrain from sharing personal<br>
                    or sensitive information`;
const humanPopupText = `The account's activities<br>
                   likely performed by a human user.<br>`;

        
// Every mutation will be filled and then erased
var mutationDict = {};
// In every X seconds we will copy mutationDict to usersOnRequestDict and run makeRequest on users, the results will be there
var usersOnRequestDict = {};
var countId = 0;

var inMutation = false;
var inIntervals = false;
var interval = 3000;
// Const for bot/human/ not calculated yet-unknown 
const unknown = -1;
const bot = 1;
const human = 0;

/* An object that will be used for each user's value in the local storage- need to update classification*/
let userInStorageClassification = {
    classification: unknown,
    accuracy: 0,
    expiration: MISSING
};

// Clear local storage
localStorage.clear(); 

/* Checking local storage*/
if (typeof(Storage) !== "undefined") {
    console.log("Code for localStorage/sessionStorage.");
} else {
    console.log("Sorry! No Web Storage support..");
}

/* ============================ "MAIN" ============================ */
// Create a new MutationObserver instance
const observer = new MutationObserver(handleMutation);
setObserver();
setInterval(async () => {
                        await intervalFunc();
                        }, interval);


/**
 * Sets the observer which is seeking for document changes and get new usernames
 */
function setObserver(){
    // Start observing the desired DOM changes
    observer.observe(document, {childList: true, 
                                subtree: true,
                                classList: true });
}

/**
 * Runs every @interval seconds.
 * This function calls setRequestDict() to get the users that we collected until this time,
 * and then calls makeRequests() to cllassify each user by running the model.
 * Eventually set "bot sign" near every user that is detected as bot.
 */
async function intervalFunc(){
    // Make sure intervalFunc not runs in previous interval
    if (!inIntervals) {
        inIntervals = true;
        
        // Get users - set usersOnRequestDict
        setRequestDict();

        if (Object.keys(usersOnRequestDict).length)
        {
            // Classify each user
            await makeRequests();
            // Set signs of bots
            setSigns();
        }

        // Make sure next function is ruuning 
        inIntervals = false;
    }
}

/**
 * Copys mutationDict to usersOnRequestDict (all the collected user till this time),
 * make sure to stop observsion and wait for it to end if needed.
 */
function setRequestDict(){
    // Stop observer until we finish copy the dict
    observer.disconnect(document);
    console.log(mutationDict);
    while (inMutation)
    {
        console.log("wait... in mutation");
    }
    // Copy mutation dict
    usersOnRequestDict = {...mutationDict};
    mutationDict = {};
    setObserver();
}

/**
 * Pass over usersOnRequestDict, for each bot user- adds a sign near the matching elementId.
 */
function setSigns(){
    for (var user in usersOnRequestDict){
        if (checkAvailabilityAndExpiration(user, USER_BOT_TYPE) == bot) {
            let accuracy = JSON.parse(localStorage.getItem(user)).accuracy;
            for (var elementCountId in usersOnRequestDict[user]){
                addSign(user + elementCountId, true, accuracy);
            }
        }
        /*else (checkAvailabilityAndExpiration(user, USER_BOT_TYPE) == human)
        {
            for (var elementCountId in usersOnRequestDict[user]){
                addSign(user + elementCountId, false);
            }
        }*/
    }
}

/**
 * Creates bot_image element
 */
function createBotImage(accuracy) {
    var container = document.createElement("span");

    var imgElement = document.createElement('img');
    imgElement.src = 'https://i.imgur.com/haGW0N6.png';
    imgElement.style.width = '20px';
    imgElement.style.height = '23px';
    imgElement.style.position = "relative";
    imgElement.style.display = "inline-block";

    var popup = document.createElement("span");
    // add accuracy to popup
    popup.innerHTML = `<p> accuracy = ${accuracy.toString()}% ${botPopupText} </p>`; // tamir
    popup.style.position = "absolute"; 
    popup.style.bottom = "100%";
    popup.style.left = "50%";
    popup.style.transform = "translateX(-20%)";
    popup.style.backgroundColor = "#f1f1f1";
    popup.style.padding = "10px";
    popup.style.borderRadius = "4px";
    popup.style.boxShadow = "0 0 5px rgba(0, 0, 0, 0.8)";
    popup.style.visibility = "hidden";
    popup.style.opacity = "0";
    popup.style.transition = "visibility 0s, opacity 0.6s";
    popup.style.zIndex = "9999"; // Ensure the pop-up appears on top

    imgElement.addEventListener("mouseover", function() {
        popup.style.visibility = "visible";
        popup.style.opacity = "1";
    });

    imgElement.addEventListener("mouseout", function() {
        popup.style.visibility = "hidden";
        popup.style.opacity = "0";
      });
    
    imgElement.style.cursor = 'pointer';
      
    container.appendChild(imgElement);
    container.appendChild(popup);

    return container; 
}

function createHumanImage() {
    var container = document.createElement("span");

    var imgElement = document.createElement('img');
    imgElement.src = 'https://imgtr.ee/images/2023/06/18/YutNQ.png';
    imgElement.style.width = '20px';
    imgElement.style.height = '23px';
    imgElement.style.position = "relative";
    imgElement.style.display = "inline-block";

    var popup = document.createElement("span");
    popup.innerHTML = `<p> ${humanPopupText} </p>`;
    popup.style.position = "absolute";
    //popup.style.bottom = "100%";
    popup.style.bottom = "100%";
    popup.style.left = "50%";
    popup.style.transform = "translateX(-20%)";
    popup.style.backgroundColor = "#f1f1f1";
    popup.style.padding = "10px";
    popup.style.borderRadius = "4px";
    popup.style.boxShadow = "0 0 5px rgba(0, 0, 0, 0.8)";
    popup.style.visibility = "hidden";
    popup.style.opacity = "0";
    popup.style.transition = "visibility 0s, opacity 0.6s";
    popup.style.zIndex = "9999"; // Ensure the pop-up appears on top

    imgElement.addEventListener("mouseover", function() {
        popup.style.visibility = "visible";
        popup.style.opacity = "1";
    });

    imgElement.addEventListener("mouseout", function() {
        popup.style.visibility = "hidden";
        popup.style.opacity = "0";
      });
    
    imgElement.style.cursor = 'pointer';
      
    container.appendChild(imgElement);
    container.appendChild(popup);

    return container; 
}

/**
 * Adds bot sign near username.
 * @param {string} elementId - the id of the element we want to add bot sign near.
 */
// Sign of bot, will be added to each suspected bot
// function that its input is string username. and it find the element with id = username and puts the imgElement near it
function addSign(elementId, isBot, accuracy) {  
    console.log(`in add sign for ${elementId}`);
    var usernameElement = document.getElementById(elementId);
    if (usernameElement) { 
        if (isBot)
            var imgElement = createBotImage(accuracy);
            usernameElement.parentNode.insertBefore(imgElement, usernameElement.nextSibling); // Upload the image
        /*else
            var imgElement = createHumanImage();*/
    }
    else {
        console.log(`usernameElement is null for ${usernameElement}`);
    }
}

/**
 * Sends API request for every user in usersOnRequestDict(keys) and classify the users.
 */
async function makeRequests() {
    try {
        var  expirationDate = new Date();
        expirationDate.setDate(expirationDate .getDate() + 10);

        // API request for detect human/bot (runs the model on username)

        // For FastAPI
        const response = await fetch(`http://127.0.0.1:8000/isBot/${Object.keys(usersOnRequestDict).join(',')}`);
        // For Flask
        //const response = await fetch(`http://127.0.0.1:5000/isBot/${user}`);
        // For TAMIR - VM Flask
        // const response = await fetch(`https://34.165.1.66:3003/isBot/${user}`);
        // For FastAPI - VM FastAPI
        //const response = await fetch(`https://34.165.1.66:3003/isBot/${user}`);

        const data = await response.json(); // data is dict of dicts: {username:{classification:class, accuracy:acc}}
        console.log("data recived:" , data);
        
        // Read the result from the response and set the classification & accuracy in local storage
        for (var user in data){
            userInStorageClassification.classification = data[user]["classification"];
            userInStorageClassification.accuracy = data[user]["accuracy"];
            userInStorageClassification.expiration = expirationDate;
            localStorage.setItem(user, JSON.stringify(userInStorageClassification));
        }
    } catch (error) {
        console.log(`error`);
    }
}

/**
 * Handles mutations: Pass over any mutation and get the new usernames on screen- from usernameClass 
 * and starts with @.
 * @param {List} mutations 
 */
function handleMutation(mutations) {

    inMutation = true;

    // mutations is a list of mutation
    mutations.forEach(function (mutation) {
        // If there is at least 1 added node
        if (mutation.addedNodes.length) {
            // Pass each node of addedNodes
            for (let addedNode of mutation.addedNodes) {
                // If node is HTMLElement- check if it's a span with usernameClass and starts with @ -> it's our username
                if (addedNode instanceof HTMLElement) {
                    /* Take every span with usernameClass (convert to array for filltering), filter to get just username*/
                    const spanElements = Array.from(addedNode.querySelectorAll(usernameClass));
                    const mutationUsernames = spanElements.filter(spanElement => spanElement.textContent.startsWith('@'));
                    mutationUsernames.forEach(usernameSpan => { 
                        // delete "@"
                        username = usernameSpan.textContent.substring(1);

                        // User is already classified
                        // If user classification is saved in local storage and up to date- use it
                        let userResult;
                        usernameSpan.id = username + countId;
                        userResult = checkAvailabilityAndExpiration(username, USER_BOT_TYPE)
                        if (userResult != MISSING) {

                            console.log(`${username} is already calculated and got: ${userResult}`);
                            if (userResult == bot) {
                                let accuracy = JSON.parse(localStorage.getItem(username)).accuracy;
                                addSign(usernameSpan.id, true, accuracy);
                            }
                            /*else {
                                addSign(usernameSpan.id, false);
                            }*/
                        }
                        else
                        { // User not classified yet

                            // When the classification is ready- set the sign near this id (element)
                            if (username in mutationDict){
                                // User is waiting for classification
                                mutationDict[username][mutationDict[username].length] = countId;
                            }
                            else {// User is NOT waiting for classification
                                mutationDict[username] = [countId];
                            }
                        }
                        countId++;
                    });
                }
            }
        }
    });
    
    inMutation = false;
}




/*if (mutation.type === 'childList') {
        for (let addedNode of mutation.addedNodes) {
          if (addedNode.classList && addedNode.classList.contains('span.css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0')) {
            console.log('Element with class added:', addedNode);
          }
        }
}*/



