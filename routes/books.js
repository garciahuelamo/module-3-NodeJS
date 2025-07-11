const express = require('express');
const router = express.Router();
const Book = require('../models/book');
const redisClient = require('../config/redis');

const CACHE_TTL = 1800; 

router.get('/', async (req, res) => {
  try {
    const cachedBooks = await redisClient.get('books_all');
    if (cachedBooks) {
      console.log('📦 Cache hit - books_all');
      return res.json(JSON.parse(cachedBooks));
    }

    const books = await Book.findAll();
    await redisClient.setEx('books_all', CACHE_TTL, JSON.stringify(books));

    console.log('📦 Cache miss - data saved');
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching books' });
  }
});

router.post('/', async (req, res) => {
  try {
    const newBook = await Book.create(req.body);
    await redisClient.del('books_all');
    res.status(201).json(newBook);
  } catch (error) {
    res.status(500).json({ error: 'Error creating book' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [updated] = await Book.update(req.body, { where: { id } });
    if (updated) {
      await redisClient.del('books_all');
      const updatedBook = await Book.findByPk(id);
      return res.json(updatedBook);
    }
    res.status(404).json({ message: 'Book not found' });
  } catch (error) {
    res.status(500).json({ error: 'Error updating book' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await Book.destroy({ where: { id } });
    if (deleted) {
      await redisClient.del('books_all');
      return res.json({ message: 'Book deleted' });
    }
    res.status(404).json({ message: 'Book not found' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting book' });
  }
});

module.exports = router;
