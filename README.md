<div style="display: flex; align-items: flex-start;">
    <h1 style="flex: 1;">Bot Detective Chrome Extension</h1>
    <div style="flex: 1; text-align: right;">
      <img src="extension/img/ex_img.png" width="300"/>
    </div>
</div>

## Introduction
Bot Detective is a machine learning project that classifies Twitter users as bots or not bots based on user metadata. This project was developed to help people distinguish between real users and automated accounts, which can be used for spamming, spreading false information, and manipulating public opinion.

#### Model Architecture
The classification of the user is generated by a Random Forest model based on user's metadata that is taken by Twitter API. 
The ML model we created is based on the article:"Scalable and Generalizable Social Bot Detection through Data Selection", it uses 4 diffrent classified datasets of Twitter users that were manually labeled as bots or not bots based on their metadata, such as the number of followers, following, tweets and likes
The model was developed using Python and various libraries such as pandas and scikit-learn. 

#### Paper 
[Link to the paper]TODO: Put a link to the article

## Usage

To run our extension using the local server make sure that the followinf comments are underlined:
