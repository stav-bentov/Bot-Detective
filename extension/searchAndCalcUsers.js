// Class of usernames (and others)
const usernameClass = 'span.css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0';

// Every mutation will be filled and then erased
var mutationDict = {};
// Main dictonary, will be filled with users
var usernamesMainDict = {};
// In every X seconds we will copy mutationDict to usersOnRequestDict and run makeRequest on users, the results will be there
var usersOnRequestDict = {};
var countId = 0;

var inMutation = false;
var inIntervals = false;
var interval = 10000;
// Const for bot/human/ not calculated yet-unknown 
const unknown = -1;
const bot = 1;
const human = 0;



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
        if (usernamesMainDict[user] == bot && usersOnRequestDict[user].length){
            for (var elementCountId in usersOnRequestDict[user]){
                addSign(user + elementCountId);
            }
        }
    }
}

/**
 * Creates bot_image element
 */
function createBotImage() {
    var imgElement = document.createElement('img');
    //imgElement.src = 'img/bot.png'
    imgElement.src = 'https://miro.medium.com/v2/resize:fit:700/1*u237xTTUp6m6JKQ14b5oGQ.png'
    imgElement.style.width = '23px';
    imgElement.style.height = '23px';
    return imgElement; 
}

/**
 * Adds bot sign near username.
 * @param {string} elementId - the id of the element we want to add bot sign near.
 */
// Sign of bot, will be added to each suspected bot
// function that its input is string username. and it find the element with id = username and puts the imgElement near it
function addSign(elementId) {  
    var usernameElement = document.getElementById(elementId);
    if (usernameElement) { 
        var imgElement = createBotImage();
        usernameElement.parentNode.insertBefore(imgElement, usernameElement.nextSibling); // Upload the image

        // TODO: make the image appear (the upper lines) and delete the lower lines
        /*
        // make the username bold and red and writ "-bot" near it
        usernameElement.style.fontWeight = 'bold';
        usernameElement.style.color = 'red';
        usernameElement.textContent = usernameElement.textContent + '-bot';*/
    }
    else {
        console.log(`usernameElement is null for ${usernameElement}`);
    }
}

/**
 * Sends API request for every user in usersOnRequestDict(keys) and classify the users.
 * TODO: Think about making the API request get bunch of users
 */
async function makeRequests() {
    
    for (var user in usersOnRequestDict) {
        if (!(user in usernamesMainDict)) {
            try {
                // API request for detect human/bot (runs the model on username)
                const response = await fetch(`http://127.0.0.1:5000/isBot/${user}`);
                const data = await response.json();
                console.log(`calculated ${user}, got result: ${data[user]}`);
                usernamesMainDict[user] = data[user];

            } catch (error) {
                console.log(`error for ${user}`);
            }
        }
        else {
            // TODO: Check if possibole
            console.log(`${user} is already calculated`);
            if (usersOnRequestDict[user].length) {
                for (var elementCountId in usersOnRequestDict[user]) {
                    addSign(user + elementCountId);
                }
            }
            delete usersOnRequestDict[user];
        }
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
                        if (username in usernamesMainDict && usernamesMainDict[username] == bot){
                            addSign(usernameSpan.id);
                        }
                        else
                        { // User not classified yet
                            usernameSpan.id = username + countId;

                            // When the classification is ready- set the sign near this id (element)
                            if (username in mutationDict){
                                // User is waiting for classification
                                mutationDict[username][mutationDict[username].length] = countId;
                            }
                            else {// User is NOT waiting for classification
                                mutationDict[username] = [countId];
                            }
                            countId++;
                        }
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


