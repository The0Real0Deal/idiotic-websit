const express = require('express');
const router = express.Router();
const { CommentManager, UserManager } = require('../utils/dataManager');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get comments for a post
router.get('/post/:postId', (req, res) => {
  try {
    const comments = CommentManager.getCommentsByPost(req.params.postId);
    
    // Only return approved comments for non-admin users
    let filteredComments = comments;
    if (!req.user || req.user.role !== 'admin') {
      filteredComments = comments.filter(c => c.approved);
    }
    
    // Enrich comments with author information
    const enrichedComments = filteredComments.map(comment => {
      const author = UserManager.getUserById(comment.authorId);
      return {
        ...comment,
        author: author ? { id: author.id, username: author.username } : { username: 'Anonymous' }
      };
    });
    
    res.json(enrichedComments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new comment (requires authentication)
router.post('/', authMiddleware, (req, res) => {
  try {
    const { postId, content } = req.body;
    
    if (!postId || !content) {
      return res.status(400).json({ error: 'Post ID and content are required' });
    }
    
    if (content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment cannot be empty' });
    }
    
    if (content.length > 5000) {
      return res.status(400).json({ error: 'Comment is too long (max 5000 characters)' });
    }
    
    const comment = CommentManager.createComment(postId, req.user.id, content);
    
    res.status(201).json({
      message: 'Comment created successfully (pending approval)',
      comment: {
        ...comment,
        author: { id: req.user.id, username: req.user.username }
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve comment (admin only)
router.post('/:id/approve', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const comment = CommentManager.approveComment(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    res.json({
      message: 'Comment approved',
      comment
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete comment (author or admin only)
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const comments = require('../utils/dataManager').CommentManager.getCommentsByPost('all');
    // We need to find the comment first - let me fix this
    const fs = require('fs');
    const path = require('path');
    const dataDir = path.join(__dirname, '../../data');
    const commentsFile = path.join(dataDir, 'comments.json');
    const allComments = JSON.parse(fs.readFileSync(commentsFile, 'utf8'));
    const comment = allComments.find(c => c.id === req.params.id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (comment.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }
    
    CommentManager.deleteComment(req.params.id);
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
