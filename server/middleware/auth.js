const { TokenManager, UserManager } = require('../utils/dataManager');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const user = TokenManager.getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  req.user = user;
  next();
};

const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const writerMiddleware = (req, res, next) => {
  if (!req.user || (req.user.role !== 'writer' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Writer access required' });
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  writerMiddleware
};
