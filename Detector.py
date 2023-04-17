import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from TwitterAPI import TwitterAPI
'''
    Tamir says to Stav: "I think we use the split only now for the test, but when the model is finished we will train on all the data"
'''
from sklearn.model_selection import train_test_split

consumer_key = "tBwp11YRUZwM1OXGMVybNnuJH"
consumer_secret = "IxT4uCKbiUvBoMVDlDDRVLg7F22VgJSkHL0CxFirDQoMnVBCpZ"
access_token_key = "1642120821979115520-diImePbIobWbd2SfCmD5YUVzk2uwe7"
access_token_secret = "XUghL2Tsf6TrEmBeYcFlQvsfuau7bl0awnboCRPM0pYiz"

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
    api = TwitterAPI(consumer_key, consumer_secret, access_token_key, access_token_secret, api_version='2')
    r = api.request('users/', {})




