require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');

// --- Configuration ---
const mongoURI = process.env.MONGO_URI 
const dbName = process.env.DB_NAME;
const port = process.env.PORT || 3001;

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

let db;

async function connectDB() {
    // Create client with enhanced options for SSL/TLS handling
    const client = new MongoClient(mongoURI, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
        // Additional connection options
        tls: true,
        tlsAllowInvalidCertificates: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 30000,
        family: 4 // Force IPv4
    });
    
    try {
        console.log('Attempting to connect to MongoDB Atlas...');
        await client.connect();
        
        // Verify connection
        await client.db("admin").command({ ping: 1 });
        console.log('✅ Connected successfully to MongoDB Atlas');
        
        db = client.db(dbName);
        
        // List collections to verify database access
        const collections = await db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
        
    } catch (err) {
        console.error('❌ Failed to connect to MongoDB Atlas:', err.message);
        console.error('Error details:', {
            name: err.name,
            code: err.code,
            codeName: err.codeName
        });
        
        // Provide helpful debugging information
        if (err.message.includes('SSL') || err.message.includes('TLS')) {
            console.log('\n🔧 Troubleshooting SSL/TLS issues:');
            console.log('1. Check IP whitelist in MongoDB Atlas Network Access');
            console.log('2. Verify Node.js version is 16+ (current:', process.version + ')');
            console.log('3. Try updating MongoDB driver: npm update mongodb');
            console.log('4. Check if your network/firewall blocks port 27017');
        }
        
        process.exit(1);
    }
}

// --- API Routes ---

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        dbConnected: !!db,
        timestamp: new Date().toISOString()
    });
});

// Route to fetch all skills
app.get('/api/skills', async (req, res) => {
    if (!db) {
        return res.status(503).json({ message: 'Database not connected' });
    }
    
    try {
        const skillsCollection = db.collection('skills');
        const skillsData = await skillsCollection.find({}).toArray();
        res.json(skillsData);
    } catch (err) {
        console.error('Error fetching skills:', err);
        res.status(500).json({ message: 'Error fetching skills', error: err.message });
    }
});

// Route to fetch all experience
app.get('/api/experience', async (req, res) => {
    if (!db) {
        return res.status(503).json({ message: 'Database not connected' });
    }
    
    try {
        const experienceCollection = db.collection('experience');
        const experienceData = await experienceCollection.find({}).toArray();
        res.json(experienceData);
    } catch (err) {
        console.error('Error fetching experience:', err);
        res.status(500).json({ message: 'Error fetching experience', error: err.message });
    }
});

// Route to fetch all projects
app.get('/api/projects', async (req, res) => {
    if (!db) {
        return res.status(503).json({ message: 'Database not connected' });
    }
    
    try {
        const projectsCollection = db.collection('projects');
        const projectsData = await projectsCollection.find({}).toArray();
        res.json(projectsData);
    } catch (err) {
        console.error('Error fetching projects:', err);
        res.status(500).json({ message: 'Error fetching projects', error: err.message });
    }
});

// Route to fetch personal data
app.get('/api/personal', async (req, res) => {
    if (!db) {
        return res.status(503).json({ message: 'Database not connected' });
    }
    
    try {
        const personalCollection = db.collection('personal');
        const personalData = await personalCollection.findOne({});
        res.json(personalData);
    } catch (err) {
        console.error('Error fetching personal data:', err);
        res.status(500).json({ message: 'Error fetching personal data', error: err.message });
    }
});

// --- Server Start ---
async function startServer() {
    console.log('Starting server...');
    console.log('Node.js version:', process.version);
    console.log('Environment:', process.env.NODE_ENV || 'development');
    
    await connectDB();
    
    app.listen(port, () => {
        console.log(`🚀 Server running on http://localhost:${port}`);
        console.log(`📡 API endpoints available:`);
        console.log(`   - GET http://localhost:${port}/api/health`);
        console.log(`   - GET http://localhost:${port}/api/skills`);
        console.log(`   - GET http://localhost:${port}/api/experience`);
        console.log(`   - GET http://localhost:${port}/api/projects`);
        console.log(`   - GET http://localhost:${port}/api/personal`);
    });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    if (db) {
        await db.client.close();
        console.log('Database connection closed.');
    }
    process.exit(0);
});

startServer();