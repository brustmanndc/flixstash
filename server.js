const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();

const express = require('express');
const { connectToDatabase } = require ('./db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

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

startServer();

