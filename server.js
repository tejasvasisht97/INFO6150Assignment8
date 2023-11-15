const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/userDB', { useNewUrlParser: true, useUnifiedTopology: true });

// Define the user schema
const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    validate: {
      validator: (value) => /^[A-Za-z\s]+$/.test(value),
      message: 'Invalid full name format. Only letters and spaces allowed.'
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (value) => /^\S+@\S+\.\S+$/.test(value),
      message: 'Invalid email address format.'
    }
  },
  password: {
    type: String,
    required: true,
    validate: {
      validator: (value) => /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/.test(value),
      message: 'Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, and one digit.'
    }
  }
});

// Define a pre-save hook to hash the password before saving
userSchema.pre('save', async function(next) {
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

// Create a new user
app.post('/user/create', async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.send('User created successfully!');
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Edit user details
app.put('/user/edit', async (req, res) => {
  try {
    const { fullName, password } = req.body;
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).send('User not found');
    }

    if (fullName) {
      user.fullName = fullName;
    }

    if (password) {
      user.password = password;
    }

    await user.save();
    res.send('User details updated successfully!');
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Delete user by email
app.delete('/user/delete', async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ email: req.body.email });

    if (!user) {
      return res.status(404).send('User not found');
    }

    res.send('User deleted successfully!');
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Get all user details
app.get('/user/getAll', async (req, res) => {
  try {
    const users = await User.find({}, 'fullName email password');
    res.json(users);
  } catch (error) {
    res.status(500).send('Internal server error');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
