<p align="center">
  <img src="Photos/logo_img.png" width="300" />
</p>  

# Bot Detective Chrome Extension

## Description
Bot Detective is a machine learning project that classifies Twitter users as bots or not bots based on user metadata. This project was developed to help Twitter users distinguish between real users and automated accounts, which can be used for spamming, spreading false information, and manipulating public opinion.

- **Goals:**
  - Raise bot awerness.
  - Enchanse user's security.
  - Promote a more cautious and discerning approach.

#### Model Architecture
The user classification is performed by a Random Forest model, which utilizes the user's metadata collected through the Twitter API.
The ML model we created is based on the article:"Scalable and Generalizable Social Bot Detection through Data Selection", it uses 4 diffrent classified datasets of Twitter users that were manually labeled as bots or not bots based on their metadata, such as the number of followers, following, tweets and likes
The model was developed using Python and various libraries such as pandas and scikit-learn. 
The process of constructing the unified dataset is detailed in Build_Dataset.py. The resulting consolidated dataset is available at "Datasets/all_df.csv," while the individual datasets are stored within the "Datasets" folder.
For the model creation procedure, you can refer to the Build_model.py. This script also encompasses an analysis of the model's performance against various alternative classifiers.

## Features
Our extension include 2 main feature based on bot classification:
- Bot/Human indictor
  
<img src="https://github.com/stav-bentov/Twitter-Bot-Detector/blob/main/gifs/bots%20in%20reposted%20by.gif" width='500px'>
- Number of bots in 100 randomly chosen followers

<img src="https://github.com/stav-bentov/Twitter-Bot-Detector/blob/main/gifs/bot%20and%20followers.gif" width='500px'>
<img src="https://github.com/stav-bentov/Twitter-Bot-Detector/blob/main/gifs/all%20actions.gif" width='500px'>

#### Paper 
[Link to the paper]TODO: Put a link to the article

## Usage

To run our extension using the local server make sure that the followinf comments are underlined:

