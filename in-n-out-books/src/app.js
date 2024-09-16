/**
 * Author:    David Clemens
 * Date:      2024-09-15
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
app.use(express.json()); // This allows us to parse JSON request bodies

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

// POST route to add a new book to the collection
app.post('/api/books', (req, res) => {
  try {
      const { title, author } = req.body;

      // Check if the title is missing
      if (!title) {
          return res.status(400).json({ message: 'Book title is required.' });
      }

      // Generate a new book ID (mock database uses sequential IDs)
      const newId = books.data.length ? books.data[books.data.length - 1].id + 1 : 1;

      // Create the new book object
      const newBook = { id: newId, title, author };

      // Insert the new book into the mock database
      books.insertOne(newBook);

      // Return the 201 status code and the new book object
      res.status(201).json(newBook);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to add the book.' });
  }
});

// DELETE route to remove a book by its ID
app.delete('/api/books/:id', (req, res) => {
  try {
      const id = Number(req.params.id);

      // Check if the ID is a valid number
      if (isNaN(id)) {
          return res.status(400).json({ message: 'Invalid book ID. Please provide a valid number.' });
      }

      // Attempt to delete the book from the mock database
      const result = books.deleteOne({ id });

      // If no book is found to delete, return a 404
      if (result.deletedCount === 0) {
          return res.status(404).json({ message: 'Book not found.' });
      }

      // Return 204 No Content to indicate successful deletion
      res.status(204).send();
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to delete the book.' });
  }
});

// Export the app module
module.exports = app;