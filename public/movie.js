const movieDetails = document.getElementById('movie-details');
const params = new URLSearchParams(window.location.search);
const movieId = params.get('id');
const movieType = params.get('type');

async function loadMovieDetails(){
    if (!movieId || (movieType !== 'movie' && movieType !== 'tv')){
        movieDetails.textContent = 'Kein gültiger Titel ausgewählt';
        return;
    }


try {
    const response = await fetch(`/api/movie-details?id=${encodeURIComponent(movieId)}&type=${encodeURIComponent(movieType)}`);
    const data = await response.json();

    if (!response.ok){
        movieDetails.textContent = data.error || 'Filmdetails konnten nicht geladen werden';
        return
    }

    const title = data.title || 'Unbekannter Titel';
    const overview = data.overview || 'Keine Beschreibung verfügbar';
    const year = data.release_date ? `Erscheinungstermin: ${data.release_date}` : 'Kein Erscheinungstermin verfügbar';

    document.title = `FlixStash - ${title}`;

    movieDetails.innerHTML = `
        ${data.poster_path ? `<img src="https://image.tmdb.org/t/p/w500${data.poster_path}" alt="Poster von ${title}" style="max-width: 250px;">` : ''}
        <h1>${title}</h1>
        <p>${year}</p>
        <p>${overview}</p>
    `;
} catch (error) {
    console.log('Fehler:', error);
    movieDetails.textContent = 'Verbindung zum Server ist fehlgeschlagen';
}


};

loadMovieDetails();