import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import NearestNeighbors

# Load dataset
movies = pd.read_csv("data/movies.csv")

# Fix movie ID column name
movies = movies.rename(columns={"wmovieId": "movieId"})

# Load MovieLens external ID links
links = pd.read_csv("data/links.csv")

# Bridge the datasets using movieId
movies = movies.merge(links, on="movieId", how="left")

print(movies.head())
print(movies.columns)

# Prepare features
movies["features"] = movies["genres"].str.replace("|", " ", regex=False)

# Convert genres into numerical vectors
tfidf = TfidfVectorizer()
tfidf_matrix = tfidf.fit_transform(movies["features"])

print("TF-IDF matrix shape:", tfidf_matrix.shape)

# Create recommendation model
model = NearestNeighbors(
    metric="cosine",
    algorithm="brute"
)

# Train the model
model.fit(tfidf_matrix)

print("Recommendation model trained!")


# Recommendation function
def recommend(movie_title, n=5):
    movie_index = movies[movies["title"] == movie_title].index

    if len(movie_index) == 0:
        return "Movie not found"

    movie_index = movie_index[0]

    distances, indices = model.kneighbors(
        tfidf_matrix[movie_index],
        n_neighbors=n + 1
    )

    recommended_movies = movies.iloc[indices[0][1:]][["title", "tmdbId"]]
    return recommended_movies.to_dict(orient="records")


print(recommend("Toy Story (1995)"))