const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userRoutes = require('./routes/user');
const profileRoutes = require('./routes/profile');
const indexRoutes = require('./routes/index');
const postRoutes = require('./routes/post');
const cors = require('cors'); // Import the cors package
const cookieParser = require('cookie-parser');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('Failed to connect to MongoDB:', error);
});

// Middleware to parse request body as JSON
app.use(express.json());

// Enable CORS with specific origin (replace http://localhost:3000 with your frontend's base URL)
const corsOptions = {
  origin: ['http://localhost:3000', 'https://beta.socialflux.xyz', 'https://socialflux.xyz', 'https://netsocial.app','https://beta.netsocial.app', 'http://localhost:8888'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());

// Use the routes
app.use('/', indexRoutes); // Use the indexRoutes router for '/api' requests
app.use('/api', userRoutes); // Use the userRoutes router for '/api' requests
app.use('/api', postRoutes); // Use the postRoutes router for '/api' requests
app.use('/api/profile', profileRoutes); // Use the userRoutes router for '/api' requests

// Handle 404 - Not Found
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

// Handle errors
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

