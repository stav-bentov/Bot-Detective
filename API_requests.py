from typing import Union
from Detector import detect_users_model
from Detector import load_model
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi import FastAPI 
import uvicorn
import redis

# creating redis storage to store the results of the model from all users ever calculated
r = redis.Redis(host='localhost', port=6379, decode_responses=True)

model = load_model() # load the model once

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/isBot/{usernames_str}")
async def is_bot(usernames_str: str):
    usernames_list = usernames_str.split(",")
    print("len before remove (usernames_list) = {0}".format(len(usernames_list)))
    result = {}
    # update usernames_list to be only the usernames that are not in the redis storage
    for username in usernames_list:
        if r.get(username) is not None: # if the username is in the redis storage
            result[username] = r.get(username) # get the result from redis storage
            usernames_list.remove(username) # remove the username from the list of usernames to be calculated
	# The return value from a function in a Flask/FastAPI app should be JSON serializable.
    #print("usernames_list = {0}".format(usernames_list))
    print("len after remove (usernames_list) = {0}".format(len(usernames_list)))
    if 1 <= len(usernames_list) <= 100:
        result.update(detect_users_model(model, usernames_list)) 
    else:
        print("error: len(usernames_list) = {0}".format(len(usernames_list)))
        print("usernames_list = {0}".format(usernames_list))
        print("can't be more than 100 usernames and less than 1 username")

    # update redis storage with the new usernames and their results
    for username in usernames_list:
        if username in result:
            r.set(username, result[username])
        else:
            print("error: username =, " + username + "is not in result")
            print("result = {0}".format(result))

    #print(result)
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