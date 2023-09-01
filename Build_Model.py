from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score
from sklearn.model_selection import GridSearchCV, cross_val_predict
from sklearn.naive_bayes import GaussianNB
from sklearn.calibration import LinearSVC
from sklearn.model_selection import train_test_split
from sklearn.inspection import permutation_importance
from sklearn.metrics import confusion_matrix
import pickle # for saving the model
import pandas as pd
import numpy as np
from matplotlib import pyplot as plt
import seaborn as sns

def grid_search_nb(X, Y):
    """
        Input: Gets data and classification.
        Output: Results of grid search with Gaussian NB.
    """
    nb = GaussianNB()
    grid_space={
        'var_smoothing': np.logspace(0,-9, num=100)
           }
        
    grid = GridSearchCV(estimator = nb, param_grid = grid_space, verbose = 1, cv = 5, n_jobs = -1, scoring ='accuracy')
    model_grid = grid.fit(X, Y)

    print('Best hyperparameters are: '+str(model_grid.best_params_))
    print('Best score is: '+str(model_grid.best_score_))
    return model_grid.best_score_

def grid_search_rf(X, Y):
    """
        Input: Gets data and classification.
        Output: Results of grid search with Random Forest.
    """
    rf = RandomForestClassifier()
    grid_space= {'n_estimators': [100, 200, 300, 400, 500], 
                 'max_depth': [5, 10, 15, 20], 
                 'min_samples_split': [0, 2, 5, 10]}
        
    grid = GridSearchCV(estimator = rf,param_grid = grid_space,cv = 5, scoring ='accuracy')
    model_grid = grid.fit(X, Y)

    print('Best hyperparameters are: '+str(model_grid.best_params_))
    print('Best score is: '+str(model_grid.best_score_))
    print("end rf")
    return model_grid.best_score_

def grid_search_lsvc(X, Y):
    """
        Input: Gets data and classification.
        Output: Results of grid search with linearSVC.
    """
    param_grid_linearSVC = { 'C': [0.1, 1, 10, 100, 1000], 'max_iter': [3000, 4000, 5000]}
    # Create a based model
    linearSVC = LinearSVC(random_state = 1)
    # Instantiate the grid search model
    grid = GridSearchCV(estimator = linearSVC,
                                param_grid = param_grid_linearSVC,
                                cv = 5, n_jobs = -1,
                                scoring='accuracy',
                                verbose = 2)
    # run the grid search
    model_grid = grid.fit(X, Y)

    print('Best hyperparameters are: '+str(model_grid.best_params_))
    print('Best score is: '+str(model_grid.best_score_))
    return model_grid.best_score_

def find_best_model(X, Y):
    """
        Input: Gets data and classification.
        Output: Print the best model (highest accuracy) on the data.
    """
    models = {}
    models["Gaussian Naive Bayes"] = grid_search_nb(X, Y)
    print("Done Gaussian Naive Bayes")
    models["Random forest"] = grid_search_rf(X, Y)
    print("Done Random forest")
    models["Linear SVC"] = grid_search_lsvc(X, Y)
    print("Done Linear SVC")
    
    best_model = max(models, key=models.get)
    print("The best model is: ",best_model, "with accuracy of: ", models[best_model])

def create_and_save_model():
    """
        Generate the model according to the collected dataset in 'Datasets/all_df.csv'
        and returns it
    """
    # Read the data
    df = pd.read_csv('Datasets/all_df.csv')

    # Split features and target
    X = df.drop('target', axis=1)
    Y = df['target']
    
    #find_best_model(X, Y)
    grid_search_rf(X, Y)

    # Trains the model
    model = RandomForestClassifier(n_estimators = 200, max_depth = 5, random_state = 1)
    model.fit(X, Y)

    # Calculates 5 fold cross validation test
    scores = cross_val_score(model, X, Y, cv = 5)
    print("cross validation scores: ", scores.mean()) # scores.mean() = 0.962

    # Savea the model
    with open('detector_model.pkl', 'wb') as f: # wb = write binary
        pickle.dump(model, f) # Save the model in the file

def check_features():
    """
        Generate the importance of each feature in the model
    """
    df = pd.read_csv('Datasets/all_df.csv')

    # Split features and target
    X = df.drop('target', axis=1)
    y = df['target']
    f_names = df.columns.tolist()[:-1]

    plt.rcParams.update({'figure.figsize': (12.0, 8.0)})
    plt.rcParams.update({'font.size': 14})

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=12)
    rf = RandomForestClassifier(n_estimators=200)
    rf.fit(X_train, y_train)
    
    sorted_idx = rf.feature_importances_.argsort()
    print(sorted_idx)
    plt.barh([f_names[i] for i in sorted_idx], rf.feature_importances_[sorted_idx])
    plt.xlabel("Random Forest Feature Importance")
    plt.show()

    rf = RandomForestClassifier(n_estimators=200)
    rf.fit(X, y)
    perm_importance = permutation_importance(rf, X, y)
    sorted_idx = perm_importance.importances_mean.argsort()
    plt.barh([f_names[i] for i in sorted_idx], perm_importance.importances_mean[sorted_idx])
    plt.xlabel("Permutation Importance")
    plt.show()

def plot_feature_importance():
    """
        Generate the model according to the collected dataset in 'Datasets/all_df.csv'
        and returns it
    """
    # Read the data
    df = pd.read_csv('Datasets/all_df.csv')

    # Split features and target
    X = df.drop('target', axis=1)
    Y = df['target']

    # Trains the model
    model = RandomForestClassifier(n_estimators=200, max_depth=5, random_state=1)
    model.fit(X, Y)

    # Get feature importances from the trained model
    feature_importances = model.feature_importances_

    # Get the names of the features
    feature_names = X.columns

    # Sort feature importances in descending order
    sorted_indices = feature_importances.argsort()[::-1]
    sorted_importances = feature_importances[sorted_indices]
    sorted_feature_names = feature_names[sorted_indices]

    # print the feature importances in format of (feature_name, feature_importance) 
    for feature in zip(sorted_feature_names, sorted_importances):
        print(feature)

    # Create the feature importance plot
    plt.figure(figsize=(10, 6))
    plt.bar(range(len(sorted_importances)), sorted_importances, tick_label=sorted_feature_names)
    plt.title("Feature Importance Plot")
    plt.xlabel("Feature Names")
    plt.ylabel("Feature Importance")
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()

    plt.show()

def plot_Confusion_Matrix_Heatmap():
    """
        Generate a confusion matrix heatmap using 5-fold cross-validation with the dataset in 'Datasets/all_df.csv'
    """
    # Read the data
    df = pd.read_csv('Datasets/all_df.csv')

    # Split features and target
    X = df.drop('target', axis=1)
    Y = df['target']

    # Trains the model
    model = RandomForestClassifier(n_estimators=200, max_depth=5, random_state=1)

    # Predict using 5-fold cross-validation
    Y_pred = cross_val_predict(model, X, Y, cv=5)

    # Generate confusion matrix
    cm = confusion_matrix(Y, Y_pred)
    # print the confusion matrix results
    print(cm)
    # Create a heatmap for the confusion matrix
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", cbar=False)
    plt.title("Confusion Matrix Heatmap (5-Fold CV)")
    plt.xlabel("Predicted Labels")
    plt.ylabel("True Labels")
    plt.show()

#check_features()
#plot_feature_importance()
#plot_Confusion_Matrix_Heatmap()
#plot_shap()

create_and_save_model()
