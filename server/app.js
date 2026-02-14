const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../')));

// Routes
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);

// Serve HTML files
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));
app.get('/article-view', (req, res) => res.sendFile(path.join(__dirname, '../article_view.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../login.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../admin/management.html')));
app.get('/writer', (req, res) => res.sendFile(path.join(__dirname, '../admin/writer_content_dashboard.html')));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Blog server running on http://localhost:${PORT}`);
});
