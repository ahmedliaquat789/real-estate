const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  // ...other fields
});

module.exports = mongoose.model('User', UserSchema);
