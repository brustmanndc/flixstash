const movieDetails = document.getElementById("movie-details");
const moviePoster = document.getElementById("movie-poster");
const movieMainInfo = document.getElementById("movie-main-info");
const movieExtraInfo = document.getElementById("movie-extra-info");
const params = new URLSearchParams(window.location.search);
const movieId = params.get("id");
const movieType = params.get("type");
const posterPopup = document.getElementById("poster-popup");
const popupPoster = document.getElementById("popup-poster");
const closePosterPopup = document.getElementById("close-poster-popup");

closePosterPopup.addEventListener("click", () => {
  posterPopup.style.display = "none";
});

posterPopup.addEventListener("click", (event) => {
  if (event.target === posterPopup) {
    posterPopup.style.display = "none";
  }
});

async function loadMovieDetails() {
  if (!movieId || (movieType !== "movie" && movieType !== "tv")) {
    movieDetails.textContent = "Kein gültiger Titel ausgewählt";
    return;
  }

  try {
    const response = await fetch(
      `/api/movie-details?id=${encodeURIComponent(movieId)}&type=${encodeURIComponent(movieType)}`,
    );
    const data = await response.json();

    if (!response.ok) {
      movieDetails.textContent =
        data.error || "Filmdetails konnten nicht geladen werden";
      return;
    }

    let personalRating = null;

    const token = localStorage.getItem("token");
    if (token) {
      const watchlistResponse = await fetch("/api/watchlist", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (watchlistResponse.ok) {
        const watchlistData = await watchlistResponse.json();

        const watchlistEntry = watchlistData.watchlist.find(
          (entry) =>
            entry.movieId === Number(movieId) && entry.type === movieType,
        );

        if (watchlistEntry && watchlistEntry.rating !== null) {
          personalRating = watchlistEntry.rating;
        }
      }
    }

    let personalRatingText = "Keine eigene Bewertung";
    if (personalRating !== null) {
      personalRatingText = `${"★".repeat(personalRating)}${"☆".repeat(5 - personalRating)}`;
    }

    const title = data.title || "Unbekannter Titel";
    const overview = data.overview || "Keine Beschreibung verfügbar";
    let year = "Kein Erscheinungstermin verfügbar";
    if (data.release_date) {
      const date = new Date(data.release_date);
      year = `${date.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}`;
    }
    let genres = "Keine Genres verfügbar";
    if (data.genres) {
      genres = data.genres.map((genre) => genre.name).join(", ");
    }
    const tmdbRating = data.vote_average
      ? `${data.vote_average.toFixed(1)} / 10 (${data.vote_count} Stimmen)`
      : "Keine Bewertung vorhanden";

    let production_countries = "Keine Informationen verfügbar";
    if (data.production_countries && data.production_countries.length > 0) {
      production_countries = data.production_countries
        .map((country) => country.name)
        .join(", ");
    }

    document.title = `FlixStash - ${title}`;

    moviePoster.innerHTML = `${data.poster_path ? `<img src="https://image.tmdb.org/t/p/w500${data.poster_path}" alt="Poster von ${title}" style="max-width: 250px;">` : ""}`;

    const posterImg = moviePoster.querySelector("img");

    if (posterImg) {
      posterImg.style.cursor = "zoom-in";

      posterImg.addEventListener("click", () => {
        popupPoster.src = posterImg.src;
        posterPopup.style.display = "flex";
      });
    }

    movieMainInfo.innerHTML = `
        <h2>${title}</h2>
        <p><span style="text-decoration: underline">Erscheinungstermin:</span><br> ${year}</p>
        <p><span style="text-decoration: underline">Genres:</span> <br> ${genres}</p>
        <p><span style="text-decoration: underline">Herkunft:</span><br> ${production_countries}</p>
        <p><span style="text-decoration: underline">Plot:</span><br> ${overview}</p>
        <p><span style="text-decoration: underline">TMDB Bewertung:</span><br> ${tmdbRating}</p>
        <p><span style="text-decoration: underline">Meine Bewertung:</span><br> ${personalRatingText}</p>`;

    movieExtraInfo.innerHTML = `
        <button id='add-watchlist-button'>Zur Watchlist hinzufügen</button>
        <p id="watchlist-msg"></p>
        `;

    const addWatchlistButton = document.getElementById("add-watchlist-button");
    const watchlistMessage = document.getElementById("watchlist-msg");

    addWatchlistButton.addEventListener("click", async () => {
      const token = localStorage.getItem("token");

      try {
        const response = await fetch("/api/watchlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            movieId: data.id,
            type: data.type,
            title: data.title,
            posterPath: data.poster_path,
            releaseDate: data.release_date,
            overview: data.overview,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          watchlistMessage.textContent = result.error;
          return;
        }

        watchlistMessage.textContent = result.message;
      } catch (error) {
        console.log("Watchlist Fehler:", error);
        watchlistMessage.textContent = "Verbindung zum Server fehlgeschlagen";
      }
    });
  } catch (error) {
    console.log("Fehler:", error);
    movieDetails.textContent = "Verbindung zum Server ist fehlgeschlagen";
  }
}

loadMovieDetails();
