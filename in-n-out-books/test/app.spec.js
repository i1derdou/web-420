/**
 * Author:    David Clemens
 * Date:      2024-09-01
 * File Name: app.spec.js
 * Description: Test
 */

const request = require('supertest'); // Import Supertest to make HTTP requests
const app = require('../src/app'); // Import the Express application from app.js in the src folder

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