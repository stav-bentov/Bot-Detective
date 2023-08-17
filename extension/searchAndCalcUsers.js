// Usernames from tweets and retweets
const attributeSelectorClassification1 = '[data-testid="User-Name"]';
// Usernames from "follow suggestion"
const attributeSelectorClassification2 = '[data-testid="UserCell"]';
// Usernames from profile page
const attributeSelectorClassification3 = '[data-testid="UserName"]';

/*const popupText = `This user account is suspected to be a bot. <br>
                   Be aware that the account's activities may not be performed by a human user. <br>
                   Please refrain from sharing personal or sensitive information`;*/
const botPopupTextPart1 = `Caution: Our model suggests this account may have<br>
                            automated behavior with `;
const botPopupTextPart2 = `% accuracy.<br>Avoid sharing personal info  for your security.<br>Stay safe online.`;

const humanPopupTextPart1 = `Note: Our model confidently identifies this account as human, with `;
const humanPopupTextPart2 = `%<br>accuracy. Feel secure interacting, but remember to be careful<br>and minimize information sharing.`;
        
// Every mutation will be filled and then erased
var mutationDict = {};
// In every X seconds we will copy mutationDict to usersOnRequestDict and run makeRequest on users, the results will be there
var usersOnRequestDict = {};
var countId = 0;

var inProcessMutation = false;
var inIntervals = false;
var interval = 3000;
// Const for bot/human/ not calculated yet-unknown 
const bot = 1;
const human = 0;


// Insert every mutation to queue and ensure 
let mutationQueue = [];

// Clear local storage
localStorage.clear(); 


/* ============================ "MAIN" ============================ */
// Create a new MutationObserver instance
const observer = new MutationObserver(handleMutation);
setObserver();
setInterval(async () => { await intervalFunc();}, interval);
/* ============================ END "MAIN" ============================ */



/* ============================ FUNCTIONS ============================ */
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
 * and then calls makeRequests() to classify each user with API request to our server (that runs the model).
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

    console.log(usersOnRequestDict);
}

/**
 * Pass over usersOnRequestDict, for each bot user- adds a sign near the matching elementId.
 */
function setSigns(){
    console.log(JSON.stringify(usersOnRequestDict, null, 2));
    var result;
    for (var user in usersOnRequestDict){
        result = checkAvailabilityAndExpiration(user, USER_BOT_TYPE);
        if (result != MISSING) {
            console.log(JSON.stringify(usersOnRequestDict, null, 2));
            var accuracy = JSON.parse(localStorage.getItem(user)).accuracy;
            console.log(JSON.stringify(usersOnRequestDict, null, 2));
            console.log(usersOnRequestDict[user]);
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
        
        // API request for detect human/bot (runs the model on username)

        // For FastAPI
        // const response = await fetch(`http://127.0.0.1:8000/isBot/${Object.keys(usersOnRequestDict).join(',')}`);
        // For Flask
        //const response = await fetch(`http://127.0.0.1:5000/isBot/${user}`);
        // For TAMIR - VM Flask
        // const response = await fetch(`https://34.165.1.66:3003/isBot/${user}`);
        // For FastAPI - VM FastAPI
        const response = await fetch(`https://34.165.1.66:3003/isBot/${user}`);

        const data = await response.json(); // data is dict of dicts: {username:{classification:class, accuracy:acc}}
        console.log(`data recived: ${data}`);
        
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
 * Handles mutations: Insert mutation to queue- If no other mutation is being processed
 * sends it to process, else- end func (this mutation will be processed after the current)
 */
function handleMutation(mutations) {
    mutationQueue.push(...mutations);
    if (inProcessMutation)
        return;
    processMutation();
}

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
            console.log(`${username} is already calculated and got: ${userResult}`);
            var accuracy = JSON.parse(localStorage.getItem(username)).accuracy;
            console.log(`get in to addSign with ${usernameSpan.id}`);
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
    // Last mutation was handeled
    if (mutationQueue.length == 0) {
        inProcessMutation = false;
        return;
    }

    inProcessMutation = true;
    var mutation = mutationQueue.shift();
    if (mutation.addedNodes.length) {
        // Pass each node of addedNodes
        for (let addedNode of mutation.addedNodes) {
            // If node is HTMLElement- check if it's a span with usernameClass and starts with @ -> it's our username
            if (addedNode instanceof HTMLElement) {

                // Tweet/ reTweet
                var userNamesDivsElements = addedNode.querySelectorAll(attributeSelectorClassification1);
                userNamesDivsElements.forEach(element => {
                    // Get username
                    var usernameSpan = getUsernameSpan(element);
                    // Found required element
                    if(usernameSpan) {
                        processUserSpan(usernameSpan);
                    }
                    else
                        console.log(`no username in datatestid: ${element.innerHTML}`);
                });

                // Follows
                userNamesDivsElements = addedNode.querySelectorAll(attributeSelectorClassification2);
                userNamesDivsElements.forEach(element => {
                    var usernameSpan = element.querySelector("div > div.css-1dbjc4n.r-1iusvr4.r-16y2uox > div.css-1dbjc4n.r-1awozwy.r-18u37iz.r-1wtj0ep > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div.css-1dbjc4n.r-1awozwy.r-18u37iz.r-1wbh5a2 > div > a > div > div > span");
                    // Found required element
                    if(usernameSpan) {
                        processUserSpan(usernameSpan);
                    }
                    else
                        console.log(`no username in datatestid: ${element.innerHTML}`);
                });

                // Profile
                userNamesDivsElements = addedNode.querySelectorAll(attributeSelectorClassification3);
                userNamesDivsElements.forEach(element => {
                    var usernameSpan = element.querySelector("div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div.css-1dbjc4n.r-1awozwy.r-18u37iz.r-1wbh5a2 > div > div > div > span");
                    // Found required element
                    if(usernameSpan) {
                        processUserSpan(usernameSpan);
                    }
                    else
                        console.log(`no username in datatestid: ${element.innerHTML}`);
                });
            }      
        }
    }

    // Take care of next mutation in queue (if exist)
    processMutation();
}

function getUsernameSpan(element) {
    // From tweet
    var userNameSpan = element.querySelector('div.css-1dbjc4n.r-18u37iz.r-1wbh5a2.r-13hce6t > div > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs > a > div > span');
    if (userNameSpan)
        return userNameSpan;
    // From reTweet
    userNameSpan = element.querySelector("div > div.css-1dbjc4n.r-18u37iz.r-1wbh5a2.r-13hce6t > div > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs > div > div > span");
    if (userNameSpan)
        return userNameSpan;
    return null;
}


/*if (mutation.type === 'childList') {
        for (let addedNode of mutation.addedNodes) {
          if (addedNode.classList && addedNode.classList.contains('span.css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0')) {
            console.log('Element with class added:', addedNode);
          }
        }
}*/



