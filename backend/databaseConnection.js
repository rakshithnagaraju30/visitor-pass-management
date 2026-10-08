const mongoose = require('mongoose');

async function DBConnection() {
    const URL = process.env.URL;

    if (!URL) {
        throw new Error('Missing MongoDB connection string in process.env.URL');
    }

    try {
        await mongoose.connect(URL);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        throw error;
    }
}

module.exports = DBConnection;