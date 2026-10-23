require('dotenv').config();

const express = require('express');

const app = express();
const PORT = 3000;

app.use(express.static('public'));

app.get('/api/search', async (req, res) => {
    const searchQuery = req.query.query;

    if(!searchQuery || !searchQuery.trim()) {
        return res.status(400).json({
            error: 'Bitte gib einen Suchbegriff ein'
        });
    }

    try {
        const url = new URL('https://api.themoviedb.org/3/search/multi')
        url.searchParams.set('query', searchQuery);

        const response = await fetch(url, {
                headers: {
                        Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
                         accept: 'application/json'
                        }
        });

        if (!response.ok) {
            return res.status(response.status).json({
                error: 'Die Suche ist fehlgeschlagen'
            });
        };

        const data = await response.json();

        const moviesAndShows = data.results.filter(entry => {
            return entry.media_type === 'movie' || entry.media_type === 'tv'
        });

        const results = moviesAndShows.map(entry => {
            return {
                id: entry.id,
                title: entry.title || entry.name,
                type: entry.media_type,
                release_date: entry.release_date || entry.first_air_date,
                overview: entry.overview,
                poster_path: entry.poster_path
            };
        });

        return res.json({ results });
    } catch (error) {
        console.log('Fehler: ', error.message);
        return res.status(500).json({
            error: 'Die Suche konnte nicht durchgeführt werden'
        });
    }
});


app.listen(PORT, () => {
    console.log(`FlixStash läuft auf ${PORT}`);
});

