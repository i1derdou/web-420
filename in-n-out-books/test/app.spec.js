/**
 * Author:    David Clemens
 * Date:      2024-09-15
 * File Name: app.spec.js
 * Description: Test
 */

const request = require('supertest'); // Import Supertest to make HTTP requests
const app = require('../src/app'); // Import the Express application from app.js in the src folder

jest.mock('../database/books', () => ({
  data: [
    { id: 1, title: 'Book One', author: 'Author One' },
    { id: 2, title: 'Book Two', author: 'Author Two' }
  ],

  // Mock the insertOne method to insert a book and return it
  insertOne: jest.fn((newBook) => {
    const newId = 3; // In your case, this would be dynamically generated
    const book = { id: newId, ...newBook };
    return book; // Return the newly created book
  }),

  // Mock the deleteOne method to delete a book and return a deletion count
  deleteOne: jest.fn(({ id }) => {
    if (id === 1 || id === 2) {
      return { deletedCount: 1 }; // Indicate that the book was deleted
    } else {
      return { deletedCount: 0 }; // Indicate that no book was deleted
    }
  })
}));


describe('API Tests for /api/books', () => {

  // Test case a: Should return a 201-status code when adding a new book
  test('Should return a 201-status code when adding a new book', async () => {
      const newBook = { title: 'New Book Title', author: 'New Author' };
      const response = await request(app).post('/api/books').send(newBook);
      expect(response.statusCode).toBe(201); // Expect status code 201 (Created)
      expect(response.body).toHaveProperty('title', 'New Book Title'); // Expect the response to contain the new book title
      expect(response.body).toHaveProperty('author', 'New Author'); // Expect the response to contain the new book author
  });

  // Test case b: Should return a 400-status code when adding a new book with missing title
  test('Should return a 400-status code when adding a new book with missing title', async () => {
      const newBook = { author: 'New Author' }; // No title provided
      const response = await request(app).post('/api/books').send(newBook);
      expect(response.statusCode).toBe(400); // Expect status code 400 (Bad Request)
      expect(response.body).toHaveProperty('message', 'Book title is required.'); // Expect the error message
  });

  // Test case c: Should return a 204-status code when deleting a book
  test('Should return a 204-status code when deleting a book', async () => {
      const response = await request(app).delete('/api/books/1'); // Assume book with ID 1 exists
      expect(response.statusCode).toBe(204); // Expect status code 204 (No Content)
  });
});