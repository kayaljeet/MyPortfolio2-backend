require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');

// --- Configuration ---
const mongoURI = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

let db;
let client;

// --- Database Connection ---
async function connectDB() {
  if (db) return db; // reuse existing connection

  client = new MongoClient(mongoURI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    tls: true,
    tlsAllowInvalidCertificates: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 30000,
    family: 4, // Force IPv4
  });

  try {
    console.log('Attempting to connect to MongoDB Atlas...');
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log('✅ Connected successfully to MongoDB Atlas');

    db = client.db(dbName);
    return db;
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB Atlas:', err.message);
    throw err;
  }
}

// --- API Routes ---

app.get('/api/health', async (req, res) => {
  res.json({
    status: 'ok',
    dbConnected: !!db,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/skills', async (req, res) => {
  try {
    const database = await connectDB();
    const skillsCollection = database.collection('skills');
    const skillsData = await skillsCollection.find({}).toArray();
    res.json(skillsData);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching skills', error: err.message });
  }
});

app.get('/api/experience', async (req, res) => {
  try {
    const database = await connectDB();
    const experienceCollection = database.collection('experience');
    const experienceData = await experienceCollection.find({}).toArray();
    res.json(experienceData);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching experience', error: err.message });
  }
});

app.get('/api/projects', async (req, res) => {
  try {
    const database = await connectDB();
    const projectsCollection = database.collection('projects');
    const projectsData = await projectsCollection.find({}).toArray();
    res.json(projectsData);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching projects', error: err.message });
  }
});

app.get('/api/personal', async (req, res) => {
  try {
    const database = await connectDB();
    const personalCollection = database.collection('personal');
    const personalData = await personalCollection.findOne({});
    res.json(personalData);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching personal data', error: err.message });
  }
});

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const database = await connectDB();
    const messagesCollection = database.collection('messages');

    const newMessage = {
      name,
      email,
      message,
      createdAt: new Date()
    };

    await messagesCollection.insertOne(newMessage);

    res.status(201).json({ message: 'Message sent successfully' });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ message: 'Error sending message', error: err.message });
  }
});

// --- Export Express App (for Vercel) ---
module.exports = app;

// --- Start Server (for Local Development) ---
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    try {
      await connectDB();
    } catch (err) {
      console.error('Failed to connect to DB on startup:', err);
    }
  });
}
