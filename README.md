### FlixStash 

## Projektbeschreibung

FlixStash ist eine Webanwendung zur Verwaltung einer persönlichen Watchlist für Filme und Serien.
Nutzer können nach Filmen und Serien suchen, diese ihrer Watchlist hinzufügen und ihren persönlichen Fortschritt verwalten. Zusätzlich können Titel bewertet und detaillierte Informationen abgerufen werden.
Die Filminformationen und Poster werden über die TMDB API bereitgestellt.

## Features
- Registrierung & Login
- Authentifizierung mit JSON Web Tokens (JWT)
- Suche nach Filmen & Serien mit Live-Suchergebnissen
- Hinzufügen & Entfernen von Titeln aus der persönlichen Watchlist
- Verwaltung des Wiedergabestatus:
  - Want to Watch
  - Currently Watching
  - Completed
  - Dropped
- Persönliche Bewertungen von 1 bis 5 Sternen
- Detailseiten mit Informationen zu Filmen & Serien
- Dashboard mit persönlichen Watchlist-Statistiken
- Surprise Me: Zufällige Auswahl eines Titels aus „Want to Watch“

## Verwendete Technologien

**Frontend**
- HTML
- CSS
- JavaScript
- EJS

**Backend**
- Node.js
- Express.js

**Datenbank und Sicherheit**
- MongoDB
- JSON Web Tokens (JWT)
- bcrypt

**Externe Schnittstelle**
- The Movie Database (TMDB) API

## Voraussetzungen

Für die lokale Ausführung werden benötigt:

- Node.js
- npm
- Eine MongoDB-Datenbank
- Ein TMDB API-Zugang

## Installation und Start

1. Repository herunterladen oder klonen.

2. Im Projektverzeichnis die Abhängigkeiten installieren:
   npm install

3. Eine .env-Datei im Hauptverzeichnis erstellen.

4. Folgende Umgebungsvariablen eintragen:

   MONGODB_URI=
   TMDB_ACCESS_TOKEN=
   JWT_SECRET_KEY=
   
   Die entsprechenden Zugangsdaten müssen selbst eingetragen werden.

5. Den Server starten:
   npm start

6. Die Anwendung im Browser öffnen:
   http://localhost:3000

## Projektstruktur

FlixStash/
│
├── Flowchart/ (Ablaufdiagramme der Anwendung)
├── node_modules/ (Installierte Node.js-Abhängigkeiten)
├── public/ (CSS, JavaScript und Bilder)
├── views/ (EJS-Templates)
│   └── partials/
├── Wireframes/ (Entwürfe der Benutzeroberfläche)
│
├── .env
├── .gitignore
├── db.js
├── server.js
├── package.json
└── package-lock.json


## Datenquelle
Die Film- & Serieninformationen sowie die Poster werden über die TMDB API abgerufen.

## Sicherheit
Die Datei `.env` enthält vertrauliche Zugangsdaten & darf nicht veröffentlicht oder in ein öffentliches GitHub-Repository hochgeladen werden.