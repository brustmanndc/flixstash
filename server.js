const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();

const express = require('express');
const { connectToDatabase } = require ('./db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { watch } = require('node:fs');
const { release } = require('node:os');
const { ObjectId } = require('mongodb');

const app = express();
const PORT = 3000;

let db;

app.use(express.json())
app.use(express.static('public'));

app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
        return res.status(400).json({
            error: 'Bitte fülle alle Felder aus'
        });
    }
    
    const emailSaved = email.toLowerCase();

    if (password.length < 8) { 
    return res.status(400).json({
        error: 'Das Passwort muss mindestens 8 Zeichen lang sein!'
    });
}

try {
    const users = db.collection('users');

    const userExists  = await users.findOne({ username: username });
    const emailExists = await users.findOne({ email: emailSaved });

    if (userExists  || emailExists) {
        return res.status(400).json ({
           error: 'Benutzername oder E-Mail bereits vergeben' 
            });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await users.insertOne({
        username: username,
        email: emailSaved,
        passwordHash: passwordHash
    });

    return res.status(200).json({
        message: 'Registrierung erfolgreich'
    });
} catch (error) {
    return res.status(500).json({
        error: 'Fehler bei der Registrierung'
    })
}
});


app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password){
        return res.status(400).json({
            error: 'Bitte Email und Passwort eingeben'
        });
    }

    try {
        const users = db.collection('users');

        const user = await users.findOne({
            email: email.toLowerCase()
        });
        if (!user){
            return res.status(400).json({
                error: 'Email oder Passwort ist falsch'
            });
        }
        const passwordCorrect = await bcrypt.compare(password, user.passwordHash);

        if(!passwordCorrect){
            return res.status(400).json ({
                error: 'Email oder Passwort ist falsch'
            });
        }

        const jwtSecretKey = process.env.JWT_SECRET_KEY;

        const payload = {
            sub: user._id.toString(),
            username: user.username
        };
        const token = jwt.sign(payload, jwtSecretKey);
        return res.json({ token });

    } catch (error){
        return res.status(500).json({
            error: 'Fehler beim Login'
        });
    }
});

function verifyToken(req, res, next) {
    const authorization = req.headers.authorization;
    
    if (!authorization){
        return res.status(400).json({
            error: 'Kein Token gefunden'
        });
    }

    const token = authorization.split(' ')[1];

    if(!token){
        return res.status(400).json({
            error: 'Kein Token gefunden'
        })
    }

    try {
        const userData = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = userData;
        next();
    } catch (error){
        return res.status(400).json({
            error: 'Token ist ungültig'
        });
    }
};

app.get('/api/protected', verifyToken, (req, res) => {
    res.json({
        message: 'Token gültig',
        username: req.user.username
    });
});

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

app.get('/api/movie-details', async (req,res) => {
    const { id, type } = req.query;
    
    if (!id || !['movie', 'tv'].includes(type)) {
        return res.status(400).json({
            error: 'Ungültige ID oder Type'
        });
    }

    try {
        const url = new URL(`https://api.themoviedb.org/3/${type}/${id}`);

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
                accept: 'application/json'
            }
        });

        if (!response.ok){
            return res.status(response.status).json({
                error: 'Filmdetails konnten nicht geladen werden'
            });
        }

        const entry = await response.json();

        return res.json({
                id: entry.id,
                title: entry.title || entry.name,
                type: type,
                release_date: entry.release_date || entry.first_air_date,
                overview: entry.overview,
                poster_path: entry.poster_path
        });
    }catch (error){
        console.log('Fehler beim laden der Details:', error.message);

        return res.status(500).json({
            error: 'Filmdetails konnten nicht geladen werden'
        });
    }
})

async function startServer() {
    try {
        db = await connectToDatabase();

        app.listen(PORT, () => {
            console.log(`FlixStash läuft auf ${PORT}`);
        });   
    } catch (error) {
        console.error('Fehler beim verbinden zu MongoDB', error);
        process.exit(1);
    }
};

app.post('/api/watchlist', verifyToken, async (req,res) => {
    const {
        movieId,
        type,
        title,
        posterPath,
        releaseDate,
        overview
    } = req.body;

    if(!movieId || !['movie', 'tv'].includes(type) || !title) {
        return res.status(400).json ({
            error: 'ungültige Daten'
        });
    }

    try {
        const watchlist = db.collection('watchlist');

        const existingEntry = await watchlist.findOne({
            userId: req.user.sub,
            movieId: Number(movieId),
            type: type
        })

        if (existingEntry) {
            return res.status(400).json({
                error: 'Dieser Titel ist bereits in deiner Watchlist!'
            });
        }

        await watchlist.insertOne({
            userId: req.user.sub,
            movieId: Number(movieId),
            type: type,
            title: title,
            posterPath: posterPath || null,
            releaseDate: releaseDate || null,
            status: 'want_to_watch',
            rating: null,
            addedAt: new Date(),
            overview: overview || null
        });

        return res.status(200).json({
            message: 'Titel erfolgreich zu Watchlist hinzugefügt'
        });
    } catch (error) {
        console.error('Watchlist Fehler:', error.message);

        return res.status(500).json({
            error: 'Titel konnte nicht hinzugefügt werden'
        });
    }
});

app.get('/api/watchlist', verifyToken, async (req, res) => {
    try {
        const watchlist = db.collection('watchlist');

        const entries = await watchlist.find({
            userId: req.user.sub
        }).toArray();

        return res.json({
            watchlist: entries
        });
    } catch (error) {
        console.log('Fehler beim laden der Watchlist:', error);

        return res.status(500).json({
            error: 'Watchlist konnte nicht geladen werden'
        });
    }
});

app.delete('/api/watchlist/:id', verifyToken, async (req, res) => {
    const entryId = req.params.id;

    if(!ObjectId.isValid(entryId)) {
        return res.status(400).json({
            error: 'Ungültige Wacthlist ID'
        });
    }

    try {
        const watchlist = db.collection('watchlist');

        const result = await watchlist.deleteOne({
            _id: new ObjectId(entryId),
            userId: req.user.sub
        });

        if (result.deletedCount === 0) {
            return res.status(400).json({
                error: 'Eintrag nicht gefunden'
            });
        }

        return res.json({
            message: 'Titel wurde aus deiner Watchlist gelöscht'
        });
    }catch(error) {
        console.log('Fehler beim Löschen:', error);

        return res.status(500).json({
            error: 'Titel konnte nicht gelöscht werden'
        });
    }
});

app.patch('/api/watchlist/:id', verifyToken, async(req, res) => {
    const entryId = req.params.id;
    const { status, rating } = req.body;

    const statusValues = [
        'want_to_watch',
        'currently_watching',
        'completed',
        'dropped'
    ];

    if (!ObjectId.isValid(entryId)) {
        return res.status(400).json({
            error: 'Ungültige ID'
        });
    }

    if (status === undefined && rating === undefined) {
        return res.status(400).json({
            error: 'Keine Änderung bei Status oder Rating'
        });
    }

    if (status !== undefined && !statusValues.includes(status)) {
        return res.status(400).json({
            error: 'ungültiger Status'
        });
    }

    if (rating !== undefined && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
        return res.status(400).json({
            error: 'Ungültige Bewertung'
        });
    }
    
    try {
        const watchlist = db.collection('watchlist');
        
        const updateData = {};
            if (status !== undefined) {
                updateData.status = status;
            }
            if (rating !== undefined){
                updateData.rating = rating;
             }

        const result = await watchlist.updateOne(
            {
                _id: new ObjectId(entryId), 
                userId: req.user.sub
            },
            {
                $set: updateData
            }
        );

        if (result.matchedCount === 0) {
            return res.status(400).json({
                error: 'Watchlist Eintrag nicht gefunden'
            });
        }

        return res.json({
            message: 'Watchlist Eintrag erfolgreich geändert'
        });

    } catch(error){
        console.log('Fehler beim Ändern vom Status:', error.message);

        return res.status(500).json({
            error: 'Status konnte nicht geändert werden'
        });
    }
});

startServer();

