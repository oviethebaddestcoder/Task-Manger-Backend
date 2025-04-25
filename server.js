require ("dotenv").config();
const express = require ("express");
const cors = require ("cors");
const path = require("path");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes")
const userRoutes = require("./routes/userRoutes")
const taskRoutes = require("./routes/taskRoutes")
const reportRoutes = require("./routes/reportRoutes")
const uploadRoutes = require("./routes/uploadRoutes")

const app = express();

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
}));

//Middleware 
app.use(express.json());

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadDirs = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads/profiles'),
    path.join(__dirname, 'uploads/tasks')
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add security headers for static files
app.use('/uploads', (req, res, next) => {
    // Allow images to be loaded from your domain
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader("Content-Type", "application/javascript");
    next();
});

// Connect to database
connectDB();

// Add this before your routes
app.use((req, res, next) => {
    console.log('Request:', {
        method: req.method,
        url: req.url,
        headers: req.headers
    });
    next();
});

// //Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/upload", uploadRoutes);

// Start
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server is up and running on http://localhost:${PORT}`))
.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is busy, trying ${PORT + 1}...`);
        app.listen(PORT + 1);
    } else {
        console.error(err);
    }
});
