import pandas as pd
import sys
import nltk 
from collections import Counter
from nltk.util import bigrams
import math
from datetime import datetime

# setting python encoder to utf-8 to avoid encoding errors
sys.stdin.reconfigure(encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')

def add_file_input_into_all_df(featurs_fileName, target_fileName):
    """
        Input: fileName is a source of a dataset
        Updates the main dataframe named all_df with the required features and data
    """
    # read the target file into a dataframe
    target_df = pd.read_csv(target_fileName, sep='\t', names=['id', 'target'], index_col= 'id' , encoding='utf-8') # set id as index, add column names
    features_df = pd.read_json(featurs_fileName, encoding='utf-8') # read the input file into a dataframe
    
    for index, row in features_df.iterrows():
        # index - number of row in file_df
        # row - {created_at:"", user:{}}
        user = row['user']

        # create a new row for all_df
        new_row_index_in_all_df = all_df.index.size # number of rows in all_df
        new_row = {}

        # update user target (Bot/Not Bot)
        
        if user['id'] not in target_df.index: # if there is not target label for this user, ignore this user
            continue
        label = str(target_df.loc[user['id']]['target']) # get the target label
        if label.lower() == "bot": # if the target is 1 (Bot)
            new_row['target'] = 1
        else: # if the target is 0 (Human)
            new_row['target'] = 0

        # Add user metadata
        for user_meta in user_metadata:
            new_row[user_meta] = user[user_meta] # update metadata feature
        all_df.loc[new_row_index_in_all_df] = new_row

        # Calculte created_at
        # user_age = get_user_age(user[created_at])
        # Add derived features
        """for feature, calc in user_derived_features:
            if (calc[0] == 1):
                
            else:
            #else- calc[0] == 2"""


# TODO: discuss with Tamir
def likelihood(str: str) -> float:
    """
        Input: string (screen_name/ name)
        Returns: The likelihood of the given string.
                 likelihood is defined by the geometric-mean likelihood of all bigrams in it.
    """
    bigrams_list = list(bigrams(str))
    bigrams_likelihood = Counter(bigrams_list)
    num_bigrams = len(bigrams_list)
    num_dif_bigrams = len(bigrams_likelihood)
    biagrams_mul = math.prod(bigrams_likelihood.values()) * math.pow((1/num_bigrams), num_dif_bigrams)

    return math.pow(biagrams_mul , (1/num_dif_bigrams))

# def get_user_age(created_at):
#     """
#         Input: created_at (from dataset)
#         Returns: The hour difference between probe_time and created_at
#                  The user age is defined as the hour difference between
#                  the probe time (when the query happens) and the 
#                  creation (created_at field) time of the user.
#     """
#     probe_time = datetime.now()
#     hour_difference =  (probe_time - created_at).total_seconds() / 3600
#     return hour_difference

# all the user metadata we want to extract from the input files
user_metadata = ["statuses_count", "followers_count", "friends_count", "favourites_count", "listed_count",
                  "default_profile", "profile_use_background_image", "verified"]

# Define calculation according to the article. 
calculations = {"division": lambda x1,x2: x1/x2,
                "length": lambda str: len(str),
                "count_digits": lambda str: sum(char.isdigit() for char in str),
                "likelihood":  lambda str: likelihood(str)}

user_derived_features = {"tweet_freq": [2, "statuses_count", "user_age", calculations["division"]],
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

date_format = '%a %b %d %H:%M:%S +0000 %Y'
created_at = "created_at"
# notice it doesn't include -varol- because it is only labeling Bot/Not Bot
# and doesn't include -cresci17-
# format is: (input_fileName, target_fileName)
input_fileNames = [("./Datasets/botometer-feedback-2019/botometer-feedback-2019_tweets.json", "./Datasets/botometer-feedback-2019/botometer-feedback-2019.tsv"),
                   ("./Datasets/celebrity-2019/celebrity-2019_tweets.json", "Datasets\celebrity-2019\celebrity-2019.tsv"),
                   ("./Datasets/political-bots-2019/political-bots-2019_tweets.json","Datasets\political-bots-2019\political-bots-2019.tsv")]

# create a dataframe for all features we want 
all_df = pd.DataFrame(columns=user_metadata+['target'])

# iterate over all input files and add their data to all_df
for data_tuple in input_fileNames:
    features_fileName = data_tuple[0] # features file name
    target_fileName = data_tuple[1] # target file name
    add_file_input_into_all_df(features_fileName, target_fileName)

# export all_df to csv file
all_df.to_csv("./Datasets/all_df.csv", index=False) # index=False - don't export index column

print(all_df.index.size) # number of rows in all_df
print(all_df.columns) # all_df columns
print(all_df.head()) # print first 5 rows of all_df


# TODO
# 1. DERIVED FEATURES
# 2. TARGET COLUMN
# 3. THE CRESCI17 DATASET
