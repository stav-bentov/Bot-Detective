/* DESCRIPTION:
    A content script responsible for adding bot or human signs based on the user's classification by the model.*/
    
/* ============================================================================= */
/* ============================ Variable Defenition ============================ */
/* ============================================================================= */
const attributeSelectorClassification1 = '[data-testid="User-Name"]';
// Usernames from follow/likes/search ...
const attributeSelectorClassification2 = '[data-testid="UserCell"]';
// Usernames from profile page
const attributeSelectorClassification3 = '[data-testid="UserName"]';    
// For each Div out of the ones with attributeSelectorClassification, we look for the span with @username (each span has diffrent JS paths)
const spanOptions1 = ['div.css-1dbjc4n.r-18u37iz.r-1wbh5a2.r-13hce6t > div > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs > a > div > span',
                      'div > div.css-1dbjc4n.r-18u37iz.r-1wbh5a2.r-13hce6t > div > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs > div > div > span',
                      'div.css-1dbjc4n.r-18u37iz.r-1wbh5a2 > div > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs > a > div > span'];
const spanOptions2 = ['div > div.css-1dbjc4n.r-1iusvr4.r-16y2uox > div.css-1dbjc4n.r-1awozwy.r-18u37iz.r-1wtj0ep > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div.css-1dbjc4n.r-1awozwy.r-18u37iz.r-1wbh5a2 > div > a > div > div > span',
                      'div > div > div.css-1dbjc4n.r-1iusvr4.r-16y2uox.r-1777fci > div > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div.css-1dbjc4n.r-1awozwy.r-18u37iz.r-1wbh5a2 > div > div > div > span'];
const spanOptions3 = ['div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div.css-1dbjc4n.r-1awozwy.r-18u37iz.r-1wbh5a2 > div > div > div > span']
// Every mutation will be filled and then erased
var mutationDict = {};
// In every interval/1000 seconds we will copy mutationDict to usersOnRequestDict and run makeRequest on the users, the results will be saved there
var usersOnRequestDict = {};
// Help us identify elements we need to update with results
var countId = 0;
// Const for bot/human/ not calculated yet-unknown 
const bot = 1;
const human = 0;

var inProcessMutation = false;
var inIntervals = false;
var interval = 3000;

// Insert every mutation to queue and ensure 
let mutationQueue = [];

/* ============================================================================= */
/* ================================== "MAIN" =================================== */
/* ============================================================================= */

// Clear local storage
// localStorage.clear(); 

// Create a new MutationObserver instance for tracking new elements
const observer = new MutationObserver(handleMutation);
setObserver();
setInterval(async () => { await intervalFunc();}, interval);


/* ============================================================================= */
/* ================================= FUNCTIONS ================================= */
/* ============================================================================= */

/**
 * Sets the observer which is seeking for document changes and get new usernames
 */
function setObserver(){
    // Start observing the desired DOM changes
    observer.observe(document, {childList: true, 
                                subtree: true});
}

/**
 * Runs every @interval seconds.
 * This function calls setRequestDict() to get the users that we collected until this time,
 * then calls makeRequests() to classify each user with API request to our server (that runs the model).
 * Eventually set a bot/ human sign near every user.
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
    // Start copy after last mutation func ended
    while (inProcessMutation)
    {
        console.log("wait... in process mutation");
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
    var result;
    for (var user in usersOnRequestDict){
        // Check if result in local storage (if the server returned the result it should be there)
        result = checkAvailabilityAndExpiration(user, USER_BOT_TYPE);
        if (result != MISSING) {
            var accuracy = JSON.parse(localStorage.getItem(user)).accuracy;
            // Add propper sign near required elements
            usersOnRequestDict[user].forEach(elementCountId=> {
                addSign(user + elementCountId, result, accuracy);
              });
        }
    }
}

/**
 * Sends API request for every user in usersOnRequestDict(keys) and classify the users.
 */
async function makeRequests() {
    try {
        var  expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 10);
        
        // Make API requests for classify human/bot (runs the model on username or get from Redis)
        // LOCAL: FastAPI
        //const response = await fetch(`http://127.0.0.1:8000/isBot/${Object.keys(usersOnRequestDict).join(',')}`);
        // VM: FastAPI
         const response = await fetch(`https://34.165.1.66:3003/isBot/${Object.keys(usersOnRequestDict).join(',')}`);

        const data = await response.json(); // data is dict of dicts: {username:{classification:class, accuracy:acc}}
        
        // Read the result from the response and set the classification & accuracy in local storage
        for (var user in data){
            userInStorageClassification.classification = data[user]["classification"];
            userInStorageClassification.accuracy = data[user]["accuracy"];
            userInStorageClassification.expiration = expirationDate;
            localStorage.setItem(user, JSON.stringify(userInStorageClassification));
        }
    } 
    catch (error) {
        console.log(`Error in makeRequests for ${username}`);
    }
}

/**
 * Handles mutations: Insert mutation to queue. 
 * If no other mutation is being processed sends it to process, 
 * else- end function (this mutation will be processed after the current)
 * @param {Array} mutations 
 */
function handleMutation(mutations) {
    mutationQueue.push(...mutations);
    if (inProcessMutation)
        return;
    processMutation();
}

/**
 * Updates values: id and STATUS attribute. 
 * Check if there is an updated result in local storage (if yes- add sign).
 * If there is no updated result in Local storage- update mutationDict (so the classification will be calculated).
 * @param {HTMLElement} usernameSpan    span that has one of the next attrivutes: data-testid="User-Name", data-testid="UserCell", data-testid="UserName".
 */
function processUserSpan(usernameSpan)
{
    // Del @
    username = usernameSpan.innerHTML.substring(1);
        
    // Take care of new spans
    if (!usernameSpan.hasAttribute(STATUS)) {
        var userResult;
        usernameSpan.id = username + countId;
        usernameSpan.setAttribute(STATUS, NOT_UPDATED);

        userResult = checkAvailabilityAndExpiration(username, USER_BOT_TYPE);
        // Case 1: User is already classified (result in LOCAL STORAGE)
        if (userResult != MISSING) {
            var accuracy = JSON.parse(localStorage.getItem(username)).accuracy;
            addSign(usernameSpan.id, userResult, accuracy);
        }
        // Case 2: User is not in local storage- add to dict for future request from server
        else
        { 
            // mutationDict: {username: [spanId_1, spanId_2, ...]}
            if (username in mutationDict){
                // User is waiting for classification
                mutationDict[username][mutationDict[username].length] = countId;
            }
            else {// User is NOT waiting for classification
                mutationDict[username] = [countId];
            }
        }
        countId++;
    }
}

/**
 * Process mutations: Pass over any mutation and get the new usernames on screen (according to data-testid)
 */
function processMutation() {
    var usernameSpan;
    var userNamesDivsElements;

    // Last mutation was handeled
    if (mutationQueue.length == 0) {
        inProcessMutation = false;
        return;
    }

    // Handle mutations in queue
    inProcessMutation = true;
    var mutation = mutationQueue.shift();
    if (mutation.addedNodes.length) {
        // Pass each node of addedNodes
        for (let addedNode of mutation.addedNodes) {
            // If node is HTMLElement- check if it's a span with usernameClass and starts with @ -> it's our username
            if (addedNode instanceof HTMLElement) {

                // Tweet/ reTweet
                userNamesDivsElements = addedNode.querySelectorAll(attributeSelectorClassification1);
                userNamesDivsElements.forEach(element => {
                    // From tweets/ retweets
                    for (let i = 0; i < spanOptions1.length; i++) {
                        usernameSpan = element.querySelector(spanOptions1[i]);
                        if (usernameSpan)
                        {
                            // Found the right span
                            processUserSpan(usernameSpan);
                            break;
                        }
                    }
                });

                // Follows/ Following/ Likes/ Reposted By/Search
                userNamesDivsElements = addedNode.querySelectorAll(attributeSelectorClassification2);
                userNamesDivsElements.forEach(element => {
                    // From Follows/ Following/ Likes/ Reposted By/ Search section
                    for (let i = 0; i < spanOptions2.length; i++) {
                        usernameSpan = element.querySelector(spanOptions2[i]);
                        if (usernameSpan)
                        {
                            // Found the right span
                            processUserSpan(usernameSpan);
                            break;
                        }
                    }
                });

                // Profile
                userNamesDivsElements = addedNode.querySelectorAll(attributeSelectorClassification3);
                userNamesDivsElements.forEach(element => {
                    for (let i = 0; i < spanOptions3.length; i++) {
                        usernameSpan = element.querySelector(spanOptions3[i]);
                        if (usernameSpan)
                        {
                            // Found the right span
                            processUserSpan(usernameSpan);
                            break;
                        }
                    }
                });
            }      
        }
    }

    // Take care of next mutation in queue (if exist)
    processMutation();
}
