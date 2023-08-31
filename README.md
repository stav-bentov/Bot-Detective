<p align="center">
  <img src="Photos/logo_img.png" width="300" />
</p>  

# Bot Detective Chrome Extension

## Description
Bot Detective is a machine learning project that classifies Twitter users as bots or not bots based on user metadata. This project was developed to help Twitter users distinguish between real users and automated accounts, which can be used for spamming, spreading false information, and manipulating public opinion.

- **Goals:**
  - Raise bot awerness.
  - Enchanse user's security.
  - Promote a more cautious and critical approach when interacting with unfamiliar users.

#### Model Architecture
The user classification is performed by a Random Forest model, which utilizes the user's metadata collected through the Twitter API.
The ML model we created is based on the article:"Scalable and Generalizable Social Bot Detection through Data Selection", it uses 4 diffrent classified datasets of Twitter users that were manually labeled as bots or not bots based on their metadata, such as the number of followers, following, tweets and likes.
The model was developed using Python and various libraries such as pandas and scikit-learn. 
**Dataset Building:**  The process of constructing the unified dataset is detailed in Build_Dataset.py. The resulting consolidated dataset is available at "Datasets/all_df.csv," while the individual datasets are stored within the "Datasets" folder.
**Model Construction:** For the model creation procedure, you can refer to the Build_model.py. This script also encompasses an analysis of the model's performance against various alternative classifiers.

## Features
Our extension include 2 main feature based on bot classification:
- **Bot/Human indictor:** As users browse through their Twitter feed, they will seamlessly come across visual indicators displaying "Bot" or "Human" sign—generated by the ongoing classification process of the model.<br/><br/> We can see an example in "Reposted By" section: <br/> <p align="center">  <img src="https://github.com/stav-bentov/Twitter-Bot-Detector/blob/main/Photos/bothuman.png" align="center"> </p>  
- **Number of bots in 100 randomly chosen followers:** For every user, an analysis of the amount of bots among 100 randomly selected followers is displayed in Profile page.<p align="center"><img src="https://github.com/stav-bentov/Twitter-Bot-Detector/blob/main/Gifs/bot%20and%20followers.gif"></p>

#### Paper
Pik-Mai Hui Filippo Menczer Kai-Cheng Yang, Onur Varol. 2019. Scalable and Generalizable Social Bot Detection through Data Selection. (2019).
https://doi.org/10.1609/aaai.v34i01.5460 


## Requirements:
Python 3.8 with the following dependencies:
- fastapi
- uvicorn
- redis
- pickle
- pandas
- nltk.util
- requests
- numpy
- matplotlib
- sklearn.ensemble
- sklearn.model_selection
- sklearn.naive_bayes
- sklearn.calibration
- sklearn.inspection
- sklearn.metrics
- seaborn

## Usage
For using the extension follow the next steps:
1. Clone reposetory.
2. Open Chrome Extensions on developer mode.
3. Click on Load unpack and choose the cloned project.
4. To run our extension using the local server make sure that the following comments are underlined:
- In API_requests.py: 
Make this lines in a comment:
``` 
    app.add_middleware(HTTPSRedirectMiddleware)  # Redirect HTTP to HTTPS
   ...
    uvicorn.run(app, host="0.0.0.0", port=3003, ssl_keyfile="./server.key", ssl_certfile="./server.crt")
```
Make sure this line is not in comment:
``` 
  uvicorn.run(app, port=8000)
```
- In searchAndCalcUsers.js:
Make this lines in a comment:
``` 
  const response = await fetch(`https://34.165.1.66:3003/isBot/${Object.keys(usersOnRequestDict).join(',')}`);
```
Make sure this line is not in comment:
``` 
  const response = await fetch(`http://127.0.0.1:8000/isBot/${Object.keys(usersOnRequestDict).join(',')}`);
```
- In showBotPrec.js:
Make this lines in a comment:
``` 
  response = await fetch(`https://34.165.1.66:3003/followersBots/?username=${username}&classification=${requestClassification}&followersPrec=${requestFollowersPrec}`);
```
Make sure this line is not in comment:
``` 
  response = await fetch(`http://127.0.0.1:8000/followersBots/?username=${username}&classification=${requestClassification}&followersPrec=${requestFollowersPrec}`);
```
*note: For running our Google Chrome server- do the oopisite (regarding the comments)*
5. Activate Resid in the server (local or our Google Cloud Server):
```
  sudo service redis-server start
  password: [enter password]
  redis-cli
```
6. Run on the server:
``` 
    python API_requests.py
```
7. Go back to Chrome Extension for developer and activate the extension.
8. You can browse through Twitter and have fun with Bot Detective.

## Visual Overview
- #### User's classifications
While browsing- indicators appear, each accompanied by a popup displaying warnings and the classification accuracy.
<p align="center">  <img src="Gifs/bots in reposted by.gif" align="center"> </p> 

- #### General Browsing Experience
<p align="center">  <img src="Gifs/part action gif.gif" align="center"> </p> 
