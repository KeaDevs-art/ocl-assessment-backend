// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("./models/user.model");
const auth = require("./middleware/auth.middleware");

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/weather-app", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
// Register user
app.post("/api/users/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      favoriteCities: [],
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user
    await user.save();

    // Create JWT
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || "weatherappsecret",
      { expiresIn: "5d" },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Login user
app.post("/api/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create JWT
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || "weatherappsecret",
      { expiresIn: "5d" },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get user profile
app.get("/api/users/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Add favorite city
app.post("/api/users/favorites", auth, async (req, res) => {
  try {
    const { city } = req.body;

    const user = await User.findById(req.user.id);

    // Check if city already exists in favorites
    if (user.favoriteCities.some((fav) => fav.name === city.name)) {
      return res.status(400).json({ message: "City already in favorites" });
    }

    user.favoriteCities.unshift(city);
    await user.save();

    res.json(user.favoriteCities);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Remove favorite city
app.delete("/api/users/favorites/:cityName", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Filter out the city to remove
    user.favoriteCities = user.favoriteCities.filter(
      (city) => city.name !== req.params.cityName
    );

    await user.save();

    res.json(user.favoriteCities);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}...`));
