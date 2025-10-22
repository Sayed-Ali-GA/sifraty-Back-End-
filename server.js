const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');

const userAuthRoutes = require('./controllers/userAuth');
const usersRoutes = require('./controllers/users');
const companyies = require('./controllers/companyAuth')


const app = express();
app.use(cors());
app.use(express.json());


// routes
app.use('/api/userAuth', userAuthRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/companyies', companyies)



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
