const express = require('express');
const router = express.Router();
const { PostManager, UserManager } = require('../utils/dataManager');
const { authMiddleware, writerMiddleware } = require('../middleware/auth');

// Get all published posts
router.get('/', (req, res) => {
  try {
    const posts = PostManager.getAllPosts().filter(p => p.published);
    
    // Enrich posts with author information
    const enrichedPosts = posts.map(post => {
      const author = UserManager.getUserById(post.authorId);
      return {
        ...post,
        author: author ? { id: author.id, username: author.username } : { username: 'Unknown' }
      };
    });
    
    res.json(enrichedPosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single post by ID
router.get('/:id', (req, res) => {
  try {
    const post = PostManager.getPostById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (!post.published) {
      return res.status(403).json({ error: 'Post not published' });
    }
    
    // Increment views
    PostManager.incrementViews(post.id);
    
    const author = UserManager.getUserById(post.authorId);
    
    res.json({
      ...post,
      author: author ? { id: author.id, username: author.username, email: author.email } : { username: 'Unknown' }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new post (requires writer role)
router.post('/', authMiddleware, writerMiddleware, (req, res) => {
  try {
    const { title, content, slug, description, category } = req.body;
    
    if (!title || !content || !slug) {
      return res.status(400).json({ error: 'Title, content, and slug are required' });
    }
    
    const post = PostManager.createPost(
      req.user.id,
      title,
      content,
      slug,
      description || '',
      category || 'Uncategorized'
    );
    
    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update post (author or admin only)
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const post = PostManager.getPostById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (post.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only edit your own posts' });
    }
    
    const { title, content, description, category } = req.body;
    const updates = {};
    
    if (title) updates.title = title;
    if (content) updates.content = content;
    if (description) updates.description = description;
    if (category) updates.category = category;
    
    const updatedPost = PostManager.updatePost(post.id, updates);
    
    res.json({
      message: 'Post updated successfully',
      post: updatedPost
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Publish post (author or admin only)
router.post('/:id/publish', authMiddleware, (req, res) => {
  try {
    const post = PostManager.getPostById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (post.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only publish your own posts' });
    }
    
    const publishedPost = PostManager.publishPost(post.id);
    
    res.json({
      message: 'Post published successfully',
      post: publishedPost
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete post (author or admin only)
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const post = PostManager.getPostById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (post.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }
    
    PostManager.deletePost(post.id);
    
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's posts
router.get('/user/:userId', (req, res) => {
  try {
    const posts = PostManager.getPostsByAuthor(req.params.userId).filter(p => p.published);
    
    const author = UserManager.getUserById(req.params.userId);
    
    const enrichedPosts = posts.map(post => ({
      ...post,
      author: author ? { id: author.id, username: author.username } : { username: 'Unknown' }
    }));
    
    res.json(enrichedPosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
