const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const cors = require("cors");
const PTMRoute = require("./routes/ptmRoutes.js");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const batchRoutes = require("./routes/batchRoutes");
const studentRoutes = require("./routes/student");


require("dotenv").config();
app.use(cookieParser());

// app.use(
//   cors({
//     origin: "*",
//     credentials: true
//   })
// );
app.use(cors({
  origin: (origin, callback) => callback(null, origin),
  credentials: true,
}));


const port = process.env.PORT || 5003;



// const allowedOrigin = 'http://localhost:5173';  // Your frontend URL

// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*'); 
//   res.setHeader('Access-Control-Allow-Credentials', 'true');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // allowed methods
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');  // allowed headers

//   // Handle preflight requests
//   if (req.method === 'OPTIONS') {
//     return res.sendStatus(204);
//   }

//   next();
// });



app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Must come after middleware
app.use("/api/ptm", PTMRoute);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes); // Login route
app.use("/api/batches", batchRoutes);
app.use("/api/students", studentRoutes);



mongoose
  .connect(process.env.MONGODB_URI, {
    autoIndex: false,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
