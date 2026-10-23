const searchForm = document.getElementById('search');
const searchId = document.getElementById ('search-id');
const searchMsg= document.getElementById ('search-message');
const searchResults = document.getElementById('search-results');

searchForm.addEventListener('submit', async (event) =>  {
    event.preventDefault();

    const query = searchId.value.trim();

    searchResults.replaceChildren();

    try {
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);

        const data = await response.json();

        if (data.results.length === 0) {
            searchMsg.textContent = 'Keine passenden Titel gefunden';
            return
        };

        searchMsg.textContent = `${data.results.length} Ergebnisse gefunden.`;

        data.results.forEach((item) => {
            const resultCard = document.createElement('div');

            const title = document.createElement('h3');
            title.textContent = item.title;

            const type = document.createElement('p');
            type.textContent = item.type === 'movie' ? 'Film' : 'Serie'

            const releaseDate = document.createElement('p');
            releaseDate.textContent = item.release_date ? `Erscheinungstermin: ${item.release_date}` : 'Erscheinungstermin unbekannt'

            const overview = document.createElement('p');
            overview.textContent = item.overview || 'Keine Beschreibung verfügbar';
            
            resultCard.append(title, type, releaseDate, overview);
            searchResults.appendChild(resultCard);
        });

    } catch (error) {
        console.log(error);
        searchMsg.textContent = 'Suche ist fehlgeschlagen'
    }
});

