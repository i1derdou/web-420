/**
 * Author:    David Clemens
 * Date:      2024-10-06
 * File Name: app.js
 * Description:
 */

const express = require('express');
const app = express();
const path = require('path');
const bcrypt = require('bcryptjs');
const users = require('../database/users');

// Import the mock database of books
const books = require('../database/books');

const Ajv = require("ajv");
const ajv = new Ajv();

// JSON schema for the security question answers
const securityQuestionSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      answer: { type: "string" },
    },
    required: ["answer"],
    additionalProperties: false,
  },
};

// Middleware to parse JSON
app.use(express.json());

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

// POST route to add a new book
app.post('/api/books', async (req, res) => {
    try {
        const { title, author } = req.body;

        // Check if the title is missing
        if (!title) {
            return res.status(400).json({ message: 'Book title is required.' });
        }

        // Get all books and calculate the new ID based on the current length
        const allBooks = books.find();  // Assuming books.find() returns an array
        const newId = allBooks.length + 1;  // Calculate the new ID

        const newBook = {
            id: newId,
            title,
            author
        };

        // Add the book to the collection
        await books.insertOne(newBook);
        return res.status(201).json(newBook);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to add the book.' });
    }
  });

  // DELETE route to delete a book by ID
  app.delete('/api/books/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);

        // Validate if the ID is a number
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid book ID.' });
        }

        // Attempt to delete the book
        await books.deleteOne({ id });
        return res.status(204).send(); // No content
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete the book.' });
    }
  });

  // PUT route to update a book by ID
  app.put('/api/books/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);

        // Check if the id is a valid number
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid book ID. Please provide a valid number.' });
        }

        const { title, author } = req.body;

        // Check if the title is missing
        if (!title) {
            return res.status(400).json({ message: 'Book title is required.' });
        }

        // Mock update logic in the database
        const updatedBook = { id, title, author };

        // Assume the mock database returns success after updating the book
        await books.updateOne({ id }, updatedBook);
        return res.status(204).send(); // No content on success
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update the book.' });
    }
  });

// POST route for user login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if both email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find the user by email
    const user = await users.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Compare the provided password with the stored hashed password
    const isValidPassword = bcrypt.compareSync(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // If authentication is successful
    return res.status(200).json({ message: 'Authentication successful' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred during login' });
  }
});

// POST route to verify the user's security questions
app.post('/api/users/:email/verify-security-question', async (req, res) => {
  try {
    const { email } = req.params;
    const { answers } = req.body;

    // Validate the request body using ajv
    const validate = ajv.compile(securityQuestionSchema);
    const valid = validate(answers);

    if (!valid) {
      return res.status(400).json({ message: 'Bad Request: Invalid request body' });
    }

    // Find the user by email
    const user = await users.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Compare each answer with the stored security question answers
    const isCorrect = answers.every((ans, index) => ans.answer === user.securityQuestions[index].answer);

    if (isCorrect) {
      return res.status(200).json({ message: 'Security questions successfully answered' });
    } else {
      return res.status(401).json({ message: 'Unauthorized' });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred' });
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

app.use((req, res, next) => {
  console.log(`Request URL: ${req.url}`);
  next();
});


// Export the app module
module.exports = app;