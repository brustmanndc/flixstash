const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri);

async function connectToDatabase() {
    await client.connect();

    console.log('Verbindung zu Mongo DB erfolgreich');

    return client.db('flixstash');
};

module.exports = { connectToDatabase };