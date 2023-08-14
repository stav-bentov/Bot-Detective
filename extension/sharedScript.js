const MISSING = -2;
const UPDATED = 1;
const NOT_UPDATED = 0;
const STATUS = 'status';
const OK = 1;
const BOT_PREC_TYPE = 1;
const USER_BOT_TYPE = 2;

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