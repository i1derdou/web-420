/**
 * Author:    David Clemens
 * Date:      2024-09-01
 * File Name: app.spec.js
 * Description: Test
 */

const request = require('supertest'); // Import Supertest to make HTTP requests
const app = require('../src/app'); // Import the Express application from app.js in the src folder

// Mock the books database
jest.mock('../database/books', () => ({
    find: jest.fn(() => [
        { id: 1, title: 'Book One', author: 'Author One' },
        { id: 2, title: 'Book Two', author: 'Author Two' }
    ]),
    findOne: jest.fn((id) => ({ id, title: `Book ${id}`, author: `Author ${id}` }))
}));

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