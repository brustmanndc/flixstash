const watchlistResult = document.getElementById("watchlist-results");
const token = localStorage.getItem("token");
const filterButtons = document.querySelectorAll(".filter-button");

if (!token) {
  location.href = "/";
}

let currentFilter = "all";

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.status;

    filterButtons.forEach((filterButton) => {
      filterButton.classList.remove("active");
    });

    button.classList.add("active");

    loadWatchlist();
  });
});

let watchlistEntries = [];

async function loadWatchlist() {
  try {
    const response = await fetch("/api/watchlist", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      watchlistResult.textContent = data.error;
      return;
    }

    watchlistEntries = data.watchlist;

    const entriesToDisplay =
      currentFilter === "all"
        ? [...watchlistEntries]
        : watchlistEntries.filter((movie) => {
            return movie.status === currentFilter;
          });
    entriesToDisplay.sort((a, b) => {
      return a.title.localeCompare(b.title, "en");
    });

    watchlistResult.replaceChildren();

    if (entriesToDisplay.length === 0) {
      watchlistResult.textContent =
        currentFilter === "all"
          ? "Deine Watchlist ist noch leer"
          : "Keine Titel in dieser Kategorie";
      return;
    }

    entriesToDisplay.forEach((movie) => {
      const movieCard = document.createElement("div");
      movieCard.classList.add("watchlist-card");

      const poster = document.createElement("img");
      poster.classList.add("watchlist-poster");
      poster.style.cursor = "pointer";
      poster.addEventListener("click", () => {
        location.href = `/movie?id=${movie.movieId}&type=${movie.type}`;
      });

      if (movie.posterPath) {
        poster.src = `https://image.tmdb.org/t/p/w500${movie.posterPath}`;
      } else {
        poster.src = "/images/no-poster.png";
      }

      movieCard.appendChild(poster);

      const movieInfo = document.createElement("div");
      movieInfo.classList.add("movie-info");

      const title = document.createElement("h3");
      title.textContent = movie.title;
      title.style.cursor = "pointer";
      title.addEventListener("click", () => {
        location.href = `/movie?id=${movie.movieId}&type=${movie.type}`;
      });

      const type = document.createElement("p");
      type.textContent = movie.type === "movie" ? "Film" : "Serie";

      const statusSelect = document.createElement("select");
      const statusValues = [
        { value: "want_to_watch", label: "Want to Watch" },
        { value: "currently_watching", label: "Currently Watching" },
        { value: "dropped", label: "Dropped" },
        { value: "completed", label: "Completed" },
      ];
      statusValues.forEach((statusOption) => {
        const option = document.createElement("option");

        option.value = statusOption.value;
        option.textContent = statusOption.label;

        statusSelect.appendChild(option);
      });
      statusSelect.value = movie.status;

      statusSelect.addEventListener("change", async () => {
        try {
          const response = await fetch(`/api/watchlist/${movie._id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              status: statusSelect.value,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            alert(result.error);
            statusSelect.value = movie.status;
            return;
          }

          movie.status = statusSelect.value;

          ratingVisibility();
          loadWatchlist();
        } catch (error) {
          console.log("Fehler beim Ändern des Status:", error);
          alert("Status konnte nicht geändert werden");
          statusSelect.value = movie.status;
        }
      });

      const ratingDiv = document.createElement("div");
      ratingDiv.classList.add("rating-div");

      const ratingText = document.createElement("p");

      ratingDiv.appendChild(ratingText);

      const stars = [];

      for (let i = 1; i <= 5; i++) {
        const star = document.createElement("span");

        star.textContent = "☆";
        star.classList.add("star");

        ratingDiv.appendChild(star);
        stars.push(star);
      }

      function ratingVisibility() {
        if (["completed", "dropped"].includes(movie.status)) {
          ratingDiv.style.display = "block";
        } else {
          ratingDiv.style.display = "none";
        }
      }

      ratingVisibility();

      if (movie.rating !== null && movie.rating !== undefined) {
        stars.forEach((star, index) => {
          if (index < movie.rating) {
            star.textContent = "★";
          }
        });
      }

      stars.forEach((star, index) => {
        star.addEventListener("click", async () => {
          const rating = index + 1;

          try {
            const response = await fetch(`/api/watchlist/${movie._id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                rating: rating,
              }),
            });

            const result = await response.json();

            if (!response.ok) {
              alert(result.error);
              return;
            }

            stars.forEach((star, starIndex) => {
              if (starIndex < rating) {
                star.textContent = "★";
              } else {
                star.textContent = "☆";
              }
            });
          } catch (error) {
            console.log("Fehler beim Speichern der Bewertung:", error);
            alert("Bewertung konnte nicht gespeichert werden");
          }
        });
      });

      movieInfo.append(title, type, statusSelect, ratingDiv);

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Aus Watchlist entfernen";

      deleteButton.addEventListener("click", async () => {
        try {
          const response = await fetch(`/api/watchlist/${movie._id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const result = await response.json();

          if (!response.ok) {
            alert(result.error);
            return;
          }
          movieCard.remove();
        } catch (error) {
          console.log("Fehler beim Löschen: ", error);
          alert("Titel konnte nicht entfernt werden");
        }
      });

      movieInfo.appendChild(deleteButton);
      movieCard.appendChild(movieInfo);
      watchlistResult.appendChild(movieCard);
    });
  } catch (error) {
    console.log("Watchlist Fehler:", error);
    watchlistResult.textContent = "Watchlist konnte nicht geladen werden";
  }
}

loadWatchlist();
