const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;

// MongoDB connection
mongoose.connect("mongodb+srv://tejasvasisht07:mongodbpassword@cluster0.9ruridc.mongodb.net/?retryWrites=true&w=majority");
const User = mongoose.model('User', {
  fullName: String,
  email: {
    type: String,
    unique: true,
    required: true,
    validate: {
      validator: (email) => /\S+@\S+\.\S+/.test(email),
      message: 'Invalid email format',
    },
  },
  password: {
    type: String,
    required: true,
    validate: {
      validator: (password) => /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/.test(password),
      message: 'Password must be at least 6 characters long and contain at least one digit, one lowercase, and one uppercase letter',
    },
  },
});

app.use(express.json());

// Create a user
app.post('/user/create', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Hash the password before saving to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update user details
app.put('/user/edit', async (req, res) => {
  try {
    const { fullName, password } = req.body;

    // Validate full name and password
    if (!fullName || !password) {
      throw new Error('Full name and password are required');
    }

  
    const hashedPassword = await bcrypt.hash(password, 10);

    const updatedUser = await User.findOneAndUpdate(
      { email: req.body.email },
      { fullName, password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      throw new Error('User not found');
    }

    res.json({ message: 'User details updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user
app.delete('/user/delete', async (req, res) => {
  try {
    const deletedUser = await User.findOneAndDelete({ email: req.body.email });

    if (!deletedUser) {
      throw new Error('User not found');
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all users
app.get('/user/getAll', async (req, res) => {
  try {
    const users = await User.find({}, { fullName: 1, email: 1, password: 1 });

    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
