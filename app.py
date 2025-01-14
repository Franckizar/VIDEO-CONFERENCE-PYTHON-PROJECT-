from flask import Flask, render_template, request, jsonify, url_for
from flask_socketio import SocketIO
from flask_login import LoginManager
from flask_cors import CORS
from config import Config
from models import db, User
import logging


# Initialize Flask app
app = Flask(__name__, static_url_path='/static')
app.config.from_object(Config)

# Initialize extensions
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')
db.init_app(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# Logging setup
logging.basicConfig(level=logging.INFO)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store'
    return response

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

# Import routes
from routes import *

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("Database tables created.")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True, ssl_context=('cert.pem', 'key.pem'))