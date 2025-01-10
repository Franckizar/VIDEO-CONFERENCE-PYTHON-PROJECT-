from flask import render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from app import app, db
from models import User

# In-memory storage for signaling data
signaling_data = {
    "offer": None,
    "answer": None,
    "candidates": []
}

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

# Authentication Routes
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        role = request.form['role']

        # Create user
        user = User(username=username, email=email, role=role)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        flash('Registration successful! You can now log in.')
        return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        print(f"Login attempt with email: {email}")  # Debug log
        
        user = User.query.filter_by(email=email).first()
        if user:
            print(f"User found: {user.username}")  # Debug log
            if user.check_password(password):
                print("Password check passed")  # Debug log
                login_user(user)
                print(f"User logged in successfully: {current_user.is_authenticated}")  # Debug log
                flash('Login successful!')
                return redirect(url_for('dashboard'))
            else:
                print("Password check failed")  # Debug log
                flash('Invalid password')
        else:
            print("No user found with this email")  # Debug log
            flash('Invalid email')
    return render_template('login.html')

@app.route('/dashboard')
@login_required
def dashboard():
    print(f"Accessing dashboard. User authenticated: {current_user.is_authenticated}")  # Debug log
    return render_template('dashboard.html', user=current_user)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.')
    return redirect(url_for('login'))