/* DESCRIPTION:
    A content script that contains functions and variables shared by both searchAndCalcUsers and showBotPrec content scripts, as it is utilized by both of them.*/

/* ============================================================================= */
/* ============================ Variable Defenition ============================ */
/* ============================================================================= */
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

// ========================================================
// ========================= Text =========================
// ========================================================
const botPopupTextPart1 = `Caution: Our model suggests this account may have automated behavior with `;
const botPopupTextPart2 = `% accuracy.<br/>Avoid sharing personal information for your own security. Stay safe online.<br/><em>For reliable information about bots, click the sign.</em>`;
const humanPopupTextPart1 = `Note: Our model confidently identifies this account as human, with `;
const humanPopupTextPart2 = `% accuracy.<br/>Feel secure interacting, but remember to be careful and minimize information sharing.<br/><em>For reliable information about bots, click the sign.</em>`;
const informativePopupId = "informativePopup";
const informativePopupContent = `
<h1>Bot Awareness: Educate Yourself on the Risks</h1>
<p style="text-align: left;">Bots are a threat to economic, security, social, and political stability. They spread misinformation, amplify extremist opinions, and produce spam.
<br/><br/><u>To provide you with credible insights into some of these threats, we've gathered information from articles, news sources, and studies.</u></p>

<p style="text-align: left;"><strong>Political Impact - Influence on US Elections:</strong></p>
<blaockquote cite="https://time.com/5286013/twitter-bots-donald-trump-votes/" style="color:#005fa6;">“Twitter bots may have altered the outcome of two of the world’s most consequential elections in recent years, according to an economic study.”</blaockquote>
<div style="text-align: right;">&mdash; <cite><a href="https://time.com/5286013/twitter-bots-donald-trump-votes/" style="color: #000; text-decoration: none;">USCNews</a></cite></div>
<br/>
<blaockquote cite="https://www.cjr.org/the_media_today/nature_study_trump_bots_twitter.php" style="color:#005fa6;">“The argument—in congressional hearings and academic treatises alike, not to mention on social media—was that “fake news” spread by Russian trolls helped get Trump elected ... Exposure to Russian disinformation, it found, was heavily concentrated, with 1 percent of Twitter users accounting for 70 percent of exposure, which was also concentrated among users who strongly identified as Republicans.”</blaockquote>
<div style="text-align: right;">&mdash; <cite><a href="https://www.cjr.org/the_media_today/nature_study_trump_bots_twitter.php" style="color: #000; text-decoration: none;">Columbia Journalism Review</a></cite></div>

<p style="text-align: left;"><strong>Financial Impact - Cynk Stock Case:</strong></p>
<blaockquote cite="https://news.usc.edu/103901/were-in-a-digital-world-filled-with-lots-of-social-bots/" style="color:#005fa6;" >“Back in 2014, the social media company Cynk had an exceptional day on the market: The price of its penny-stock shares jumped in value by more than 25,000 percent, driving its value up to $5 billion ... The key to Cynk’s rise was a suspicious Twitter storm advertising its surging stock price. A small army of accounts all seemed to be tweeting the same information — almost as if it was part of a coordinated network.”</blaockquote>
<div style="text-align: right;">&mdash; <cite><a href="https://news.usc.edu/103901/were-in-a-digital-world-filled-with-lots-of-social-bots/" style="color: #000; text-decoration: none;">USCNews</a></cite></div>

<p style="text-align: left;"><strong>Security Impact - Use by Extremist Groups:</strong></p>
<blaockquote cite="https://www.brookings.edu/wp-content/uploads/2016/06/isis_twitter_census_berger_morgan.pdf" style="color:#005fa6;" >“ISIS uses several practices designed to amplify its apparent support on Twitter, including "bots"”</blaockquote>
<div style="text-align: right;">&mdash; <cite><a href="https://www.brookings.edu/wp-content/uploads/2016/06/isis_twitter_census_berger_morgan.pdf" style="color: #000; text-decoration: none;">J.M. Berger and Jonathon Morga</a></cite></div>

<p style="text-align: left;"><strong>Privacy Concerns - Creation of Fake Profiles:</strong></p>
<blaockquote cite="https://nypost.com/2023/08/24/scientists-found-1140-ai-bots-on-x-creating-fake-profiles/" style="color:#005fa6;" >“Scientists revealed in a study last month that X, formerly known as Twitter, has a real bot problem, with about 1,140 artificial intelligence-powered accounts that “post machine-generated content and steal selfies to create fake personas.””</blaockquote>
<div style="text-align: right;">&mdash; <cite><a href="https://nypost.com/2023/08/24/scientists-found-1140-ai-bots-on-x-creating-fake-profiles/" style="color: #000; text-decoration: none;">NEW YORK POST</a></cite></div>

<p style="text-align: left;"><strong>Financial Impact on users - Fake Cryptocurrencies and Theft:</strong></p>
<blaockquote cite="https://nypost.com/2023/08/24/scientists-found-1140-ai-bots-on-x-creating-fake-profiles/" style="color:#005fa6;" >“Bot accounts attempt to convince people to invest in fake cryptocurrencies, and have even been thought to steal from existing crypto wallets, scientists Kai-Cheng Yang and Filippo Menczer found.”</blaockquote>
<div style="text-align: right;">&mdash; <cite><a href="https://nypost.com/2023/08/24/scientists-found-1140-ai-bots-on-x-creating-fake-profiles/" style="color: #000; text-decoration: none;">NEW YORK POST</a></cite></div>
`;

/* ============================================================================= */
/* ================================== "MAIN" =================================== */
/* ============================================================================= */
const informativePopup = createInformationPopup();


/* ============================================================================= */
/* ================================= FUNCTIONS ================================= */
/* ============================================================================= */

/**
 * Creates the informative popup and returns it
 */
function createInformationPopup() {
    const InformativePopup = document.createElement("div");
    InformativePopup.id = informativePopupId;

    // Hidden by default
    InformativePopup.style.visibility = "hidden";

    // Disappear on click
    InformativePopup.addEventListener("click", function (event) {
        console.log("clicked!");
        if (event.target == InformativePopup)
            InformativePopup.style.visibility = "hidden";
    });

    // Design...
    InformativePopup.style.position = "fixed";
    InformativePopup.style.top = "0";
    InformativePopup.style.left = "0";
    InformativePopup.style.width = "100%";
    InformativePopup.style.height = "100%";
    InformativePopup.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    InformativePopup.style.display = "flex"; 
    InformativePopup.style.justifyContent = "center"; 
    InformativePopup.style.alignItems = "center";

    const content = document.createElement("div");
    content.style.backgroundColor = "#fff";
    content.style.padding = "20px";
    content.style.borderRadius = "8px";
    content.style.width = "70%";
    content.style.height = "70%";
    // For scorlling
    content.style.overflow = "auto"; 

    const infoText = document.createElement("div");
    infoText.style.fontFamily = 'TwitterChirp';
    infoText.innerHTML = informativePopupContent;
  
    infoText.style.color = "#000"; // Text color
    infoText.style.textAlign = "center"; // Text alignment

    content.appendChild(infoText);
    InformativePopup.appendChild(content);
    document.body.appendChild(InformativePopup);

    return InformativePopup;
}

/**
 * Check if user is saved in local storage and if the required data is up to date.
 * @param {string} localStorageUserKey          Key to search in local storage
 * @param {int} searchType                   Can be bot precentage(BOT_PREC_TYPE) or classification result(USER_BOT_TYPE)
 * @returns classification/ bot prec (if exist and updated) [classification: 0 - human, 1- bot | bot prec: 0-100]
 *         else- MISSING
 */
function checkAvailabilityAndExpiration(localStorageUserKey, searchType) {
    console.log(`checkAvailabilityAndExpiration for ${localStorageUserKey}`);
    var currentDate = new Date();
    var userStorageValue = localStorage.getItem(localStorageUserKey);

    // User classification(/Bot precentages of user) is done and saved in local storage
    if (userStorageValue != null) {
        userDict = JSON.parse(userStorageValue);
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
 * Creates sign image element with popup according to clasisfication
 * @param {int} accuracy     classification accuracy
 * @param {int} isBot        classification
 * @returns the container of created image element
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

    // Function to hide the popup
    function showInformativePopup() {
        informativePopup.style.visibility = "visible";
        hidePopup();
    }
    /* =============================== END =============================== */

    // Add event listeners to the image element
    imgElement.addEventListener('mouseover', function(event) {
        updatePopupPosition(event);
        showPopup();
    });

    imgElement.addEventListener('mousemove', updatePopupPosition);
    imgElement.addEventListener('mouseout', hidePopup);
    imgElement.addEventListener('click', showInformativePopup);

    // Add all to container
    container.appendChild(imgElement);
    document.body.appendChild(popup);

    return container; 
}

/**
 * Adds bot sign near username.
 * @param {string} elementId        id of the element we want to add bot/human sign near
 * @param {int} isBot            classification (1= bot, 0-human)
 * @param {int} accuracy 
 */
function addSign(elementId, isBot, accuracy) {  
    console.log(`In add sign for ${elementId}`);
    var usernameElement = document.getElementById(elementId);
    if (usernameElement) { 
        // ASSUMPTION: It has to have STATUS attribute
        if (usernameElement.hasAttribute(STATUS) && usernameElement.getAttribute(STATUS) == NOT_UPDATED) {
            var imgElement = createBotHumanImage(accuracy, isBot);

            // Added this for the situation where we move from profile page to another and the image doesnt deleted!
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
