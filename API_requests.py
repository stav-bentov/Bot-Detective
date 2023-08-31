import datetime
from typing import Union
from Detector import detect_users_model, get_bots_in_followers
from Detector import load_model
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi import FastAPI 
import uvicorn
import redis
import asyncio
from collections import deque 

####### INIT REDIS #######
# Creating redis storage to store the results of the model from all users ever calculated
# values are stored in the following format:
# {username: {'classification': result, 'accuracy': accuracy_of_prediction, 'expiration': expirationDate}}
r = redis.Redis(host='localhost', port=6379, decode_responses=True)
# r.flushall() # delete all keys in redis storage
# print("Redis Storage= ",r.keys()) # print all keys in redis storage

####### INIT MODEL #######
model = load_model() # load the model once

####### INIT requests QUEUE #######
# Format: (usernames_list, future) per request
# Notice that client need to wait for response before sending another request
requests_queue = deque() # Global for all clients
PERIODIC_REQUESTS_CALCULATION = 2 # Seconds

# Global variable to indicate if process_requests task has started
process_requests_started = False


def get_all_usernames_on_queue():
    """
        Returns: tuple:(all_users= list of all usernames on queue from all requests, 
                        number_of_calculated_requests= number of requests on queue)
    """
    all_users = []
    for usernames_list, future in requests_queue:
        all_users += usernames_list 
    return all_users, len(requests_queue)

async def process_requests():
    """
        Runs every 2 PERIODIC_REQUESTS_CALCULATION and calculates user's classifications (in queue)
    """
    while True: 
        if requests_queue:
            all_users, number_of_calculated_requests = get_all_usernames_on_queue() 
            # Process the request and calculate the users classification
            users_classification = detect_users_model(model, all_users)
            # Update the future object with the result from the model and pop from queue
            for i in range(number_of_calculated_requests):
                future = requests_queue.popleft()[1]
                future.set_result(users_classification)
        
        # Waits for PERIODIC_REQUESTS_CALCULATION seconds before processing another up to 100 usernames
        await asyncio.sleep(PERIODIC_REQUESTS_CALCULATION)  

def update_redis(username, classification, accuracy, expiration):
    userStorageValue = {'classification': classification, 'accuracy': accuracy ,'expiration': expiration}
    userStorageValue = str(userStorageValue) # Convert dict to string according to redis storage format
    try:
        r.set(username, userStorageValue)
    except (redis.exceptions.ConnectionError, redis.exceptions.ResponseError) as e:
        print("Error with Redis (Verify the Redis has started):", e)

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/isBot/{usernames_str}")
async def is_bot(usernames_str: str):
    global process_requests_started
    result = {} # Keys: usernames, values: {classification:user's classification (bot = 1, human = 0), accuracy:accuracy of prediction]
    usernames_list = usernames_str.split(",")
    #print("len before remove (usernames_list) = {0}".format(len(usernames_list)))

    # Update usernames_list to be only the usernames that are not in the redis storage
    for username in usernames_list:
        # If the username is in the redis storage:
        # 1. Get the result from redis storage
        # 2. Remove the username from the list of usernames that need to be calculated (by the model)
        try:
            resid_result = r.get(username)
        
            if resid_result is not None:
                userStorageValue = eval(resid_result) # Convert string to dict
                expirationDate = datetime.datetime.strptime(str(userStorageValue['expiration']), '%Y-%m-%d %H:%M:%S.%f')
                if expirationDate > datetime.datetime.now(): # Redis value is still valid (has not expired yet)
                    result[username] = {} # create new dict for the username
                    result[username]['classification'] = userStorageValue['classification']
                    result[username]['accuracy'] = userStorageValue['accuracy']
                    usernames_list.remove(username)
        except (redis.exceptions.ConnectionError, redis.exceptions.ResponseError, KeyError) as e:
            print("Error with Redis (Verify the Redis has started):", e)
        
    
    # Calculates users in model and adds to the result
    if len(usernames_list) > 0: # Can't send 0 users to model
        # If process_requests not started yet, start the process_requests task in the background (only once!)
        if not process_requests_started:
            try:
                asyncio.ensure_future(process_requests())
                process_requests_started = True
            except Exception as e:
                print("Error in process_requests(): ", e)

        try: 
            future = asyncio.get_event_loop().create_future()
            # Add usernames_list to the requests_queue
            requests_queue.append((usernames_list, future)) # future is the future object that will be updated with the result from the model
            # Wait for the future to be updated with the result from the model
            response = await future 
            # Response is answer for all users request
            # Need to: Update only the users that were in this request
            for username in usernames_list:
                if (response is not None and username in response):
                    result[username] = response[username] 
        except Exception as e:
            print("Error in asyncio: ", e)
             

    # Update redis storage with the **new** usernames and their results
    for username in usernames_list:
        expirationDate = datetime.datetime.now() + datetime.timedelta(days=30) # 30 days from now
        if username in result:
            update_redis(username, result[username]['classification'], result[username]['accuracy'], expirationDate)
        else:
            print("Error: result = None for user: ", username, " maybe user does not exist anymore?")
    return result

@app.get("/followersBots/")
async def followers_bots(username: str, classification: bool, followersPrec: bool):
    expirationDate = datetime.datetime.now() + datetime.timedelta(days=30) # 30 days from now

    # ========================== Handle followers prec ========================== #
    bot_prec = [None, None]
    if (followersPrec):
        # Assumption- there is not username with the name {username}_followers
        redis_user_key = f'{username}_followers'
        print("userkey:" ,redis_user_key)
        # If the result of username (followers) is saved and up to date- return its value
        try:
            if r.get(redis_user_key) is not None:
                print("in redis!")
                userStorageValue = eval(r.get(redis_user_key))
                expirationDate = datetime.datetime.strptime(str(userStorageValue['expiration']), '%Y-%m-%d %H:%M:%S.%f')
                if expirationDate <= datetime.datetime.now(): # Redis value is still valid (has not expired yet)
                    bot_prec = userStorageValue["bot_precentage"]
        except (redis.exceptions.ConnectionError, redis.exceptions.ResponseError, KeyError) as e:
            print("Error with Redis (Verify the Redis has started):", e)

        # Not in redis
        if (bot_prec == [None, None]):
            # Assumption sum(bot_prec) <= 100
            result, bot_prec = get_bots_in_followers(model, username)

            # Error occured in get_bots_in_followers()
            if (result is None and bot_prec is None):
                print(f"Error occured in get_bots_in_followers() for {username}")
                return None
            
            # If there is at least 1 follower
            if (result != 0):
                # Update redis
                expirationDate = datetime.datetime.now() + datetime.timedelta(days=30) # 30 days from now
                userStorageValue = {'bot_precentage': bot_prec[1], 'expiration': expirationDate}
                userStorageValue = str(userStorageValue) # Convert dict to string according to redis storage format
                try:
                    r.set(redis_user_key, userStorageValue)
                except (redis.exceptions.ConnectionError, redis.exceptions.ResponseError) as e:
                    print("Error with Redis (Verify the Redis has started):", e)

                # Update redis (classification of each follower)
                for follower in result:
                    update_redis(follower, result[follower]['classification'],result[follower]['accuracy'], expirationDate)

    # ========================== Handle user's classification ========================== #
    classification_result = {username: None}
    if (classification):
        try:
            redis_result = r.get(username)
        except (redis.exceptions.ConnectionError, redis.exceptions.ResponseError) as e:
            print("Error with Redis (Verify the Redis has started):", e)
            redis_result = None
        if redis_result is not None:
            userStorageValue = eval(redis_result) # Convert string to dict
            expirationDate = datetime.datetime.strptime(str(userStorageValue['expiration']), '%Y-%m-%d %H:%M:%S.%f')
            if expirationDate > datetime.datetime.now(): # Redis value is still valid (has not expired yet)
                classification_result[username] = {} # Create new dict for the username
                classification_result[username]['classification'] = userStorageValue['classification']
                classification_result[username]['accuracy'] = userStorageValue['accuracy']
        else:
            classification_result = detect_users_model(model, [username])
            expirationDate = datetime.datetime.now() + datetime.timedelta(days=10) # 10 days from now
            if (classification_result is not None and classification_result.get(username) is not None):
                # Update Redis
                update_redis(username, classification_result[username]['classification'], classification_result[username]['accuracy'], expirationDate)

    if (classification_result is not None):
        return {"humans": bot_prec[0], "bots": bot_prec[1], "classification_res": classification_result[username]}
    return {"humans": bot_prec[0], "bots": bot_prec[1], "classification_res": None}

# VM ONLY- Remove comment
#app.add_middleware(HTTPSRedirectMiddleware)  # Redirect HTTP to HTTPS

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://twitter.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    # Local ONLY:
    uvicorn.run(app, port=8000)
    # VM:
    #uvicorn.run(app, host="0.0.0.0", port=3003, ssl_keyfile="./server.key", ssl_certfile="./server.crt")