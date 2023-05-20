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

// Sign of bot, will be added to each suspected bot
const imgElement = document.createElement('img');
imgElement.src = 'img/bot.png';

/* Gets user= string of username, assumed the element id of username = user, add bot sign */
function addSign(user) {
   const userElement = document.getElementById('user');
   userElement.appendChild(imgElement);
}

/* TODO: Think about making the API request get bunch of users*/
function makeRequest(users) {
    users.forEach( user => {
        if (!(user in usernamesMainDict)){
            fetch(`http://127.0.0.1:5000/isBot/${user}`)
            .then(response => response.json())
            .then(data => {
                console.log(`calculated ${user}, got result: ${data[user]}`);
                usernamesMainDict[user] = data[user];
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
                        
                        // TODO: Tamir I did ot just for test need to think of other idea or elaborate this one
                        //usernameSpan.id = username;
                    });
                }
            }
        }
    });

    // Get users of current mutation
    const mutationUsers = Object.keys(mutationDict);
    if (mutationUsers.length) {
        // calculate if users bots/not with API requests
        makeRequest(mutationUsers);
    }
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



