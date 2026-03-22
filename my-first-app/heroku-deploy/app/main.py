from flask import Flask, jsonify, redirect, render_template, request, send_from_directory
import firebase_admin
from firebase_admin import db
import random
import string

cred_obj = firebase_admin.credentials.Certificate('./ServiceAccountKey.json')
default_app = firebase_admin.initialize_app(cred_obj, {
    'databaseURL': 'https://url-shortener-app-55f27-default-rtdb.firebaseio.com/'
    })

app = Flask(__name__, static_folder='./build/static', template_folder="./build" )

@app.route("/")
def hello_world():
    return redirect("/app")

@app.route("/app")
def homepage():
    return render_template('index.html')


@app.route("/favicon.ico")
def favicon():
    return send_from_directory(app.template_folder, "favicon.ico")


@app.route("/manifest.json")
def manifest():
    return send_from_directory(app.template_folder, "manifest.json")


@app.route("/logo192.png")
def logo_192():
    return send_from_directory(app.template_folder, "logo192.png")


@app.route("/logo512.png")
def logo_512():
    return send_from_directory(app.template_folder, "logo512.png")


@app.route("/robots.txt")
def robots():
    return send_from_directory(app.template_folder, "robots.txt")


def generate_key(length=5):
    alphabet = string.ascii_letters + string.digits
    return ''.join(random.choice(alphabet) for _ in range(length))


@app.route('/api/shorten', methods=['POST'])
def create_short_link():
    payload = request.get_json(silent=True) or {}
    long_url = (payload.get('longURL') or '').strip()
    preferred_alias = (payload.get('preferedAlias') or '').strip()

    if not long_url:
        return jsonify({"error": "Missing longURL"}), 400

    if preferred_alias:
        generated_key = preferred_alias
    else:
        generated_key = generate_key()
        ref = db.reference("/" + generated_key)
        while ref.get():
            generated_key = generate_key()
            ref = db.reference("/" + generated_key)

    ref = db.reference("/" + generated_key)
    if ref.get():
        return jsonify({"error": "Alias is already taken"}), 409

    generated_url = request.host_url.rstrip('/') + '/' + generated_key
    ref.set({
        "generatedKey": generated_key,
        "longURL": long_url,
        "preferedAlias": preferred_alias,
        "generatedURL": generated_url,
    })

    return jsonify({
        "generatedKey": generated_key,
        "generatedURL": generated_url,
    }), 201

@app.route('/<path:generatedKey>', methods=['GET'])
def fetch_from_firebase(generatedKey):
    ref = db.reference("/" + generatedKey)
    data = ref.get()
    if not data:
        return '404 not found'
    else:
        longURL = data['longURL']
        return redirect(longURL)
