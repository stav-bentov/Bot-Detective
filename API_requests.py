import datetime
from typing import Union
from Detector import detect_users_model
from Detector import load_model
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi import FastAPI 
from fastapi_queue import FastQueue
import uvicorn
import redis
import sched
import time
import threading

####### INIT REDIS #######
# Creating redis storage to store the results of the model from all users ever calculated
# values are stored in the following format:
# {username: {'classification': result, 'accuracy': accuracy_of_prediction, 'expiration': expirationDate}}
r = redis.Redis(host='localhost', port=6379, decode_responses=True)
#r.flushall() # delete all keys in redis storage

####### INIT MODEL #######
model = load_model() # load the model once


def empty_requests_queue():
    # TODO: calc all requests in fastapi-queue ...................

    pass

####### INIT TIMER #######
# create timer thread. every PERIOD seconds, call a function that calcs all requests in fastapi-queue
PERIOD = 60 # seconds
scheduler = sched.scheduler(time.time, time.sleep)

def timer_event():
    empty_requests_queue()
    scheduler.enter(PERIOD, 1, timer_event, ())  # Schedule the next function call to be run in PERIOD seconds

timer_thread = threading.Thread(target=scheduler.run) # target is the function that the thread will run
timer_thread.start() # start the thread

scheduler.enter(0, 1, timer_event, ())  # start emptying the queue every PERIOD seconds

app = FastAPI()
queue = FastQueue(app=app) 

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/isBot/{usernames_str}")
async def is_bot(usernames_str: str):
    result = {} # keys: usernames, values: {classification:user's classification (bot = 1, human = 0), accuracy:accuracy of prediction]

    usernames_list = usernames_str.split(",")
    print("len before remove (usernames_list) = {0}".format(len(usernames_list)))

    # Update usernames_list to be only the usernames that are not in the redis storage
    for username in usernames_list:
        # If the username is in the redis storage:
        # 1. Get the result from redis storage
        # 2. Remove the username from the list of usernames that need to be calculated (by the model)
        if r.get(username) is not None:
            userStorageValue = eval(r.get(username)) # Convert string to userStorageValue dict
            expirationDate = datetime.datetime.strptime(str(userStorageValue['expiration']), '%Y-%m-%d %H:%M:%S.%f')
            if expirationDate > datetime.datetime.now(): # Redis value is still valid (has not expired yet)
                result[username] = {} # create new dict for the username
                result[username]['classification'] = userStorageValue['classification']
                result[username]['accuracy'] = userStorageValue['accuracy']
                usernames_list.remove(username) 
    print("len after remove (usernames_list) = {0}".format(len(usernames_list)))
    
    # Calculates users in model and adds to the result
    if len(usernames_list) > 0: # cant send 0 users to model
        print("usernames_list: {0}".format(usernames_list))
        result.update(detect_users_model(model, usernames_list))
    else:
        print("error: len(usernames_list) = {0}".format(len(usernames_list)))

    # Update redis storage with the **new** usernames and their results
    for username in usernames_list:
        expirationDate = datetime.datetime.now() + datetime.timedelta(days=30) # 30 days from now
        print("username = ", username)
        print("result = ", result)
        if username in result:
            userStorageValue = {'classification': result[username]['classification'], 'accuracy': result[username]['accuracy'] ,'expiration': expirationDate}
            userStorageValue = str(userStorageValue) # convert dict to string according to redis storage format
            r.set(username, userStorageValue)
        else:
            print("error: result = None for user: ", username, " maybe user does not exist anymore?")
    return result

#app.add_middleware(HTTPSRedirectMiddleware)  # Redirect HTTP to HTTPS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this with the appropriate origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
#uvicorn.run(app, host="0.0.0.0", port=3003, ssl_keyfile="./34.165.68.249-key.pem", ssl_certfile="./34.165.68.249.pem")
uvicorn.run(app, port=8000)
