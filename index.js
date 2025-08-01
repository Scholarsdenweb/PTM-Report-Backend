const express = require('express');
const app = express();
const cors = require('cors');
const PTMRoute = require('./routes/ptmRoutes.js');

app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// Must come after middleware
app.use('/api/ptm', PTMRoute);

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
