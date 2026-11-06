const watchlistResult = document.getElementById('watchlist-results');
const logoutButton = document.getElementById ('logout-button');
const token = localStorage.getItem('token');
const surpriseButton = document.getElementById('surprise-button');
const surpriseResult = document.getElementById('surprise-result');
const filterButtons = document.querySelectorAll('.filter-button');

if(!token) {
    location.href = '/';
};

logoutButton.addEventListener('click', () => {
    localStorage.removeItem('token');
    location.href = '/';
});

let currentFilter = 'all'

filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
        currentFilter = button.dataset.status;

        filterButtons.forEach((filterButton) => {
            filterButton.classList.remove('active');
        });

        button.classList.add('active');

        loadWatchlist();
    });
});

let watchlistEntries = [];

async function loadWatchlist() {
    try{
        const response = await fetch('/api/watchlist', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if(!response.ok){
            watchlistResult.textContent = data.error
            return
        }

        watchlistEntries = data.watchlist;

        const entriesToDisplay = currentFilter === 'all'
            ? watchlistEntries
            : watchlistEntries.filter((movie) => {
                return movie.status === currentFilter;
            });

         watchlistResult.replaceChildren();

        if (entriesToDisplay.length === 0) {
            watchlistResult.textContent = currentFilter === 'all'
                ? 'Deine Watchlist ist noch leer'
                : 'Keine Titel in dieser Kategorie'
            return
        }

        entriesToDisplay.forEach((movie) => {
            const movieCard = document.createElement('div');
            movieCard.classList.add('watchlist-card');

            if(movie.posterPath){
                const poster = document.createElement('img');

                poster.src = `https://image.tmdb.org/t/p/w500${movie.posterPath}`;
                poster.classList.add('watchlist-poster');

                movieCard.appendChild(poster)
            }

            const movieInfo = document.createElement('div');
            
            const title = document.createElement('h3');
            title.textContent = movie.title;

            const type = document.createElement('p');
            type.textContent = movie.type === 'movie' ? 'Film' : 'Serie';

            const statusSelect = document.createElement('select');
            const statusValues = [
                { value: 'want_to_watch', label: 'Want to Watch' },
                { value: 'currently_watching', label: 'Currently Watching' },
                { value: 'dropped', label: 'Dropped' },
                { value: 'completed', label: 'Completed' },
            ];
            statusValues.forEach((statusOption) => {
                const option = document.createElement('option');

                option.value = statusOption.value;
                option.textContent = statusOption.label;

                statusSelect.appendChild(option);
            });
            statusSelect.value = movie.status;
            
            const statusText = document.createElement('p');
            const currentStatus = statusValues.find((statusOption) => {
                return statusOption.value === movie.status;
            });

            statusText.textContent = `Status: ${currentStatus.label}`;

            statusSelect.addEventListener('change', async () => {
                try {
                    const response = await fetch (`/api/watchlist/${movie._id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            status: statusSelect.value
                        })
                    });

                    const result = await response.json();

                    if(!response.ok) {
                        alert(result.error);
                        statusSelect.value = movie.status;
                        return
                    }

                    movie.status = statusSelect.value;

                    const currentStatus = statusValues.find((statusOption) => {
                        return statusOption.value === movie.status;
                    });

                    statusText.textContent = `Status: ${currentStatus.label}`;

                } catch(error)  {
                    console.log('Fehler beim Ändern des Status:', error);
                    alert('Status konnte nicht geändert werden');
                    statusSelect.value = movie.status;
                }
            });

            const ratingDiv = document.createElement('div');
            ratingDiv.classList.add('rating-div');

            const ratingText = document.createElement('p');
            ratingText.textContent = 'Deine Bewertung:';

            ratingDiv.appendChild(ratingText);

            const stars = [];

            for (let i= 1; i <=5; i++) {
                const star = document.createElement('span');

                star.textContent = '☆';
                star.classList.add('star');

                ratingDiv.appendChild(star);
                stars.push(star);
            }

            if (movie.rating !== null && movie.rating !== undefined) {
                stars.forEach((star, index) => {
                    if (index < movie.rating) {
                        star.textContent = "★"
                    }
                });
            }

            stars.forEach((star, index) => {
                star.addEventListener('click', async () => {
                    const rating = index + 1;

                    try {
                        const response = await fetch(`/api/watchlist/${movie._id}`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                rating: rating
                            })
                        });

                        const result = await response.json();

                        if(!response.ok) {
                            alert(result.error)
                            return
                        }

                        stars.forEach((star, starIndex) => {
                        if (starIndex < rating)  {
                            star.textContent = '★';
                        } else {
                            star.textContent = '☆';
                        }
                    });
                } catch(error) {
                    console.log('Fehler beim Speichern der Bewertung:', error);
                    alert('Bewertung konnte nicht gespeichert werden')
                }
            });
        });

            movieInfo.append(title, type, statusText, statusSelect, ratingDiv);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Aus Watchlist entfernen';

            deleteButton.addEventListener('click', async () => {

                try {
                    const response = await fetch(`/api/watchlist/${movie._id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    const result = await response.json();

                    if (!response.ok) {
                        alert(result.error)
                        return
                    }
                    movieCard.remove();
                } catch(error){
                    console.log('Fehler beim Löschen: ', error);
                    alert('Titel konnte nicht entfernt werden');
                }
            });

            movieInfo.appendChild(deleteButton);
            movieCard.appendChild(movieInfo);
            watchlistResult.appendChild(movieCard);
        });

    } catch (error) {
        console.log('Watchlist Fehler:', error);
        watchlistResult.textContent = 'Watchlist konnte nicht geladen werden'
    }
};


surpriseButton.addEventListener('click', () => {
    const wantToWatch = watchlistEntries.filter((movie) => {
        return movie.status === 'want_to_watch'
        });

        if (wantToWatch.length === 0){
            surpriseResult.textContent = 'Du hast keine Titel mit dem Status "Want to Watch"!'
            return
        }

    const randomIndex = Math.floor(Math.random() * wantToWatch.length);
    const surpriseTitle = wantToWatch[randomIndex];

    surpriseResult.replaceChildren();

    const surpriseCard = document.createElement('div');
    surpriseCard.classList.add('watchlist-card');

    if (surpriseTitle.posterPath){
        const poster = document.createElement('img');

        poster.src = `https://image.tmdb.org/t/p/w500${surpriseTitle.posterPath}`;
        poster.classList.add('watchlist-poster');

        surpriseCard.appendChild(poster);
    }

    const surpriseInfo = document.createElement('div');

    const title = document.createElement('h3');
    title.textContent = surpriseTitle.title;

    const type = document.createElement('p');
    type.textContent = surpriseTitle.type === 'movie' ? 'Film' : 'Serie';

    const overview = document.createElement('p');
    overview.textContent = surpriseTitle.overview;

    surpriseInfo.append(title, type, overview);
    surpriseCard.appendChild(surpriseInfo);
    surpriseResult.appendChild(surpriseCard);
});

loadWatchlist();