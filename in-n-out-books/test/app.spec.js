/**
 * Author:    David Clemens
 * Date:      2024-09-29
 * File Name: app.spec.js
 * Description: Test
 */

const request = require('supertest'); // Import Supertest to make HTTP requests
const app = require('../src/app'); // Import the Express application from app.js in the src folder
const users = require('../database/users'); // Mock users

// Mock the books database
jest.mock('../database/books', () => ({
  find: jest.fn(() => [
      { id: 1, title: 'Book One', author: 'Author One' },
      { id: 2, title: 'Book Two', author: 'Author Two' }
  ]),
  findOne: jest.fn(id => ({ id, title: `Book ${id}`, author: `Author ${id}` })),
  insertOne: jest.fn(book => Promise.resolve({ result: { ok: 1, n: 1 }, ops: [book] })),
  deleteOne: jest.fn(() => Promise.resolve({ result: { ok: 1, n: 1 }, deletedCount: 1 })),
  updateOne: jest.fn((filter, update) => Promise.resolve({ matchedCount: 1 }))
}));

// Only mock compareSync function from bcryptjs, not hashSync
jest.mock('bcryptjs', () => {
  const actualBcrypt = jest.requireActual('bcryptjs'); // Use actual bcryptjs
  return {
    ...actualBcrypt,
    compareSync: jest.fn(), // Only mock compareSync
  };
});


describe('Chapter 4: API Tests', () => {

// Test case: Should return a 201-status code when adding a new book
test('Should return a 201-status code when adding a new book', async () => {
    const newBook = { id: 3, title: 'New Book', author: 'Author Test' }; // New book object with id, title, and author

    const response = await request(app)
      .post('/api/books') // Simulate POST request
      .send(newBook); // Send new book object

    expect(response.statusCode).toBe(201); // Expect 201 Created
    expect(response.body).toHaveProperty('id'); // Check if response contains an id
    expect(response.body).toHaveProperty('title', 'New Book'); // Check if response contains correct title
    expect(response.body).toHaveProperty('author', 'Author Test'); // Check if response contains correct author
});

// Test case: Should return a 400-status code when adding a new book with missing title
test('Should return a 400-status code when adding a new book with missing title', async () => {
    const newBook = { author: 'Author Test' }; // No title

    const response = await request(app)
      .post('/api/books') // Simulate POST request
      .send(newBook); // Send book object with missing title

    expect(response.statusCode).toBe(400); // Expect 400 Bad Request
    expect(response.body).toHaveProperty('message', 'Book title is required.'); // Expect correct error message
});

// Test case: Should return a 204-status code when deleting a book
test('Should return a 204-status code when deleting a book', async () => {
    const response = await request(app)
      .delete('/api/books/1'); // Simulate DELETE request for book with id 1

    expect(response.statusCode).toBe(204); // Expect 204 No Content
});

});

describe('Chapter 3: API Tests', () => {

    // Test case a: Should return an array of books
    test('Should return an array of books', async () => {
        const response = await request(app).get('/api/books'); // Make a GET request to /api/books
        expect(response.statusCode).toBe(200); // Expect status code 200 (OK)
        expect(Array.isArray(response.body)).toBe(true); // Expect the response to be an array
        expect(response.body.length).toBeGreaterThan(0); // Expect the array to contain books
        expect(response.body[0]).toHaveProperty('id'); // Expect the books to have an id
        expect(response.body[0]).toHaveProperty('title'); // Expect the books to have a title
    });

    // Test case b: Should return a single book
    test('Should return a single book', async () => {
        const response = await request(app).get('/api/books/1'); // Make a GET request to /api/books/:id
        expect(response.statusCode).toBe(200); // Expect status code 200 (OK)
        expect(response.body).toHaveProperty('id', 1); // Expect the response to have the correct id
        expect(response.body).toHaveProperty('title', 'Book 1'); // Expect the response to have the correct title
    });

    // Test case c: Should return a 400 error if the id is not a number
    test('Should return a 400 error if the id is not a number', async () => {
        const response = await request(app).get('/api/books/abc'); // Make a GET request with a non-numeric id
        expect(response.statusCode).toBe(400); // Expect status code 400 (Bad Request)
        expect(response.body).toHaveProperty('message', 'Invalid book ID. Please provide a valid number.'); // Expect a proper error message
    });
});

// Other tests
describe('Test the root path', () => {
    test('It should respond with the landing page', async () => {
        const response = await request(app).get('/'); // Make a GET request to the root path
        expect(response.statusCode).toBe(200); // Expect the status code to be 200 (OK)
        expect(response.text).toContain('<h1>Welcome to In-N-Out Books</h1>'); // Check if the response contains the correct HTML content
    });
});

describe('Test the 404 path', () => {
    test('It should respond with a 404 status and error message', async () => {
        const response = await request(app).get('/non-existent-path'); // Make a GET request to a non-existent path
        expect(response.statusCode).toBe(404); // Expect the status code to be 404 (Not Found)
        expect(response.text).toContain('404 - Page Not Found'); // Check if the response contains the correct error message
    });
});

describe('Test the 500 error handler', () => {
    // Middleware to force an error for testing the 500 handler
    beforeAll(() => {
        app.get('/error', (req, res, next) => {
            next(new Error('Test error'));
        });
    });

    test('It should respond with a 500 status and error message in JSON format', async () => {
        const response = await request(app).get('/error'); // Make a GET request to trigger an error
        expect(response.statusCode).toBe(500); // Expect the status code to be 500 (Internal Server Error)
        expect(response.body).toHaveProperty('message', 'Test error'); // Check if the response contains the error message in the JSON response

        if (app.get('env') === 'development') {
            expect(response.body).toHaveProperty('stack'); // Check if the error stack is included in development mode
        }
    });
});

describe('Chapter 5: API Tests', () => {

  // Test case a: Should update a book and return a 204-status code
  test('Should update a book and return a 204-status code', async () => {
      const updatedBook = { title: 'Updated Book', author: 'Updated Author' };

      const response = await request(app)
          .put('/api/books/1') // PUT request to update book with id 1
          .send(updatedBook); // Send updated book data

      expect(response.statusCode).toBe(204); // Expect 204 No Content
  });

  // Test case b: Should return a 400-status code when using a non-numeric id
  test('Should return a 400-status code when using a non-numeric id', async () => {
      const updatedBook = { title: 'Updated Book', author: 'Updated Author' };

      const response = await request(app)
          .put('/api/books/abc') // Invalid non-numeric ID
          .send(updatedBook); // Send updated book data

      expect(response.statusCode).toBe(400); // Expect 400 Bad Request
      expect(response.body).toHaveProperty('message', 'Invalid book ID. Please provide a valid number.'); // Error message
  });

  // Test case c: Should return a 400-status code when updating a book with a missing title
  test('Should return a 400-status code when updating a book with a missing title', async () => {
      const updatedBook = { author: 'Updated Author' }; // No title

      const response = await request(app)
          .put('/api/books/1') // PUT request to update book with id 1
          .send(updatedBook); // Send book data with missing title

      expect(response.statusCode).toBe(400); // Expect 400 Bad Request
      expect(response.body).toHaveProperty('message', 'Book title is required.'); // Error message for missing title
  });
});

describe('Chapter 6: API Tests', () => {
  // Test case a: Should log a user in and return a 200-status with 'Authentication successful' message.
  test('Should log a user in and return a 200-status with Authentication successful message', async () => {
    // Mock user data
    const userEmail = 'harry@hogwarts.edu';
    const userPassword = 'potter';

    // Mock the bcrypt password comparison to return true (successful login)
    require('bcryptjs').compareSync.mockReturnValue(true);

    // Mock users.findOne to return a user
    users.findOne = jest.fn().mockResolvedValue({
      id: 1,
      email: userEmail,
      password: userPassword,
    });

    const response = await request(app)
      .post('/api/login')
      .send({ email: userEmail, password: userPassword });

    expect(response.statusCode).toBe(200); // Expect 200 OK
    expect(response.body).toHaveProperty('message', 'Authentication successful'); // Expect success message
  });

  // Test case b: Should return a 401-status with 'Unauthorized' message when logging in with incorrect credentials.
  test('Should return a 401-status with Unauthorized message when logging in with incorrect credentials', async () => {
    const userEmail = 'harry@hogwarts.edu';
    const userPassword = 'wrongpassword';

    // Mock the bcrypt password comparison to return false (incorrect login)
    require('bcryptjs').compareSync.mockReturnValue(false);

    // Mock users.findOne to return a user
    users.findOne = jest.fn().mockResolvedValue({
      id: 1,
      email: userEmail,
      password: 'potter',
    });

    const response = await request(app)
      .post('/api/login')
      .send({ email: userEmail, password: userPassword });

    expect(response.statusCode).toBe(401); // Expect 401 Unauthorized
    expect(response.body).toHaveProperty('message', 'Unauthorized'); // Expect Unauthorized message
  });

  // Test case c: Should return a 400-status with 'Bad Request' when missing email or password.
  test('Should return a 400-status with Bad Request when missing email or password', async () => {
    // Test missing email
    const responseMissingEmail = await request(app)
      .post('/api/login')
      .send({ password: 'potter' }); // No email provided

    expect(responseMissingEmail.statusCode).toBe(400); // Expect 400 Bad Request
    expect(responseMissingEmail.body).toHaveProperty('message', 'Email and password are required.'); // Expect correct error message

    // Test missing password
    const responseMissingPassword = await request(app)
      .post('/api/login')
      .send({ email: 'harry@hogwarts.edu' }); // No password provided

    expect(responseMissingPassword.statusCode).toBe(400); // Expect 400 Bad Request
    expect(responseMissingPassword.body).toHaveProperty('message', 'Email and password are required.'); // Expect correct error message
  });
});