const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Data file paths
const dataDir = path.join(__dirname, '../../data');
const usersFile = path.join(dataDir, 'users.json');
const postsFile = path.join(dataDir, 'posts.json');
const commentsFile = path.join(dataDir, 'comments.json');

// Helper function to read JSON files
const readJsonFile = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return [];
  }
};

// Helper function to write JSON files
const writeJsonFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
};

// User Management
const UserManager = {
  getAllUsers: () => readJsonFile(usersFile),
  
  getUserById: (id) => {
    const users = readJsonFile(usersFile);
    return users.find(u => u.id === id);
  },
  
  getUserByUsername: (username) => {
    const users = readJsonFile(usersFile);
    return users.find(u => u.username.toLowerCase() === username.toLowerCase());
  },
  
  createUser: (username, email, password) => {
    const users = readJsonFile(usersFile);
    
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error('Username already exists');
    }
    
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email already exists');
    }
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    writeJsonFile(usersFile, users);
    return { ...newUser, password: undefined };
  },
  
  verifyPassword: (plainPassword, hashedPassword) => {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  },
  
  updateUserRole: (userId, role) => {
    const users = readJsonFile(usersFile);
    const user = users.find(u => u.id === userId);
    if (user) {
      user.role = role;
      writeJsonFile(usersFile, users);
      return user;
    }
    return null;
  },
  
  updatePassword: (userId, newPassword) => {
    const users = readJsonFile(usersFile);
    const user = users.find(u => u.id === userId);
    if (user) {
      user.password = bcrypt.hashSync(newPassword, 10);
      writeJsonFile(usersFile, users);
      return true;
    }
    return false;
  }
};

// Post Management
const PostManager = {
  getAllPosts: () => {
    const posts = readJsonFile(postsFile);
    return posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  
  getPostById: (id) => {
    const posts = readJsonFile(postsFile);
    return posts.find(p => p.id === id);
  },
  
  getPostsByAuthor: (authorId) => {
    const posts = readJsonFile(postsFile);
    return posts.filter(p => p.authorId === authorId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  
  createPost: (authorId, title, content, slug, description, category = 'Uncategorized') => {
    const posts = readJsonFile(postsFile);
    
    if (posts.find(p => p.slug === slug)) {
      throw new Error('Slug already exists');
    }
    
    const newPost = {
      id: uuidv4(),
      authorId,
      title,
      content,
      slug,
      description,
      category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      published: false,
      views: 0
    };
    
    posts.push(newPost);
    writeJsonFile(postsFile, posts);
    return newPost;
  },
  
  updatePost: (postId, updates) => {
    const posts = readJsonFile(postsFile);
    const post = posts.find(p => p.id === postId);
    if (post) {
      Object.assign(post, updates, { updatedAt: new Date().toISOString() });
      writeJsonFile(postsFile, posts);
      return post;
    }
    return null;
  },
  
  publishPost: (postId) => {
    return PostManager.updatePost(postId, { published: true });
  },
  
  deletePost: (postId) => {
    let posts = readJsonFile(postsFile);
    posts = posts.filter(p => p.id !== postId);
    writeJsonFile(postsFile, posts);
    return true;
  },
  
  incrementViews: (postId) => {
    const posts = readJsonFile(postsFile);
    const post = posts.find(p => p.id === postId);
    if (post) {
      post.views = (post.views || 0) + 1;
      writeJsonFile(postsFile, posts);
      return post;
    }
    return null;
  }
};

// Comment Management
const CommentManager = {
  getCommentsByPost: (postId) => {
    const comments = readJsonFile(commentsFile);
    return comments.filter(c => c.postId === postId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },
  
  createComment: (postId, authorId, content) => {
    const comments = readJsonFile(commentsFile);
    
    const newComment = {
      id: uuidv4(),
      postId,
      authorId,
      content,
      createdAt: new Date().toISOString(),
      approved: false
    };
    
    comments.push(newComment);
    writeJsonFile(commentsFile, comments);
    return newComment;
  },
  
  approveComment: (commentId) => {
    const comments = readJsonFile(commentsFile);
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      comment.approved = true;
      writeJsonFile(commentsFile, comments);
      return comment;
    }
    return null;
  },
  
  deleteComment: (commentId) => {
    let comments = readJsonFile(commentsFile);
    comments = comments.filter(c => c.id !== commentId);
    writeJsonFile(commentsFile, comments);
    return true;
  }
};

// JWT Token Management
const TokenManager = {
  generateToken: (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
  },
  
  verifyToken: (token) => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return null;
    }
  },
  
  getUserFromToken: (token) => {
    const decoded = TokenManager.verifyToken(token);
    if (decoded) {
      return UserManager.getUserById(decoded.userId);
    }
    return null;
  }
};

module.exports = {
  UserManager,
  PostManager,
  CommentManager,
  TokenManager,
  JWT_SECRET
};
