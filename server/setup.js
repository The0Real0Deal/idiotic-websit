const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Generate bcrypt hash for "1234"
const password = '1234';
const saltRounds = 10;
const hashedPassword = bcrypt.hashSync(password, saltRounds);

console.log('Generated bcrypt hash for password "1234":');
console.log(hashedPassword);

// Update users.json with correct hash
const usersFile = path.join(__dirname, '../data/users.json');
const users = [
  {
    id: 'admin-001',
    username: 'ADMIN',
    password: hashedPassword,
    email: 'admin@blog.local',
    role: 'admin',
    createdAt: new Date().toISOString()
  }
];

fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
console.log('\nAdmin user created in data/users.json');
