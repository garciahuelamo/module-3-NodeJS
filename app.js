const express = require('express');
const app = express();

app.use(express.json());

const booksRouter = require('./routes/books');
app.use('/books', booksRouter);

app.listen(3000, () => {
  console.log('API listening on http://localhost:3000');
});
