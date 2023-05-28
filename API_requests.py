from typing import Union
from Detector import detect_user_model
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

@app.get("/isBot/{username}")
async def is_bot(username: str):
    print("in backend for: ", username)
	# The return value from a function in a Flask app should be JSON serializable.
    result = 1 if detect_user_model(model, username) else 0 # 1 - bot, 0 - not bot
    return {username: result}

app.add_middleware(HTTPSRedirectMiddleware)  # Redirect HTTP to HTTPS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this with the appropriate origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
uvicorn.run(app, host="0.0.0.0", port=3003, ssl_keyfile="./key.pem", ssl_certfile="./cert.pem")