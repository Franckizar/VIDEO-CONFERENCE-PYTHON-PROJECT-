from flask import Flask, render_template, request, jsonify, url_for
from flask_socketio import SocketIO, emit, join_room, leave_room
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

# SocketIO event handlers for WebRTC signaling

# Store rooms and connected users (could be optimized further if needed)
rooms = {}

@socketio.on('join_room')
def handle_join_room(data):
    """ User joins a room. """
    room = data['room']
    user = data['user']
    
    # Ensure room is initialized
    if room not in rooms:
        rooms[room] = []

    # Prevent duplicate users from joining the same room
    if user not in rooms[room]:
        join_room(room)
        rooms[room].append(user)
        print(f"{user} joined room {room}")
    else:
        print(f"{user} already in room {room}")
    
    emit('room_joined', {'room': room, 'users': rooms[room]}, room=room)


@socketio.on('leave_room')
def handle_leave_room(data):
    """ User leaves a room. """
    room = data['room']
    user = data['user']
    
    if user in rooms[room]:
        leave_room(room)
        rooms[room].remove(user)
        print(f"{user} left room {room}")
    else:
        print(f"{user} not found in room {room}")
    
    emit('room_left', {'room': room, 'users': rooms[room]}, room=room)


@socketio.on('offer')
def handle_offer(data):
    """ Handle incoming offer and forward it to the other peer. """
    room = data['room']
    if 'offer' in data:
        emit('offer', data['offer'], room=room, skip_sid=request.sid)
    else:
        print(f"Invalid offer data received: {data}")


@socketio.on('answer')
def handle_answer(data):
    """ Handle incoming answer and forward it to the other peer. """
    room = data['room']
    if 'answer' in data:
        emit('answer', data['answer'], room=room, skip_sid=request.sid)
    else:
        print(f"Invalid answer data received: {data}")


@socketio.on('candidate')
def handle_candidate(data):
    """ Handle incoming ICE candidates and forward them to the other peer. """
    room = data['room']
    if 'candidate' in data:
        emit('candidate', data['candidate'], room=room, skip_sid=request.sid)
    else:
        print(f"Invalid candidate data received: {data}")


@socketio.on('disconnect')
def handle_disconnect():
    """ Clean up when a user disconnects. """
    for room, users in rooms.items():
        for user in users:
            if user == request.sid:
                users.remove(user)
                print(f"User {request.sid} disconnected from room {room}")
                emit('room_left', {'room': room, 'users': users}, room=room)
                break

# Import routes
from routes import *

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("Database tables created.")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True, ssl_context=('cert.pem', 'key.pem'))
