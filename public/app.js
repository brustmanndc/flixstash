const searchId = document.getElementById("search-id");
const searchMsg = document.getElementById("search-message");
const searchResults = document.getElementById("search-results");
const token = localStorage.getItem("token");
const liveSearchResults = document.getElementById("live-search-results");
const surpriseButton = document.getElementById("surprise-button");
const surpriseResult = document.getElementById("surprise-result");
const surprisePopup = document.getElementById("surprise-popup");

const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      if (registration.installing) {
        console.log("Service worker installing");
      } else if (registration.waiting) {
        console.log("Service worker installed");
      } else if (registration.active) {
        console.log("Service worker active");
      }
    } catch (error) {
      console.log(`Registration failed with ${error}`);
    }
  }
};

registerServiceWorker();

async function loadWatchlistForSurprise() {
  const token = localStorage.getItem("token");

  const response = await fetch("/api/watchlist", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.log("Watchlist konnte nciht geladen werden");
    return [];
  }

  const data = await response.json();
  return data.watchlist;
}

if (surpriseButton && surpriseResult && surprisePopup) {
  surpriseButton.addEventListener("click", async () => {
    const watchlistEntries = await loadWatchlistForSurprise();

    const wantToWatch = watchlistEntries.filter((movie) => {
      return movie.status === "want_to_watch";
    });

    if (wantToWatch.length === 0) {
      surpriseResult.textContent =
        'Du hast keine Titel mit dem Status "Want to Watch"!';
      return;
    }

    const randomIndex = Math.floor(Math.random() * wantToWatch.length);
    const surpriseTitle = wantToWatch[randomIndex];

    surpriseResult.replaceChildren();
    surprisePopup.style.display = "flex";

    const surpriseCard = document.createElement("div");
    surpriseCard.classList.add("watchlist-card");

    surpriseCard.addEventListener("click", () => {
      location.href = `/movie?id=${surpriseTitle.movieId}&type=${surpriseTitle.type}`;
    });

    const poster = document.createElement("img");
    poster.classList.add("watchlist-poster");

    if (surpriseTitle.posterPath) {
      poster.src = `https://image.tmdb.org/t/p/w500${surpriseTitle.posterPath}`;
    } else {
      poster.src = "/images/no-poster.png";
    }
    surpriseCard.appendChild(poster);

    const surpriseInfo = document.createElement("div");

    const title = document.createElement("h3");
    title.textContent = surpriseTitle.title;

    const type = document.createElement("p");
    type.textContent = surpriseTitle.type === "movie" ? "Film" : "Serie";

    const overview = document.createElement("p");
    overview.textContent = surpriseTitle.overview;

    surpriseInfo.append(title, type, overview);
    surpriseCard.appendChild(surpriseInfo);

    const closeButton = document.createElement("button");
    closeButton.classList.add("close-button");
    closeButton.textContent = "X";

    closeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      surprisePopup.style.display = "none";
      surpriseResult.replaceChildren();
    });

    surpriseResult.appendChild(closeButton);
    surpriseResult.appendChild(surpriseCard);
  });
}

surprisePopup.addEventListener("click", (event) => {
  if (event.target === surprisePopup) {
    surprisePopup.style.display = "none";
    surpriseResult.replaceChildren();
  }
});

if (!token) {
  location.href = "/";
}

searchId.value = "";

async function searchTitles(query, targetContainer, showMessage = true) {
  targetContainer.replaceChildren();

  try {
    const response = await fetch(
      `/api/search?query=${encodeURIComponent(query)}`,
    );

    const data = await response.json();

    if (data.results.length === 0) {
      searchMsg.textContent = "Keine passenden Titel gefunden";
      return;
    }

    if (showMessage) {
      searchMsg.textContent = `${data.results.length} Ergebnisse gefunden.`;
    }

    data.results.forEach((item) => {
      const resultCard = document.createElement("div");
      resultCard.classList.add("result-card");

      const infoContainer = document.createElement("div");
      infoContainer.classList.add("result-info");

      const title = document.createElement("h3");
      title.textContent = item.title;

      const type = document.createElement("p");
      type.textContent = item.type === "movie" ? "Film" : "Serie";

      const releaseDate = document.createElement("p");
      releaseDate.textContent = item.release_date
        ? `Erscheinungstermin: ${item.release_date}`
        : "Erscheinungstermin unbekannt";

      const overview = document.createElement("p");
      overview.textContent = item.overview || "Keine Beschreibung verfügbar";

      const poster = document.createElement("img");
      if (item.poster_path) {
        poster.src = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
        poster.alt = `Poster von ${item.title}`;
      } else {
        poster.src = "/images/no-poster.png";
      }

      infoContainer.append(title, type, overview, releaseDate);
      resultCard.append(poster, infoContainer);
      targetContainer.append(resultCard);

      resultCard.addEventListener("click", () => {
        location.href = `/movie?id=${item.id}&type=${item.type}`;
      });
    });
  } catch (error) {
    console.log(error);

    if (showMessage) {
      searchMsg.textContent = "Suche ist fehlgeschlagen";
    }
  }
}
let searchTimeout;

searchId.addEventListener("input", () => {
  clearTimeout(searchTimeout);

  const query = searchId.value.trim();

  if (query.length < 3) {
    liveSearchResults.replaceChildren();
    return;
  }

  searchTimeout = setTimeout(() => {
    searchTitles(query, liveSearchResults, false);
  }, 300);
});

async function loadStatistics() {
  const token = localStorage.getItem("token");

  const response = await fetch("/api/statistics", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.log("Statistiken konnten nicht geladen werden");
    return;
  }

  const statistics = await response.json();

  document.getElementById("stat-want-to-watch").textContent =
    statistics.want_to_watch;
  document.getElementById("stat-currently-watching").textContent =
    statistics.currently_watching;
  document.getElementById("stat-completed").textContent = statistics.completed;
  document.getElementById("stat-dropped").textContent = statistics.dropped;
}

loadStatistics();
