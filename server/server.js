const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const AWS = require('aws-sdk');
require('dotenv').config();

// Passport configuration for Google OAuth
require('./passport-setup');

const app = express();

// Middlewares
app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:3001', // allow to server to accept request from different origin
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true // allow session cookie from browser to pass through
}));

// Session setup for Express
app.use(session({
  secret: process.env.SESSION_SECRET, // Secret used to sign the session ID cookie, store in .env
  resave: false,
  saveUninitialized: true
}));

// Initialize Passport and use session
app.use(passport.initialize());
app.use(passport.session());

// Define Google Auth Routes
app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

app.get('/auth/google/redirect', passport.authenticate('google'), (req, res) => {
    // Authentication successful, handle the response
    // For now, we just redirect to a dashboard route
    res.redirect('http://localhost:3001/dashboard');
});

app.get('/api/workouts', async (req, res) => {
  // Check if the user is authenticated
  if (!req.user) {
      return res.status(401).send('Not authenticated');
  }

  // Fetch the workout data from DynamoDB
  const workoutData = await getWorkoutData(req.user.email);

  // Send the data to the client
  res.json(workoutData);
});

// Test route for the server
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Dashboard route (for testing purposes)
app.get('/dashboard', async (req, res) => {
  // Check if the user is authenticated
  if (!req.user) {
      return res.status(401).send('Not authenticated');
  }

  // Fetch the workout data from DynamoDB
  const workoutData = await getWorkoutData(req.user.emails[0].value);

  // Send the data to the client
  res.json(workoutData);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

require('dotenv').config();

// Passport configuration for Google OAuth
require('./passport-setup');

// Configure AWS SDK
AWS.config.update({
  region: "us-east-1", // Update this with your region
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const docClient = new AWS.DynamoDB.DocumentClient();

const getWorkoutData = async (email) => {
  const params = {
    TableName: "UserWorkouts",
    KeyConditionExpression: "UserEmail = :email",
    ExpressionAttributeValues: {
      ":email": email
    }
  };

  try {
    const data = await docClient.query(params).promise();
    return data.Items;
  } catch (err) {
    console.log(email)
    console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
  }
};
