import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'your_secret_key')
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root@localhost/video_app'
    SQLALCHEMY_TRACK_MODIFICATIONS = False