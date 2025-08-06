const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @route   POST /api/users
// @desc    Create new user
// @access  Public
router.post('/', async (req, res) => {

  console.log("req.body", req.body);
  const { username, email, password, role } = req.body;

  // Basic validation
  if (!username || !email || !password || !role ) {
    return res.status(400).json({ message: 'Please fill all fields' });
  }

  try {
    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create and save user
    const newUser = new User({ username, email, password, role });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully', userId: newUser._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
