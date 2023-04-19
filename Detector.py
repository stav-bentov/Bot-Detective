import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from TwitterAPI import TwitterAPI
import twitter
import tweepy

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

    # calculate 5-fold cross-validation
    from sklearn.model_selection import cross_val_score
    scores = cross_val_score(model, X, Y, cv=5, scoring='accuracy')
    print("cross validation accuracy of this model+parameters is: ", scores.mean())
    

    return model

def create_API():
    #api = TwitterAPI(consumer_key, consumer_secret, access_token_key, access_token_secret, api_version='2')
    api = TwitterAPI(consumer_key,
                 consumer_secret,
                 auth_type='oAuth2')
    SCREEN_NAME = "Liberwomen"
    r = api.request(f'users/by/username/:{SCREEN_NAME}')
    print(r.text)

def try_tweepy():
    bearer_token = "AAAAAAAAAAAAAAAAAAAAAPLbBgEAAAAAuU1B3%2FqeVnDl4%2BPSYNf%2B79%2FbHco%3DIK6cM2hmdXxVTYJ72Etnc6c2Pr4TT0ewUyACOoUibIQq6piogn"

    client = tweepy.Client(bearer_token)
    SCREEN_NAME = ["Liberwomen"]
    user_ids = [2244994945, 6253282]
    response = client.get_users(ids=user_ids)
    print(response)


#try_tweepy()
#create_API()


"""
try:
        api = TwitterAPI(consumer_key, consumer_secret, access_token_key, access_token_secret, api_version='2')
        SCREEN_NAME = "Liberwomen"
        r = api.request(f'users/by/username/:{SCREEN_NAME}')
        for item in r:
            print(item)

        print(r.get_quota())

    except TwitterRequestError as e:
        print("1")
        print(e.status_code)
        for msg in iter(e):
            print(msg)

    except TwitterConnectionError as e:
        print("1")
        print(e)

    except Exception as e:
        print("3")
        print(e)"""
