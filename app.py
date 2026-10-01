from flask import Flask, jsonify, request
from flask_cors import CORS
from model import recommend

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return "Movie Recommendation API is running!"


@app.route("/recommend")
def get_recommendations():
    movie = request.args.get("movie")

    if not movie:
        return jsonify({"error": "Please provide a movie title"}), 400

    recommendations = recommend(movie)

    return jsonify({
        "movie": movie,
        "recommendations": recommendations
    })


if __name__ == "__main__":
    app.run(debug=True)