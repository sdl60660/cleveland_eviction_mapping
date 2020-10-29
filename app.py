from flask import Flask, render_template, request, jsonify	
import json	
import os	

SECRET_KEY = os.getenv('SECRET_KEY', '2345')	

app = Flask(__name__)	
app.secret_key = SECRET_KEY	

@app.route('/')	
def homepage():	
	return render_template('index.html')	

if __name__ == "__main__":	
    app.run(port=5453, debug=True)