/**
 * CineMatch - Frontend Controller
 * Communicates with Flask ML backend running at http://127.0.0.1:5000
 */

// Base endpoint of your Flask API
const API_BASE_URL = 'http://127.0.0.1:5000/recommend';

// DOM Elements
const movieInput = document.getElementById('movie-input');
const recommendBtn = document.getElementById('recommend-btn');
const clearBtn = document.getElementById('clear-btn');
const btnText = recommendBtn.querySelector('.btn-text');
const btnLoader = recommendBtn.querySelector('.btn-loader');

const stateEmpty = document.getElementById('state-empty');
const stateLoading = document.getElementById('state-loading');
const stateError = document.getElementById('state-error');
const errorTitle = document.getElementById('error-title');
const errorMessage = document.getElementById('error-message');

const recommendationsGrid = document.getElementById('recommendations-grid');
const resultsMeta = document.getElementById('results-meta');

// Track state visibility helper
function setViewState(state) {
  // Hide all sections first
  stateEmpty.hidden = true;
  stateLoading.hidden = true;
  stateError.hidden = true;
  recommendationsGrid.hidden = true;
  resultsMeta.hidden = true;

  if (state === 'empty') {
    stateEmpty.hidden = false;
  } else if (state === 'loading') {
    stateLoading.hidden = false;
  } else if (state === 'error') {
    stateError.hidden = false;
  } else if (state === 'results') {
    recommendationsGrid.hidden = false;
    resultsMeta.hidden = false;
  }
}

// Toggle button loader
function setButtonLoading(isLoading) {
  if (isLoading) {
    recommendBtn.disabled = true;
    btnText.hidden = true;
    btnLoader.hidden = false;
  } else {
    recommendBtn.disabled = false;
    btnText.hidden = false;
    btnLoader.hidden = true;
  }
}

// Show error message helper
function showError(title, message) {
  setViewState('error');
  errorTitle.textContent = title;
  errorMessage.textContent = message;
}

// Fetch recommendations from Flask backend
async function fetchRecommendations() {
  const query = movieInput.value.trim();

  // 1. Client-side input validation
  if (!query) {
    movieInput.focus();
    showError(
      'Movie Title Required',
      'Please enter a movie title before requesting recommendations.'
    );
    return;
  }

  // 2. Set UI loading states
  setViewState('loading');
  setButtonLoading(true);

  try {
    // 3. Make GET request to Flask backend: /recommend?movie=QUERY
    const url = `${API_BASE_URL}?movie=${encodeURIComponent(query)}`;
    const response = await fetch(url);

    // 4. Handle HTTP failure codes (e.g. 404, 500)
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`The movie "${query}" was not found in the database. Please check spelling or try another title.`);
      } else {
        throw new Error(`Server returned status ${response.status}. Please check your backend logs.`);
      }
    }

    // 5. Parse JSON payload: { "movie": "...", "recommendations": [...] }
    const data = await response.json();

    if (!data.recommendations || data.recommendations.length === 0) {
      showError(
        'No Recommendations Found',
        `No similar movies could be determined for "${data.movie || query}".`
      );
      return;
    }

    // 6. Render results
    renderRecommendations(data.movie, data.recommendations);
    setViewState('results');

    // Smooth scroll down to recommendations
    document.getElementById('discover').scrollIntoView({ behavior: 'smooth' });

  } catch (err) {
    // Graceful error handling for offline Flask or network issues
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      showError(
        'Backend Connection Failed',
        'Could not reach Flask backend at http://127.0.0.1:5000. Ensure app.py is running and CORS is enabled if accessed on a different port.'
      );
    } else {
      showError('Recommendation Error', err.message);
    }
  } finally {
    setButtonLoading(false);
  }
}

// Render movie recommendation cards into the DOM
function renderRecommendations(searchedMovie, recommendations) {
  recommendationsGrid.innerHTML = '';
  resultsMeta.innerHTML = `Showing ${recommendations.length} recommendations similar to: <strong>${escapeHtml(searchedMovie)}</strong>`;

  recommendations.forEach((item, index) => {
    // Gracefully handle if recommendation is a string or an object with title & genre
    const movieTitle = typeof item === 'string' ? item : (item.title || 'Unknown Title');
    const movieGenre = typeof item === 'object' && item.genre ? item.genre : null;

    const card = document.createElement('article');
    card.className = 'movie-card';
    card.style.animationDelay = `${index * 0.08}s`;

    card.innerHTML = `
      <div class="movie-poster-placeholder">
        <svg class="poster-watermark" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
        </svg>
        <span class="poster-badge">Match #${index + 1}</span>
        <svg class="poster-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
          <line x1="7" y1="2" x2="7" y2="22"></line>
          <line x1="17" y1="2" x2="17" y2="22"></line>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <line x1="2" y1="7" x2="7" y2="7"></line>
          <line x1="2" y1="17" x2="7" y2="17"></line>
          <line x1="17" y1="17" x2="22" y2="17"></line>
          <line x1="17" y1="7" x2="22" y2="7"></line>
        </svg>
      </div>
      <div class="movie-card-info">
        <h3 class="movie-card-title">${escapeHtml(movieTitle)}</h3>
        ${movieGenre ? `<p class="movie-card-genres">${escapeHtml(movieGenre)}</p>` : ''}
      </div>
    `;

    recommendationsGrid.appendChild(card);
  });
}

// Utility: Prevent XSS by sanitizing input text
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Event Listeners
recommendBtn.addEventListener('click', fetchRecommendations);

movieInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    fetchRecommendations();
  }
});

movieInput.addEventListener('input', () => {
  clearBtn.hidden = movieInput.value.length === 0;
});

clearBtn.addEventListener('click', () => {
  movieInput.value = '';
  clearBtn.hidden = true;
  movieInput.focus();
  setViewState('empty');
});