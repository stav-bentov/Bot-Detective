import sys
sys.path.append('../Twitter-Bot-Detector')
from Detector import detect_user
from flask import Flask
from flask import jsonify, make_response
from flask_cors import CORS

app = Flask(__name__)

# To avoid  No 'Access-Control-Allow-Origin' header is present on the requested resource.
CORS(app)

@app.route("/isBot/<string:username>/")
def is_bot(username):
	print("in backend for: ", username)
	# The return value from a function in a Flask app should be JSON serializable.
	result = 0 if detect_user(username) else 1
	return jsonify({username: result})

@app.route("/")
def home():
	print("in home")
	return "You are in Flask app for bot detection API"

if __name__ == '__main__':
	app.run(port=5000, debug=True) # debug=True -> if there is an error, it will show on the screen