from access_keys import bearer_token, consumer_key, consumer_secret, access_token_key, access_token_secret
import tweepy 
import sys 
from datetime import datetime
import pickle # for loading the model
import pandas as pd
from nltk.util import bigrams
from collections import Counter
import math
import time
import requests
import os
import json
import random

# ========================================== Define variables ========================================== #
sys.stdin.reconfigure(encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')

default_image_url = "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png"

client = tweepy.Client(bearer_token, wait_on_rate_limit = True)

# Define calculation of every feature [User will be response.data]
calculations = {"profile_use_background_image": lambda res: 1 if res else 0, # boolean -> 0/1
                "verified": lambda res: 1 if res else 0, # boolean -> 0/1
                "division": lambda x1,x2: x1/x2,
                "length": lambda str: len(str),
                "count_digits": lambda str: sum(char.isdigit() for char in str),
                "likelihood":  lambda str: likelihood(str),
                "user_age": lambda probe_time, created_at: (probe_time - created_at).total_seconds() / 3600 
                }

# Exsiting metadata
user_metadata_names = ["statuses_count", "followers_count", "friends_count", "favourites_count", "listed_count"]

# Calculted features
user_derived_features = {"profile_use_background_image": [1, "profile_use_background_image", calculations["profile_use_background_image"]],
                         "verified": [1, "verified", calculations["verified"]],
                         "tweet_freq": [2, "statuses_count", "user_age", calculations["division"]],
                         "followers_growth_rate": [2, "followers_count", "user_age", calculations["division"]],
                         "friends_growth_rate": [2, "friends_count", "user_age", calculations["division"]],
                         "favourites_growth_rate": [2, "favourites_count", "user_age", calculations["division"]],
                         "listed_growth_rate": [2, "listed_count", "user_age", calculations["division"]],
                         "followers_friends_ratio": [2, "followers_count", "friends_count", calculations["division"]],
                         "screen_name_length": [1, "screen_name", calculations["length"]],
                         "num_digits_in_screen_name": [1, "screen_name", calculations["count_digits"]],
                         "name_length": [1, "name", calculations["length"]],
                         "num_digits_in_name": [1, "name", calculations["count_digits"]],
                         "description_length": [1, "description", calculations["length"]],
                         "screen_name_likelihood": [1, "screen_name", calculations["likelihood"]]}

# =============================================================================================== #
# ========================================== Functions ========================================== #
# =============================================================================================== #

def likelihood(str: str) -> float:
    """
        Input: string (screen_name/ name)
        Returns: The likelihood of the given string.
                 likelihood is defined by the geometric-mean likelihood of all bigrams in it.
    """
    # Create a list of all bigrams in str
    bigrams_list = list(bigrams(str))
    # Create a Dictonary with each bigram frequency
    bigrams_likelihood = Counter(bigrams_list)

    # Calculte number of all bigrams and number of different bigrams
    num_bigrams = len(bigrams_list)
    num_dif_bigrams = len(bigrams_likelihood)
    
    biagrams_mul = math.prod([value * (1/num_bigrams) for value in bigrams_likelihood.values()])

    # geometric-mean defenition
    return math.pow(biagrams_mul , (1/num_dif_bigrams))

def load_model():
    """
        Loads the model from detector_model.pkl
    """
    with open('detector_model.pkl', 'rb') as f: # rb = read binary
        model = pickle.load(f) # Load the model from the file
    return model

# TODO: later on, consider making a function for prediction of bunch of users
def model_predict_if_user_is_bot(model, user_metadata):
    """
        Input: 1) model. 2) user_metadata = a dictonary with features as keys and their corresponding values of the username
        Return dict:{classification:(0/1), accuracy:(of prediction)}
    """
    # Create a dataframe with the user_metadata
    df_user_data = pd.DataFrame(user_metadata, index=[0]) 

    # Predict the target
    prediction = model.predict(df_user_data) # Prediction [(0/1),...,] is list of predictions for many users, we only have 1 user
    # Get prediction and accuracy
    probability = model.predict_proba(df_user_data) # Probability [[0.1,0.9],...] is list of probabilities for many users, we only have 1 user
    classification = int(prediction[0])
    accuracy = (probability[0][classification]) * 100 # convert to percentage
    # stay with 2 digits after the decimal point
    accuracy = float("{:.2f}".format(accuracy))
    return {'classification':classification,'accuracy':accuracy} # Return dict:{classification:(0/1), accuracy:(of prediction)}

def get_features(response_data):
    """
        Input: gets a dictonary with all metadata of current username
        Returns: a dictonary with features as keys and their corresponding values of the username
    """
    user_metadata = {}
    # Get the metadata from response.data and add to user_metadata
    for metadata_name in user_metadata_names:
        user_metadata[metadata_name] = response_data[metadata_name]

    # Calculate user_age for next features
    probe_time = datetime.now().replace(microsecond=0)

    datetime_format = '%a %b %d %H:%M:%S %z %Y' 
    #created_at = datetime.fromisoformat(response_data["created_at"]).replace(tzinfo=None)
    created_at = datetime.strptime(response_data["created_at"], datetime_format).replace(tzinfo=None)
    user_age = calculations["user_age"](probe_time, created_at)

    # Add derived features to user_metadata
    for feature, calc in user_derived_features.items():
        """if (feature == "favourites_growth_rate"):
            user_metadata[feature] = user_metadata["favourites_count"] / user_age
            continue"""
        num_variables = calc[0]
        calc_function = calc[-1]
        x1 = response_data[calc[1]]
        if (num_variables == 1):
            user_metadata[feature] = calc_function(x1)
        else: #Else- num_variables == 2
            # max- Take care of a case where x2 = 0 (will get a devision by 0)
            x2 = max(user_age if calc[2] == "user_age" else response_data[calc[2]], 1)
            user_metadata[feature] = calc_function(x1, x2)
    return user_metadata

# !Not in use!
def detect_users(users):
    """
        Input: users- a list of usernames
        Returns: a dictonary with keys: usernames, values: user's classification (bot = 1, human = 0)
    """
    user_fields_param = ["name", "created_at", "description", "verified", "profile_image_url", "public_metrics", "id"]
    
    # client.get_users can get up to 100 users in a single request.
    req_max_size = 100
    res = {}
    
    # client.get_users can get up to 100 users, so we will separate our calls to up to 100
    for i in range(0, len(users), req_max_size):
        users_batch = users[i:i + req_max_size]

        # Creates a request with get_user - get response object which contains user object by username
        # RECALL: client.get_users is synchronous by default
        users_response = client.get_users(usernames = users_batch, user_fields = user_fields_param)
        time.sleep(0.5)
        for response in users_response.data:
            meta = get_features(response.data)
            res[response["username"]] = model_predict_if_user_is_bot(load_model(), meta)
    
    return res

# !Not in use!
def detect_user(username):
    meta = get_features(username)
    return model_predict_if_user_is_bot(load_model(), meta)

# !Not in use!
def detect_user_model(model, username):
    meta = get_features(username)
    return model_predict_if_user_is_bot(model, meta)

def detect_users_model(model, users, get_percentage = False):
    """
        Input: model- the model that classify our users
               users- a list of usernames
               get_percentage- When True- calculate number of bot and human classification
        Returns: a dictonary with keys: usernames, values: {classification:user's classification (bot = 1, human = 0), accuracy:accuracy of prediction]
                [if get_percentage == True then returns a list: [number of bots, number of humans]]
    """

    # users lookup can get up to 100 users in a single request.
    req_max_size = 100
    res = {}
    # bot_prec[0] = number of humans, bot_prec[1] = number of bots
    bot_prec = [0, 0]
    
    # client.get_users can get up to 100 users, so we will separate our calls to up to 100
    for i in range(0, len(users), req_max_size):
        users_batch = users[i:i + req_max_size]

        # Prepare url req
        users_batch = ','.join(users_batch)
        usernames_req = f"screen_name={users_batch}"
        url = f"https://api.twitter.com/1.1/users/lookup.json?{usernames_req}&include_entities=false"

        # Creates a request with get_user - get response object which contains user object by username
        # RECALL: client.get_users is synchronous by default
        users_response = send_Twitter_API_request(url)
        print(users_response)
        for user in users_response:
            meta = get_features(user)
            is_bot = model_predict_if_user_is_bot(model, meta)
            res[user["screen_name"]] = is_bot

            if (get_percentage):
                bot_prec[is_bot["classification"]] += 1
    
    if (get_percentage):
        return res, bot_prec

    return res

def bearer_oauth(r):
    """
    Method required by bearer token authentication.
    """
    r.headers["Authorization"] = f"Bearer {bearer_token}"
    return r

def send_Twitter_API_request(url):
    """
        Input: url- the url request 
        Returns: response
    """
    # Make the request
    response = requests.request("GET", url, auth=bearer_oauth,)
    print(response)
    print(response.text)
    if response.status_code != 200:
        """raise Exception(
            f"Request returned an error: {response.status_code} {response.text}"
        )"""
        print(f"Request returned an error: {response.status_code} {response.text}")
        return None
    
    return response.json()

def get_bots_in_followers(model, username):
    """
        Input: model- The model that classify our users
               username- The username whose followers we want to examine
        Returns: A dictonary with keys: usernames, values: {classification:user's classification (bot = 1, human = 0), accuracy:accuracy of prediction]
                 and a list: [number of bots, number of humans]]
    """
    screen_name_req = f"screen_name={username}"

    #v1
    url = f"https://api.twitter.com/1.1/followers/ids.json?{screen_name_req}"
    #v2 TODO: Need to check this!
    # ! Maximum users per response: 1000 user objects per page
    #url = f"https://api.twitter.com//2/users/:id/followers?{screen_name_req}"

    users_ids = send_Twitter_API_request(url)["ids"]
    print("users_ids= ", users_ids)

    if (len(users_ids) == 0):
        return 0, [0,0]
    users_sample = random.sample(users_ids, min(100, len(users_ids)))


    print("users_sample= ", users_sample)
    res = {}
    # bot_prec[0] = number of humans, bot_prec[1] = number of bots
    bot_prec = [0, 0]
    
    users_sample = ','.join(map(str, users_sample))
    print("users_sample= ", users_sample)
    ids_req = f"user_id={users_sample}"

    #v1
    url = f"https://api.twitter.com/1.1/users/lookup.json?{ids_req}&include_entities=false"
    #v2
    #url = f"https://api.twitter.com/2/users/lookup.json?

    # Creates a request with get_user - get response object which contains user object by username
    # RECALL: client.get_users is synchronous by default
    users_response = send_Twitter_API_request(url)
    for user in users_response:
        meta = get_features(user)
        is_bot = model_predict_if_user_is_bot(model, meta)
        res[user["screen_name"]] = is_bot
        bot_prec[is_bot["classification"]] += 1
    
    return res, bot_prec
    
def get_bots_in_likes(model, tweet_id):
    """
        Input: model- The model that classify our users
               tweet_id- The ID of the tweet whose likers we want to examine.
        Returns: A dictonary with keys: usernames, values: {classification:user's classification (bot = 1, human = 0), accuracy:accuracy of prediction]
                 and a list: [number of bots, number of humans]]
    """
    id_req = f"screen_name={tweet_id}&user.fields=username"
    url = f"https://api.twitter.com/2/tweets/:id/?{id_req}"

    liking_users = send_Twitter_API_request(url)["data"]
    # From list of dict with a key "username" to a list of usernames
    liking_users = [item["username"] for item in liking_users]

    # Classify users
    return (detect_users_model(model, liking_users, True))

model = load_model()
"""
result = get_bots_in_followers(model, "barak_ehud")
print(result)
result = get_bots_in_likes(model, "1686067421872865283")
print(result)
# meta = get_metadata("YairNetanyahu")
# print(model_predict_if_user_is_bot(load_model(), meta))"""