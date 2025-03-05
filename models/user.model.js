// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  favoriteCities: [
    {
      name: {
        type: String,
        required: true
      },
      country: {
        type: String,
        required: true
      },
      weather: {
        type: String,
        required: true
      },
      temperature: {
        type: Number,
        required: true
      }
    }
  ]
});

module.exports = mongoose.model('user', UserSchema);