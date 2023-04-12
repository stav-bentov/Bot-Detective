import pandas as pd
from sklearn.ensemble import RandomForestClassifier

'''
    Tamir says to Stav: "I think we use the split only now for the test, but when the model is finished we will train on all the data"
'''
from sklearn.model_selection import train_test_split

# read the data
df = pd.read_csv('Datasets/all_df.csv')

# train test split
X = df.drop('target', axis=1)
y = df['target']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# train the model
model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=1) 

'''
    Tamir: notice we may do grid search to find the best max depth for the model using grid search
'''
model.fit(X_train, y_train)

accuracy = model.score(X_test, y_test)
print("accuracy of this model+parameters is: ", accuracy)




