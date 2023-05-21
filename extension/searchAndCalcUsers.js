// Class of usernames (and others)
const usernameClass = 'span.css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0';

// Every mutation will be filled and then erased
var mutationDict = {};
// Main dictonary, will be filled with users
var usernamesMainDict ={};

// Const for bot/human/ not calculated yet-unknown 
const unknown = -1;
const bot = 1;
const human = 0;



// function to create the bot_image element
function createBotImage() {
    var imgElement = document.createElement('img');
    imgElement.src = 'img/bot.png'
    imgElement.style.width = '18px';
    imgElement.style.height = '18px';
    return imgElement; 
}

// Sign of bot, will be added to each suspected bot
// function that its input is string username. and it find the element with id = username and puts the imgElement near it
function addSign(user) {    
    var usernameElement = document.getElementById(user);
    if (usernameElement) { 
        var imgElement = createBotImage();
        usernameElement.parentNode.insertBefore(imgElement, usernameElement.nextSibling); // upload the image

        // TODO: make the image appear (the upper lines) and delete the lower lines
        // make the username bold and red and writ "-bot" near it
        usernameElement.style.fontWeight = 'bold';
        usernameElement.style.color = 'red';
        usernameElement.textContent = usernameElement.textContent + '-bot';
    }
    else {
        console.log(`usernameElement is null for ${user}`);
    }
}

/* TODO: Think about making the API request get bunch of users*/
function makeRequest(users) {
    users.forEach( async user => {
        if (!(user in usernamesMainDict)){

            // sleep for 5 seconds
            await new Promise(r => setTimeout(r, 5000));


            fetch(`http://127.0.0.1:5000/isBot/${user}`)
            .then(response => response.json())
            .then(data => {
                console.log(`calculated ${user}, got result: ${data[user]}`);
                usernamesMainDict[user] = data[user];
                mutationDict[user] = data[user]; // because we want to add the bot sign to the new users in the mutation
                console.log(usernamesMainDict);
            })
            .catch(error => {
                console.log(`error for ${user}`);
            });
        }
        else {
            console.log(`${user} is already calculated`);
        }
    });
}

/*Function to handle the mutation:
    Pass over any mutation and get the username- from usernameClass and starts with @*/ 
function handleMutation(mutations) {
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
                        mutationDict[username] = unknown;
                        
                        // TODO: Tamir I did it just for test need to think of other idea or elaborate this one
                        usernameSpan.id = username;
                    });
                }
            }
        }
    });

    // Get users of current mutation
    const mutationUsers = Object.keys(mutationDict); // mutationUsers is an array of usernames strings
    if (mutationUsers.length) {
        // calculate if users bots/not with API requests
        makeRequest(mutationUsers);
    }
    // get all usernames that are bots in current mutation
    const mutationBots = mutationUsers.filter(username => mutationDict[username] === bot);
    // for every bot in current mutation add bot sign
    mutationBots.forEach(bot => addSign(bot));
    // Clear mutationDict
    mutationDict = {};
}
  
// Create a new MutationObserver instance
const observer = new MutationObserver(handleMutation);
  
// Start observing the desired DOM changes
observer.observe(document, {childList: true, 
                            subtree: true,
                            classList: true });

/*if (mutation.type === 'childList') {
        for (let addedNode of mutation.addedNodes) {
          if (addedNode.classList && addedNode.classList.contains('span.css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0')) {
            console.log('Element with class added:', addedNode);
          }
        }
}*/



