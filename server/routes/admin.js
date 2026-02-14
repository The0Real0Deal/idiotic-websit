const express = require('express');
const router = express.Router();
const { UserManager, PostManager, CommentManager } = require('../utils/dataManager');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all users (admin only)
router.get('/users', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const users = UserManager.getAllUsers();
    // Don't send passwords
    const safeUsers = users.map(u => ({ ...u, password: undefined }));
    res.json(safeUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign writer role (admin only)
router.post('/users/:userId/assign-writer', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const user = UserManager.getUserById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const updatedUser = UserManager.updateUserRole(req.params.userId, 'writer');
    
    res.json({
      message: `User ${user.username} is now a writer`,
      user: { ...updatedUser, password: undefined }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove writer role (admin only)
router.post('/users/:userId/remove-writer', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const user = UserManager.getUserById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const updatedUser = UserManager.updateUserRole(req.params.userId, 'user');
    
    res.json({
      message: `Writer role removed from ${user.username}`,
      user: { ...updatedUser, password: undefined }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all posts (admin only)
router.get('/posts', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const posts = PostManager.getAllPosts();
    
    // Enrich with author info
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

// Get all comments (admin only)
router.get('/comments', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const comments = require('../utils/dataManager').CommentManager;
    const fs = require('fs');
    const path = require('path');
    const dataDir = path.join(__dirname, '../../data');
    const commentsFile = path.join(dataDir, 'comments.json');
    const allComments = JSON.parse(fs.readFileSync(commentsFile, 'utf8'));
    
    // Enrich with post and author info
    const enrichedComments = allComments.map(comment => {
      const author = UserManager.getUserById(comment.authorId);
      const post = PostManager.getPostById(comment.postId);
      return {
        ...comment,
        author: author ? { id: author.id, username: author.username } : { username: 'Anonymous' },
        post: post ? { id: post.id, title: post.title } : { title: 'Unknown' }
      };
    });
    
    res.json(enrichedComments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get pending comments (admin only)
router.get('/comments/pending', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const dataDir = path.join(__dirname, '../../data');
    const commentsFile = path.join(dataDir, 'comments.json');
    const allComments = JSON.parse(fs.readFileSync(commentsFile, 'utf8'));
    
    const pendingComments = allComments.filter(c => !c.approved);
    
    // Enrich with post and author info
    const enrichedComments = pendingComments.map(comment => {
      const author = UserManager.getUserById(comment.authorId);
      const post = PostManager.getPostById(comment.postId);
      return {
        ...comment,
        author: author ? { id: author.id, username: author.username } : { username: 'Anonymous' },
        post: post ? { id: post.id, title: post.title } : { title: 'Unknown' }
      };
    });
    
    res.json(enrichedComments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get dashboard stats (admin only)
router.get('/stats', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const users = UserManager.getAllUsers();
    const posts = PostManager.getAllPosts();
    const fs = require('fs');
    const path = require('path');
    const dataDir = path.join(__dirname, '../../data');
    const commentsFile = path.join(dataDir, 'comments.json');
    const allComments = JSON.parse(fs.readFileSync(commentsFile, 'utf8'));
    
    res.json({
      totalUsers: users.length,
      totalWriters: users.filter(u => u.role === 'writer').length,
      totalPosts: posts.length,
      publishedPosts: posts.filter(p => p.published).length,
      totalComments: allComments.length,
      approvedComments: allComments.filter(c => c.approved).length,
      pendingComments: allComments.filter(c => !c.approved).length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
