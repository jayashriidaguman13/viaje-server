/*****************
MAIN JS (index.js)
******************/
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require('jsonwebtoken');

require('dotenv').config();

const userRoutes = require("./routes/user");
const flightRoutes = require("./routes/flight");
const bookingRoutes = require("./routes/booking");

const app = express();
app.use(express.json());

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

mongoose.connect(process.env.MONGODB_STRING, { 
  useNewUrlParser: true,
  useUnifiedTopology: true 
});

mongoose.connection.once('open', () => {
  console.log('Now connected to MongoDB Atlas');
});

app.use("/user", userRoutes);
app.use("/flights", flightRoutes);
app.use("/booking", bookingRoutes);

function generateToken(user) {
  const token = jwt.sign(
    { userId: user._id, username: user.username },
    process.env.JWT_SECRET_KEY,
    { expiresIn: '1h' }
  );
  return token;
}

function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).send('Access Denied');
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).send('Invalid Token');
    }
    req.user = user;
    next();
  });
}

app.get('/protected', authenticateToken, (req, res) => {
  res.send('This is a protected route, and you are authenticated!');
});

app.listen(process.env.PORT || 4000, () => {
  console.log(`API is now online on port ${process.env.PORT || 4000}`);
});

module.exports = { app, mongoose };