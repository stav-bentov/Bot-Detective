from access_keys import bearer_token, consumer_key, consumer_secret, access_token_key, access_token_secret

import requests
import os
import json

def create_url():
    # Specify the usernames that you want to lookup below
    # You can enter up to 100 comma-separated values.
    usernames = "screen_name=TwitterDev,TwitterAPI,stav_1234"
    user_fields = "user.fields=statuses_count,followers_count,friends_count,favourites_count,listed_count,profile_use_background_image,\
        verified,created_at,name,screen_name,created_at,description"
    # User fields are adjustable, options include:
    # created_at, description, entities, id, location, name,
    # pinned_tweet_id, profile_image_url, protected,
    # public_metrics, url, username, verified, and withheld
    url = f"https://api.twitter.com/1.1/users/lookup.json?screen_name=BenCaspit&include_entities=false"
    print(url)
    return url


def bearer_oauth(r):
    """
    Method required by bearer token authentication.
    """
    print(r)
    r.headers["Authorization"] = f"Bearer {bearer_token}"
    return r


def connect_to_endpoint(url):
    response = requests.request("GET", url, auth=bearer_oauth,)
    print(response.status_code)
    if response.status_code != 200:
        raise Exception(
            "Request returned an error: {} {}".format(
                response.status_code, response.text
            )
        )
    return response.json()


def main():
    url = create_url()
    json_response = connect_to_endpoint(url)
    print(json.dumps(json_response, indent=4, sort_keys=True))


def send_Twitter_API_request(usernames):
    usernames = ','.join(usernames)
    usernames_req = f"screen_name={usernames}"
    print(usernames_req)

    url = f"https://api.twitter.com/1.1/users/lookup.json?{usernames_req}&include_entities=false"

    response = requests.request("GET", url, auth=bearer_oauth,)

    print(response.status_code)

    if response.status_code != 200:
        raise Exception(
            f"Request returned an error: {response.status_code} {response.text}"
        )

    return response.json()


if __name__ == "__main__":
    print(send_Twitter_API_request(["stav_1234", "BenCaspit"]))
    #main()