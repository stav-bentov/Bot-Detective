# Extension

In this folder, you'll find the Chrome Extension code. 

# Files Description
- *manifest.json* The configuration and settings of the extension.
- *searchAndCalcUsers.js* This content script is responsible for searching for @username and adding a corresponding sign, along with displaying information and warnings via a popup.
- *showBotPrec.js* This content script is responsible for adding information to users' followers. It activates every time the background script, `urlChanged.js`, calls it upon URL changes.
- *sharedScript.js* This content script contains variable and functions that are shared between `searchAndCalcUsers.js` and `showBotPrec.js`.
- *urlChanged.js* This background script is activated when `showBotPrec.js` sends it a message. Once activated, it listens to URL changes and alerts `showBotPrec.js` accordingly
