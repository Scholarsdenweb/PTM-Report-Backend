const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/isAdmin');

const requireAdminUnlessFirstUser = async (req, res, next) => {
  try {
    const userCount = await User.estimatedDocumentCount();
    if (userCount === 0) return next();

    return authMiddleware(req, res, () => isAdmin(req, res, next));
  } catch (error) {
    console.error("Error checking user count:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// @route   POST /api/users
// @desc    Create new user
// @access  First user public, then Admin only
router.post('/', requireAdminUnlessFirstUser, async (req, res) => {

  console.log("req.body", req.body);
  const { username, email, password, role } = req.body;
  const allowedRoles = ["Admin", "Faculty"];

  // Basic validation
  if (!username || !email || !password || !role ) {
    return res.status(400).json({ message: 'Please fill all fields' });
  }

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });

    console.log("existingUser", existingUser);
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
