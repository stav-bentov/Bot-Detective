import pandas as pd
import sys
from collections import Counter
from nltk.util import bigrams
import math
from datetime import datetime

# setting python encoder to utf-8 to avoid encoding errors
sys.stdin.reconfigure(encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')

def add_csv_file_input_into_all_df(features_fileName, target):
    """
        Input: features_fileName is a source of a dataset, target- all the users in 
               this dataset are bot/human, this dataset is taken from cresci-17
        Updates the main dataframe named all_df with the required features and data
    """
    features_df = pd.read_csv(features_fileName, encoding='utf-8') # read the input file into a dataframe
    # Conver nan to "" (for the len calculation in derived features)
    features_df.fillna("", inplace=True)

    # index - number of row in features_df
    # row - {all user metadata}
    for index, row in features_df.iterrows():
        # Passing a features_fileName only for csv files because it will be needed for created at
        # target is know according to the csv value
        new_row = get_user_info(features_fileName, row, target, row)
        all_df.loc[len(all_df)] = new_row

def is_bot(row, target_df):
    """
        Input: row of the user and target_df
        Returns: 1- if bot, else-if not- 0 according to the id of user in row and id from target_df
                            else- if there is no information- None
    """
     # update user target (Bot/Not Bot)
    if row['user']['id'] not in target_df.index: # if there is not target label for this user, ignore this user
        return None
    label = str(target_df.loc[row['user']['id']]['target']) # get the target label
    if label.lower() == "bot": # if the target is 1 (Bot)
        return 1
    else: # if the target is 0 (Human)
        return 0

def add_file_input_into_all_df(features_fileName, target_fileName):
    """
        Input: fileName is a source of a dataset and target_fileName- bot/not info
        Updates the main dataframe named all_df with the required features and data
    """
    # read the target file into a dataframe
    target_df = pd.read_csv(target_fileName, sep='\t', names=['id', 'target'], index_col= 'id' , encoding='utf-8') # set id as index, add column names
    features_df = pd.read_json(features_fileName, encoding='utf-8') # read the input file into a dataframe

    # index - number of row in file_df
    # row - {created_at:"", user:{}}
    for index, row in features_df.iterrows():
        target = is_bot(row, target_df)
        # If there is information about bot/human- get metadata and features
        if target is not None:
            user = row['user']
            # filename is None regarding to json files
            new_row = get_user_info(None, row, target, user)
            all_df.loc[len(all_df)] = new_row

def get_created_at(current_row, file_name):
    """
        Input: current_row of user and file_name (= None for json files)
        Returns: created_at field as a datetime.datetime object with the right format
    """
    # Calculte created_at, set the right format and transform to datetime object (from TimeStamp)
    if file_name is None: # get value from json files
        created_at = current_row["created_at"].to_pydatetime().replace(tzinfo=None) 
    else: #or get value from csv
        # only this file has special timestamp- need to convert in a specipc way
        if (file_name == "./Datasets/csv-datasets/users_traditional_spambots_1.csv"):
            # get read of "L"
            timestamp = current_row["created_at"][:-1] 
            # from milliseconds to seconds
            timestamp = int(timestamp) / 1000 
            created_at = datetime.utcfromtimestamp(timestamp)
        else:
            # Get the date
            created_at = datetime.strptime(current_row["created_at"], '%a %b %d %H:%M:%S +0000 %Y')
    return created_at

def get_user_info(file_name, current_row, target, user):
    """
        Input: file_name (= only for csv file to make the right calculation in get_created_at()),
               current_row (used for get_created_at()) of the current observed user,
               target - bot or not,
               user- for json files it's a dictonary with user metadata, for csv it's the row
        Returns: dictonary which represents a row that will be added to the main dataframe,
                 the new row consist from the required user-metadata and derived features
    """
    probe_time = datetime.now().replace(microsecond=0)
    
    # create a new row for all_df
    new_row = {}

    # Update bot/not with target
    new_row['target'] = target

    # Add user metadata
    for user_meta in user_metadata:
        if user_meta not in boolean_features: # if not boolean feature
            new_row[user_meta] = user[user_meta] # add the value as usual
        else: 
            if user[user_meta] == "" or user[user_meta] == False:
                new_row[user_meta] = 0
            elif user[user_meta] == True or user[user_meta] == 1:
                new_row[user_meta] = 1
            else:
                print("Error: boolean feature is not boolean")
                print(user[user_meta])
                exit(1) 
    
    # get created_at as datetime.datetime object with the right format
    created_at = calculations["created_at"](current_row, file_name)
    # Calculate user_age with probe_time in the right format
    user_age = calculations["user_age"](probe_time, created_at)

    # Add derived features
    for feature, calc in user_derived_features.items():
        num_variables = calc[0]
        calc_function = calc[-1]
        x1 = user[calc[1]]
        if (num_variables == 1):
            new_row[feature] = calc_function(x1)
        else: #else- num_variables == 2
            # max- Take care of a case where x2 = 0 (will get a devision by 0)
            x2 = max (user_age if calc[2] == "user_age" else user[calc[2]], 1)
            new_row[feature] = calc_function(x1, x2)
    
    return new_row
    
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

def get_user_age(probe_time, created_at):
    """
        Input: created_at (from dataset)
        Returns: The hour difference between probe_time and created_at
                 The user age is defined as the hour difference between
                 the probe time (when the query happens) and the 
                 creation (created_at field) time of the user.
    """
    # TODO: del later- info about datetime: https://www.w3resource.com/python/python-date-and-time.php
    hour_difference =  (probe_time - created_at).total_seconds() / 3600 
    return hour_difference

#################################### main ####################################

# all the user metadata we want to extract from the input files
user_metadata = ["statuses_count", "followers_count", "friends_count", "favourites_count", "listed_count",
                  "profile_use_background_image", "verified"]

boolean_features = ["verified", "default_profile", "profile_use_background_image"] # features with 1/0 values (1- True, 0- False)

# Define calculation according to the article. 
calculations = {"division": lambda x1,x2: x1/x2,
                "length": lambda str: len(str),
                "count_digits": lambda str: sum(char.isdigit() for char in str),
                "likelihood":  lambda str: likelihood(str),
                "user_age": lambda probe_time, created_at: get_user_age(probe_time, created_at),
                "created_at": lambda current_row, file_name: get_created_at(current_row, file_name)}

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

# notice it doesn't include -varol- because it is only labeling Bot/Not Bot
# and doesn't include -cresci17-
# format is: (input_fileName, target_fileName)
input_fileNames = [("./Datasets/botometer-feedback-2019/botometer-feedback-2019_tweets.json", "./Datasets/botometer-feedback-2019/botometer-feedback-2019.tsv"),
                   ("./Datasets/celebrity-2019/celebrity-2019_tweets.json", "Datasets\celebrity-2019\celebrity-2019.tsv"),
                   ("./Datasets/political-bots-2019/political-bots-2019_tweets.json","Datasets\political-bots-2019\political-bots-2019.tsv")]
# data from creci17 dataset
csv_datasets = {"./Datasets/csv-datasets/users_fake_followers.csv": 1,
                "./Datasets/csv-datasets/users_genuine_acconts.csv": 0,
                "./Datasets/csv-datasets/users_social_spambots_1.csv": 1,
                "./Datasets/csv-datasets/users_social_spambots_2.csv": 1,
                "./Datasets/csv-datasets/users_social_spambots_3.csv": 1,
                "./Datasets/csv-datasets/users_traditional_spambots_1.csv": 1,
                "./Datasets/csv-datasets/users_traditional_spambots_2.csv": 1,
                "./Datasets/csv-datasets/users_traditional_spambots_3.csv": 1,
                "./Datasets/csv-datasets/users_traditional_spambots_4.csv": 1
              }

columns = user_metadata + list(user_derived_features.keys()) + ['target']

# create a dataframe for all features we want 
all_df = pd.DataFrame(columns = columns)

for fileName, target in csv_datasets.items():
    add_csv_file_input_into_all_df(fileName, target)

# iterate over all input files and add their data to all_df
for data_tuple in input_fileNames:
    features_fileName = data_tuple[0] # features file name
    target_fileName = data_tuple[1] # target file name
    add_file_input_into_all_df(features_fileName, target_fileName)

# export all_df to csv file
all_df.to_csv("./Datasets/all_df.csv", index=False) # index=False - don't export index column

