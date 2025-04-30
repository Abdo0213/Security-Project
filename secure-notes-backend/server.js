// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
const cors = require('cors');
const { authenticateJWT, checkRoles } = require('./middleware/Auth');

const app = express();
app.use(express.json());
app.use(cors());




// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('Connection error:', err));
// User Schema
const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    unique: true,
    required: [true, 'Username is required'],
    trim: true,
    minlength: [3, 'Username must be at least 3 characters']
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  refreshToken: String,
  roles: { 
    type: [String], 
    default: ['user'],
    enum: {
      values: ['user', 'editor', 'admin'],
      message: 'Invalid role specified'
    },
    validate: {
      validator: function(roles) {
        return roles.length > 0;
      },
      message: 'User must have at least one role'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}); 

// Note Schema with encrypted content
const NoteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  encryptedContent: String,
  iv: String // Initialization vector for AES encryption
});

const User = mongoose.model('User', UserSchema);
const Note = mongoose.model('Note', NoteSchema);

// JWT and encryption secrets
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Routes
// In your backend (server.js)
app.post('/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      username: req.body.username,
      password: hashedPassword,
      roles: req.body.roles || ['user'] // Use submitted roles or default to 'user'
    });
    await user.save();
    res.status(201).send('User created');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post('/login', async (req, res) => {
  const exp = Math.floor(Date.now() / 1000) + 60;
  console.log("Access token issued at:", new Date().toISOString());
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) return res.status(400).json({ error: 'Invalid password' });

    // Create tokens
    const accessToken = jwt.sign(
      { userId: user._id, roles: user.roles, exp },
      process.env.ACCESS_TOKEN_SECRET,
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      accessToken,
      refreshToken,
      userId: user._id,
      username: user.username,
      roles: user.roles
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/token', async (req, res) => {
  const refreshToken = req.body.token;
  if (!refreshToken) return res.sendStatus(401);

  const user = await User.findOne({ refreshToken });
  if (!user) return res.sendStatus(403);

  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, userData) => {
    if (err) return res.sendStatus(403);
    const accessToken = jwt.sign({ userId: userData.userId }, ACCESS_TOKEN_SECRET, { expiresIn: '1m' });
    res.json({ accessToken });
  });
});


app.post('/notes', authenticateJWT, async (req, res) => {
  try {
    const note = new Note({
      userId: req.user.userId,
      encryptedContent: req.body.encrypted,
      iv: req.body.iv.toString()
    });
    await note.save();
    res.status(201).send('Note created');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// app.put('/notes/:id', authenticateJWT, async (req, res) => {
  app.put('/notes/:id', authenticateJWT, async (req, res) => {
    try {
      // Find the note by ID and update it
      const note = await Note.findById(req.params.id);
      if (!note) return res.status(404).send('Note not found');
  
      // Ensure the user is the owner of the note
      if (note.userId.toString() !== req.user.userId) {
        return res.status(403).send('You are not authorized to edit this note');
      }
  
      // Update the note content
      note.encryptedContent = req.body.encrypted;
      note.iv = req.body.iv.toString();
  
      await note.save();
      res.status(200).send('Note updated');
    } catch (error) {
      res.status(500).send(error.message);
    }
  });
app.get('/notes/:id', authenticateJWT, async (req, res) => {
    try {
      const noteId = req.params.id; // Get the note ID from the request parameters
      const note = await Note.findById(noteId); // Use the ID to find the note in the database
      
      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }
  
      // Return the note content (you may choose to return only some fields)
      res.json(note);
    } catch (error) {
      console.error('Error fetching note:', error);
      res.status(500).json({ error: 'Failed to fetch the note' });
    }
});
app.get('/notes', authenticateJWT, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.userId });
    // Decrypt the notes before sending to client
    const decryptedNotes = notes.map(note => {
      const iv = note.iv;
      const decrypted = CryptoJS.AES.decrypt(note.encryptedContent, ENCRYPTION_KEY, { iv });
      return {
        id: note._id,
        content: decrypted.toString(CryptoJS.enc.Utf8)
      };
    });
    res.json(decryptedNotes);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
app.delete('/notes/:id', authenticateJWT, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });
    if (!note) return res.status(404).send('Note not found');
    res.send('Note deleted');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));