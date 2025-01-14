from flask import Response, jsonify, render_template, request, flash, redirect, url_for
from flask_login import login_user, logout_user, login_required, current_user
from app import app, db
from models import User
import cv2

# Initialize OpenCV Video Capture
camera = cv2.VideoCapture(0)  # Default webcam

# In-memory storage for signaling data
signaling_data = {
    "offer": None,
    "answer": None,
    "candidates": []
}

def generate_frames():
    while True:
        success, frame = camera.read()
        if not success:
            break
        else:
            _, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

# WebRTC Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/created')
def created():
    return render_template('created.html')

@app.route('/join')
def join():
    return render_template('join.html')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/getOffer', methods=['GET'])
def get_offer():
    if signaling_data["offer"]:
        return jsonify(signaling_data["offer"])
    return jsonify({"error": "No offer available"}), 404

@app.route('/signal', methods=['POST'])
def signal():
    try:
        data = request.json
        app.logger.info(f"Received signaling data: {data}")

        if data["type"] == "offer":
            signaling_data["offer"] = data["data"]
            return jsonify({"message": "Offer stored successfully."})
        elif data["type"] == "answer":
            signaling_data["answer"] = data["data"]
            return jsonify({"message": "Answer stored successfully."})
        elif data["type"] == "candidate":
            signaling_data["candidates"].append(data["data"])
            return jsonify({"message": "Candidate stored successfully."})
        else:
            return jsonify({"error": "Invalid signaling type."}), 400
    except Exception as e:
        app.logger.error(f"Error in signaling route: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/getCandidates', methods=['GET'])
def get_candidates():
    return jsonify(signaling_data["candidates"])
