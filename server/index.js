const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Message = require('./models/Message');
const ws = require('ws');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');

dotenv.config();

const connectWithRetry = () => {
  mongoose.connect(process.env.MONGO_URL, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Failed to connect to MongoDB, retrying in 5 seconds...', err);
    setTimeout(connectWithRetry, 5000);
  });
};

connectWithRetry();




const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

const app = express();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  credentials: true,
  origin: 'https://chat-nest-one.vercel.app',
}));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

async function getUserDataFromRequest(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) reject(err);
        resolve(userData);
      });
    } else {
      reject('No token');
    }
  });
}

// Upload file route
app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ filename: req.file.filename });
});

// Get messages for a user
app.get('/messages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = await getUserDataFromRequest(req);
    const ourUserId = userData.userId;
    const messages = await Message.find({
      sender: { $in: [userId, ourUserId] },
      recipient: { $in: [userId, ourUserId] },
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a list of users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, { '_id': 1, username: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get profile of the logged-in user
app.get('/profile', (req, res) => {
  const token = req.cookies?.token;
  
  if (!token) {
    return res.status(401).json('No token');
  }
  
  jwt.verify(token, jwtSecret, (err, userData) => {
    if (err) {
      console.error('JWT Verification Error:', err);
      return res.status(401).json('Invalid token');
    }
    
    // Add the /people route
app.get('/people', async (req, res) => {
  try {
    const people = await User.find({}, { '_id': 1, username: 1 });
    res.json(people);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

    // Optional: You can add more logic here if needed, such as fetching additional user details from the database.
    
    res.json(userData);
  });
});


// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const foundUser = await User.findOne({ username });
    if (foundUser) {
      const passOk = bcrypt.compareSync(password, foundUser.password);
      if (passOk) {
        jwt.sign({ userId: foundUser._id, username }, jwtSecret, {}, (err, token) => {
          if (err) return res.status(500).json('Error signing token');
          res.cookie('token', token, { sameSite: 'none', secure: true }).json({
            id: foundUser._id,
          });
        });
      } else {
        res.status(401).json('Invalid credentials');
      }
    } else {
      res.status(401).json('User not found');
    }
  } catch (err) {
    res.status(500).json('Internal server error');
  }
});

// Logout route
app.post('/logout', (req, res) => {
  res.cookie('token', '', { sameSite: 'none', secure: true }).json('OK');
});

// Registration route
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
    const createdUser = await User.create({
      username,
      password: hashedPassword,
    });
    jwt.sign({ userId: createdUser._id, username }, jwtSecret, {}, (err, token) => {
      if (err) return res.status(500).json('Error signing token');
      res.cookie('token', token, { sameSite: 'none', secure: true }).status(201).json({
        id: createdUser._id,
      });
    });
  } catch (err) {
    res.status(500).json('Internal server error');
  }
});

// Start the server
const server = app.listen(4040, () => console.log('Server listening on port 4040'));

// WebSocket server setup
const wss = new ws.WebSocketServer({ server, maxPayload: 10 * 1024 * 1024 });
const onlineUsers = new Map();

wss.on('connection', (connection, req) => {
  connection.isAlive = true;

  // Set up a heartbeat to check if the connection is alive
  connection.timer = setInterval(() => {
    connection.ping();
    connection.deathTimer = setTimeout(() => {
      connection.isAlive = false;
      clearInterval(connection.timer);
      connection.terminate();
      onlineUsers.delete(connection.userId);  // Remove user on disconnect
      notifyAboutOnlineUsers();
    }, 1000);
  }, 5000);

  connection.on('pong', () => {
    clearTimeout(connection.deathTimer);
  });

  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenCookieString = cookies.split(';').find(str => str.trim().startsWith('token='));
    if (tokenCookieString) {
      const token = tokenCookieString.split('=')[1];
      if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
          if (err) throw err;
          const { userId, username } = userData;
          connection.userId = userId;
          connection.username = username;
          onlineUsers.set(userId, username);  // Add user on connect
          notifyAboutOnlineUsers();
        });
      }
    }
  }

  connection.on('message', async (message) => {
    try {
      const messageData = JSON.parse(message.toString());
      const { recipient, text, file } = messageData;
      let filename = null;

      // Handle file upload
      if (file) {
        const parts = file.name.split('.');
        const ext = parts[parts.length - 1];
        filename = Date.now() + '.' + ext;
        const uploadDir = path.join(__dirname, 'uploads');
        const filePath = path.join(uploadDir, filename);
        const bufferData = Buffer.from(file.data.split(',')[1], 'base64');

        // Ensure the uploads directory exists
        await fs.mkdir(uploadDir, { recursive: true });

        // Write the file to the uploads directory
        await fs.writeFile(filePath, bufferData);
      }

      // Create message document
      if (recipient && (text || file)) {
        const messageDoc = await Message.create({
          sender: connection.userId,
          recipient,
          text,
          file: file ? filename : null,
        });

        // Send message to recipient
        [...wss.clients]
          .filter(c => c.userId === recipient)
          .forEach(c => c.send(JSON.stringify({
            text,
            sender: connection.userId,
            recipient,
            file: file ? filename : null,
            _id: messageDoc._id,
          })));
      }
    } catch (err) {
      console.error('Error handling message:', err);
    }
  });

  connection.on('close', () => {
    onlineUsers.delete(connection.userId);  // Remove user on disconnect
    notifyAboutOnlineUsers();
  });

  // Notify all clients about online users
  function notifyAboutOnlineUsers() {
    const onlineUsersArray = [...onlineUsers.entries()].map(([userId, username]) => ({ userId, username }));
    [...wss.clients].forEach(client => {
      client.send(JSON.stringify({ online: onlineUsersArray }));
    });
  }

  notifyAboutOnlineUsers();
});
