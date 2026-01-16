const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');

const userAuthRoutes = require('./controllers/users/userAuth');
const usersRoutes = require('./controllers/users/users');
const companyies = require('./controllers/companies/companyAuth');
const flightsRouter = require('./controllers/companies/ticket')

const app = express();
app.use(cors());
app.use(express.json());


app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(`${req.method} ${req.originalUrl} → ${res.statusCode}`);
  });
  next();
});

// routes
app.use('/api/auth', userAuthRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/companyies', companyies);
app.use('/api/flights', flightsRouter);
// app.use('/api/auth/companyies', companyAuth);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
