import pandas as pd
import sklearn
from sklearn.ensemble import RandomForestClassifier
from access_keys import bearer_token
import tweepy
import sys
from Build_Dataset import likelihood, get_user_age
from datetime import datetime
from sklearn.model_selection import train_test_split

# ========================================== Define variables ========================================== #
sys.stdin.reconfigure(encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')

client = tweepy.Client(bearer_token)
default_image_url = "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png"

# Define calculation of every feature [User will be response.data]
calculations = {"statuses_count": lambda User: User["public_metrics"]["tweet_count"],
                "followers_count": lambda User: User["public_metrics"]["followers_count"],
                "friends_count": lambda User: User["public_metrics"]["following_count"],
                "favourites_count": lambda User: get_liked_tweets(User["id"]),
                "listed_count": lambda User: User["public_metrics"]["listed_count"],
                "profile_use_background_image": lambda User: User["profile_image_url"] == default_image_url,
                "verified": lambda User: User["verified"],

                "screen_name": lambda User: User["username"],
                "name": lambda User: User["name"],
                "description": lambda User: User["description"],

                "division": lambda x1,x2: x1/x2,
                "length": lambda str: len(str),
                "count_digits": lambda str: sum(char.isdigit() for char in str),
                "likelihood":  lambda str: likelihood(str),
                "user_age": lambda probe_time, created_at: (probe_time - created_at).total_seconds() / 3600 
                }

# exsiting metadata
user_metadata_names = ["statuses_count", "followers_count","friends_count","favourites_count","listed_count","profile_use_background_image","verified"]

# calculted features
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

# ========================================== Functions ========================================== #

# TODO: Tamir- add five-fold-test
# TODO: save the model
'''
    Tamir says to Stav: "I think we use the split only now for the test, but when the model is finished we will train on all the data"
'''
def create_model():
    """
        Generate the model according to the collected dataset in 'Datasets/all_df.csv'
        and returns it
    """
    # read the data
    df = pd.read_csv('Datasets/all_df.csv')

    # train test split
    X = df.drop('target', axis=1)
    Y = df['target']
    X_train, X_test, Y_train, Y_test = train_test_split(X, Y, test_size=0.2, random_state=42)

    # train the model
    model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=1)

    '''
        Tamir: notice we may do grid search to find the best max depth for the model using grid search
    '''
    model.fit(X_train, Y_train)

    accuracy = model.score(X_test, Y_test)
    print("accuracy of this model+parameters is: ", accuracy)

    return model

def get_liked_tweets(user_id):
    """
        Input: gets user_id
        Returns: liked_tweets = favourites_count = number of tweets that the user liked
    """
    response = client.get_liked_tweets(id = user_id)
    # If the user liked at least 1 tweet -> response.data is not None
    if (response.data is not None):
        return len(response.data)
    return 0

def get_metadata(username):
    """
        Input: gets username
        Returns: a dictonary with features as keys and their corresponding values of the username
    """
    user_metadata = {}
    user_fields_param = ["name", "created_at", "description", "verified", "profile_image_url", "public_metrics", "id"]
    
    # Creates a request with get_user - get response object which contains user object by username
    response = client.get_user(username = username, user_fields = user_fields_param)

    # Get the metadata from response.data and add to user_metadata
    for data in user_metadata_names:
        user_metadata[data] = calculations[data](response.data)

    # Calculate user_age for next features
    probe_time = datetime.now().replace(microsecond=0)
    created_at = response.data["created_at"].replace(tzinfo=None)
    user_age = calculations["user_age"](probe_time, created_at)

    # Add derived features to user_metadata
    for feature, calc in user_derived_features.items():
        num_variables = calc[0]
        calc_function = calc[-1]
        x1 = calculations[calc[1]](response.data)
        if (num_variables == 1):
            user_metadata[feature] = calc_function(x1)
        else: #else- num_variables == 2
            # max- Take care of a case where x2 = 0 (will get a devision by 0)
            x2 = max (user_age if calc[2] == "user_age" else calculations[calc[1]](response.data), 1)
            user_metadata[feature] = calc_function(x1, x2)

    return user_metadata

print(get_metadata("Librewomen"))