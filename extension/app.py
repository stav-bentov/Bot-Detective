import sys
sys.path.append('../Twitter-Bot-Detector')
from Detector import detect_user
from flask import Flask
from flask_restful import Api, Resource

app = Flask(__name__)
api = Api(app)


class is_bot(Resource):
	def get(self, username):
		return {"is_bot": detect_user(username)}

# When we send a get request to /isBot it should return the True/False, given a string 
api.add_resource(is_bot, "/isBot/<string:username>")

@app.route("/")
def home():
	return "Hello, world!"

app.run(port=5000, debug=True) # debug=True -> if there is an error, it will show on the screen