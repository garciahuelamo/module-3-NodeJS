const Book = require('../models/book');
const redis = require('../config/redis');

const TTL = 60 * 30; 

exports.getAllBooks = async (req, res) => {
  const cacheKey = 'books:all';

  const cached = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));

  const books = await Book.findAll();
  await redis.setEx(cacheKey, TTL, JSON.stringify(books));
  res.json(books);
};

exports.getBookById = async (req, res) => {
  const { id } = req.params;
  const cacheKey = `books:${id}`;

  const cached = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));

  const book = await Book.findByPk(id);
  if (!book) return res.status(404).json({ error: 'Book not found' });

  await redis.setEx(cacheKey, TTL, JSON.stringify(book));
  res.json(book);
};

exports.createBook = async (req, res) => {
  const book = await Book.create(req.body);
  await redis.del('books:all'); 
  res.status(201).json(book);
};

exports.updateBook = async (req, res) => {
  const { id } = req.params;
  const book = await Book.findByPk(id);
  if (!book) return res.status(404).json({ error: 'Not found' });

  await book.update(req.body);
  await redis.del('books:all');
  await redis.del(`books:${id}`);
  res.json(book);
};

exports.deleteBook = async (req, res) => {
  const { id } = req.params;
  const book = await Book.findByPk(id);
  if (!book) return res.status(404).json({ error: 'Not found' });

  await book.destroy();
  await redis.del('books:all');
  await redis.del(`books:${id}`);
  res.status(204).send();
};
