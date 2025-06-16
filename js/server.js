const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));

// Serve the data directory
app.use('/data', express.static(path.join(__dirname, '../data'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.csv')) {
            res.set('Content-Type', 'text/csv');
        }
    }
}));

// Handle SPA (Single Page Application) routing - return index.html for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});
//
// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Serving data from: ${path.join(__dirname, '../data')}`);
});
