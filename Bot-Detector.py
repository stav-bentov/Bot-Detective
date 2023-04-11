from sklearn.ensemble import RandomForestClassifier
import pandas as pd
import sys
# setting python encoder to utf-8 to avoid encoding errors
sys.stdin.reconfigure(encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')

# adds the data from the input file to the all_df dataframe
def add_file_input_into_all_df(fileName):
    file_df = pd.read_json(fileName, encoding='utf-8')
    for index, row in file_df.iterrows():
        # index - number of row in file_df
        # row - {created_at:"", user:{}}
        user = row['user']
        # create a new row for all_df
        new_row_index_in_all_df = all_df.index.size # number of rows in all_df
        new_row = {}
        for user_meta in user_metadata:
            new_row[user_meta] = user[user_meta]
        all_df.loc[new_row_index_in_all_df] = new_row

    return all_df

# all the user metadata we want to extract from the input files
user_metadata = ["statuses_count", "followers_count", "friends_count", "favourites_count", "listed_count",
                  "default_profile", "profile_use_background_image", "verified", "screen_name", "name", "description"]

# notice it doesn't include -varol- because it is only labeling Bot/Not Bot
# and doesn't include -cresci17-
input_fileNames = ["./Datasets/botometer-feedback-2019/botometer-feedback-2019_tweets.json",
                   "./Datasets/celebrity-2019/celebrity-2019_tweets.json",
                   "./Datasets/political-bots-2019/political-bots-2019_tweets.json",]

# create a dataframe for all features we want 
all_df = pd.DataFrame(columns=user_metadata)

# iterate over all input files and add their data to all_df
for fileName in input_fileNames:
    add_file_input_into_all_df(fileName)

# export all_df to csv file
all_df.to_csv("./Datasets/all_df.csv", index=False) # index=False - don't export index column

print(all_df.index.size) # number of rows in all_df
