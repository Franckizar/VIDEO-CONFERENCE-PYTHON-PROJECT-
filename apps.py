from flask import Flask, render_template, request, jsonify, url_for
from flask_socketio import SocketIO
import logging
from flask_cors import CORS

app = Flask(__name__, static_url_path='/static')
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# In-memory storage for signaling data
signaling_data = {
    "offer": None,
    "answer": None,
    "candidates": []
}

# Logging setup
logging.basicConfig(level=logging.INFO)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/created')
def created():
    return render_template('created.html')

@app.route('/join')
def join():
    return render_template('join.html')

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

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

@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store'
    return response

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)