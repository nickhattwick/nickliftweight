const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const AWS = require('aws-sdk');
const path = require('path');
require('dotenv').config();
const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

// Passport configuration for Google OAuth
require('./passport-setup');

const app = express();

// Middlewares
app.use(bodyParser.json());
app.use(cors({
  origin: process.env.REACT_APP_CLIENT_URL, // allow to server to accept request from different origin
  credentials: true // allow session cookie from browser to pass through
}));

// Session setup for Express
app.use(session({
  secret: process.env.SESSION_SECRET, // Secret used to sign the session ID cookie, store in .env
  resave: true,
  saveUninitialized: true
}));

// Initialize Passport and use session
app.use(passport.initialize());
app.use(passport.session());

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  // Redirect or respond with an error if not authenticated
  console.log('User is not authenticated')
  res.status(401).send('User is not authenticated');
}

// Define Google Auth Routes
app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

app.get('/auth/google/redirect', passport.authenticate('google'), (req, res, next) => {
  // Authentication successful, handle the response
  // For now, we just redirect to a dashboard route
  req.logIn(req.user, (err) => { // Make sure to pass the user object to req.logIn
    if (err) { return next(err); }
    return res.redirect(`${process.env.REACT_APP_CLIENT_URL}/dashboard`);
  });
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
app.get('/dashboard-load', async (req, res) => {
  // Fetch the workout data from DynamoDB
  const workoutData = await getWorkoutData(req.user?.emails[0]?.value);

  // Send the data to the client
  res.json(workoutData);
});

app.post('/log-workout', async (req, res, next) => {
  console.log(req.sessionStore)
  const data = req.body;

  const exercises = data.exercises.reduce((acc, exercise) => {
      acc[exercise.name] = exercise.pairs.map(pair => ({ reps: pair.reps, weight: pair.weight }));
      return acc;
  }, {});

  const params = {
      TableName: 'UserWorkouts',
      Item: {
          UserEmail: req.user.emails[0].value,
          WorkoutDate: data.date,
          Exercises: exercises
      }
  };

  try {
      await dynamoDb.put(params).promise();
      res.json({ message: 'Workout logged successfully' });
  } catch (error) {
      console.error('Error logging workout:', error);
      res.status(500).json({ error: 'Error logging workout' });
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
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

