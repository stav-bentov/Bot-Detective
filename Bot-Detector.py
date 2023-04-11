from sklearn.ensemble import RandomForestClassifier
import pandas as pd

df = pd.read_json('./Datasets/botometer-feedback-2019/botometer-feedback-2019_tweets.json', encoding='utf-8')
#print(df['user'][0].keys())

for row in df['user']:
    print(row.keys())
    break

user_metadata = ["statuses_count", "followers_count", "friends_count", "favourites_count", "listed_count",
                  "default_profile", "profile_use_background_image", "verified", "screen_name", "name", "description"]