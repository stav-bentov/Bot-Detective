import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from access_keys import bearer_token
import tweepy
import sys
import Build_Dataset

sys.stdin.reconfigure(encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')

'''
    Tamir says to Stav: "I think we use the split only now for the test, but when the model is finished we will train on all the data"
'''
from sklearn.model_selection import train_test_split
def create_model():
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

client = tweepy.Client(bearer_token)

# TODO return dictonary with keys = user_metadata + list(user_derived_features.keys()) and matching values
def get_metadata(username):
    user_fields_param = ["name", "created_at", "description", "verified", "profile_image_url", "public_metrics", "id"]
    # create a request with get_user - get user object by username
    response = client.get_user(username = username, user_fields = user_fields_param)
    print(response)
    for key in user_fields_param:
        print(response.data[key])

# TODO use this for get_metadata
def get_liked_tweets(user_id):
    response = client.get_liked_tweets(id = user_id)
    if (response.data is not None):
        return len(response.data)
    return 0

#try_tweepy()
get_liked_tweets()