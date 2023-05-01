# WORK IN PROGRESS ...

# Twitter-Bot-Detector

Twitter Bot Detector is a machine learning project that classifies Twitter users as bots or not bots based on user metadata. This project was developed to help people distinguish between real users and automated accounts, which can be used for spamming, spreading false information, and manipulating public opinion.

# Project Overview
The project consists of two main components: the machine learning model and the Chrome extension. 
The machine learning model we created is based on the article:"Scalable and Generalizable Social Bot Detection through Data Selection". 
The model was developed using Python and various libraries such as pandas and scikit-learn. The model was trained on a dataset of Twitter users that were manually labeled as bots or not bots based on their metadata, such as the number of followers, following, tweets and likes, using Random Forest. 
After training, the model was able to classify new Twitter users with accuracy of 96.1% according to five-fold cross-validation test.

# Future Development
Create a Chrome extension using Flask and Redis. The extension will add a small label near each Twitter user's name indicating whether they are classified as a bot or not. The extension will work by sending the Twitter user's metadata to the machine learning model, which then returns a classification label. The label will be display next to the user's name on the Twitter website.
