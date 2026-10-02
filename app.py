from flask import Flask, jsonify, request
from flask_cors import CORS
from model import recommend
from dotenv import load_dotenv
import os
import requests
import pandas as pd

load_dotenv()

TMDB_READ_TOKEN = os.getenv("TMDB_READ_TOKEN")


# --------------------------------------------------
# Flask app
# --------------------------------------------------

app = Flask(__name__)
CORS(app)


# --------------------------------------------------
# Get movie poster from TMDB
# --------------------------------------------------

def get_poster(tmdb_id, movie_title):
    headers = {
        "Authorization": f"Bearer {TMDB_READ_TOKEN}"
    }

    try:
        # 1. Try TMDB ID first
        if pd.notna(tmdb_id):
            url = f"https://api.themoviedb.org/3/movie/{int(tmdb_id)}"

            response = requests.get(
                url,
                headers=headers,
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                poster_path = data.get("poster_path")

                if poster_path:
                    return f"https://image.tmdb.org/t/p/w500{poster_path}"

        # 2. If ID fails, search by movie title
        search_url = "https://api.themoviedb.org/3/search/movie"

        response = requests.get(
            search_url,
            headers=headers,
            params={"query": movie_title},
            timeout=10
        )

        if response.status_code != 200:
            return None

        data = response.json()
        results = data.get("results", [])

        # 3. Check all search results
        for result in results:
            poster_path = result.get("poster_path")

            if poster_path:
                return f"https://image.tmdb.org/t/p/w500{poster_path}"

        return None

    except requests.exceptions.RequestException:
        return None


# --------------------------------------------------
# Home route
# --------------------------------------------------

@app.route("/")
def home():
    return "Movie Recommendation API is running!"


# --------------------------------------------------
# Recommendation route
# --------------------------------------------------

@app.route("/recommend")
def get_recommendations():
    movie = request.args.get("movie")

    if not movie:
        return jsonify({
            "error": "Please provide a movie title"
        }), 400

    recommendations = recommend(movie)

    # Movie wasn't found
    if isinstance(recommendations, str):
        return jsonify({
            "error": recommendations
        }), 404

    # Add poster URL to every recommendation
    for item in recommendations:
        item["poster_url"] = get_poster(
            item["tmdbId"],
            item["title"]
        )

    return jsonify({
        "movie": movie,
        "recommendations": recommendations
    })


# --------------------------------------------------
# Run Flask
# --------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True)