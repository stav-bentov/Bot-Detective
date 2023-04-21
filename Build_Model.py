import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score
import pickle # for saving the model


def create_and_save_model():
    """
        Generate the model according to the collected dataset in 'Datasets/all_df.csv'
        and returns it
    """
    # read the data
    df = pd.read_csv('Datasets/all_df.csv')

    # split features and target
    X = df.drop('target', axis=1)
    Y = df['target']

    # train the model
    model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=1)

    model.fit(X, Y)

    # calc 5 fold cross validation test
    # scores = cross_val_score(model, X, Y, cv=5)
    # print("cross validation scores: ", scores.mean()) # scores.mean() = 0.962

    # save the model
    with open('detector_model.pkl', 'wb') as f: # wb = write binary
        pickle.dump(model, f) # save the model in the file

create_and_save_model()