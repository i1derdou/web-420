/**
 * Author:    David Clemens
 * Date:      2024-09-01
 * File Name: app.js
 * Description:
 */

const express = require('express');
const app = express();
const path = require('path');

// Import the mock database of books
const books = require('../database/books'); // Adjust the path based on your project structure

// Middleware to serve static files (like CSS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Route for the root URL ("/")
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>In-N-Out Books</title>
            <link rel="stylesheet" href="/styles.css">
        </head>
        <body>
            <header>
                <h1>Welcome to In-N-Out Books</h1>
            </header>
            <main>
                <p>Your one-stop shop for all the books you love!</p>
                <a href="/catalog">View our catalog</a>
            </main>
            <footer>
                <p>&copy; 2024 In-N-Out Books</p>
            </footer>
        </body>
        </html>
    `);
});

// GET route to fetch all books
app.get('/api/books', (req, res) => {
    try {
        const allBooks = books.find();
        res.json(allBooks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to retrieve books.' });
    }
});

// GET route to fetch a single book by id
app.get('/api/books/:id', (req, res) => {
    try {
        const id = Number(req.params.id);

        // Check if the id is a valid number
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid book ID. Please provide a valid number.' });
        }

        const book = books.findOne(id);
        if (book) {
            res.json(book);
        } else {
            res.status(404).json({ message: 'Book not found.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to retrieve the book.' });
    }
});

// Route to trigger an error for testing 500 error handling
app.get('/error', (req, res, next) => {
    next(new Error('Test error')); // Pass an error to the next middleware
});

// 404 Error Handler
app.use((req, res, next) => {
    res.status(404).send(`
        <h1>404 - Page Not Found</h1>
        <p>Sorry, the page you are looking for does not exist.</p>
    `);
});

// 500 Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);  // Log the error stack to the console
    res.status(500).json({
        message: err.message, // Include the error message in the response
        ...(req.app.get('env') === 'development' ? { stack: err.stack } : {}) // Include stack trace if in development mode
    });
});

// Export the app module
module.exports = app;