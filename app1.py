from flask import Flask
from flask_login import LoginManager
from config import Config
from models import db, User

app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
db.init_app(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Import routes after app initialization
from routes import *

# Database initialization
if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Creates all tables in the database
        print("Database tables created.")
    app.run(debug=True, port=5001)