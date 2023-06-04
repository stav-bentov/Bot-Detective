from typing import Union
from Detector import detect_users
from Detector import load_model
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi import FastAPI 
import uvicorn

model = load_model() # load the model once

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/isBot/{usernames_str}")
async def is_bot(usernames_str: str):
    print("in backend for: ", usernames_str)
    usernames_list = usernames_str.split(",")
	# The return value from a function in a Flask app should be JSON serializable.
    result = detect_users(usernames_list)
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
uvicorn.run(app)