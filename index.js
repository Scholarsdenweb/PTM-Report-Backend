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

// List of allowed frontends for CORS
const allowedOrigins = [
  // "http://localhost:4000", // local frontend
  // "http://localhost:3000", // another possible local frontend
  "https://ptmreport.scholarsden.in" // your production frontend
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// CORS headers for preflight/OPTIONS requests (recommended fallback)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/ptm", PTMRoute);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/students", studentRoutes);


mongoose
  .connect(process.env.MONGODB_URI, {
    autoIndex: false,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

const port = process.env.PORT || 5003;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
