const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userRoutes = require('./routes/user');
const profileRoutes = require('./routes/profile');
const indexRoutes = require('./routes/index');
const postRoutes = require('./routes/post');
const cors = require('cors');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

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

app.use(express.json());
app.use(cookieParser());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://beta.socialflux.xyz',
  'https://socialflux.xyz',
  'https://netsocial.app',
  'https://beta.netsocial.app',
  'https://net-social-website.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true // Allow credentials
};

app.use(cors(corsOptions));

// Preflight requests handling
app.options('*', cors(corsOptions));

app.use('/', indexRoutes);
app.use('/api', userRoutes);
app.use('/api', postRoutes);
app.use('/api/profile', profileRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
