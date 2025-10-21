const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Blog = require('./models/Blog');
const User = require('./models/User');
const auth = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = "mySecretKey123";

mongoose.connect('mongodb://localhost:27017/blogDB')
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

app.get('/', (req, res) => {
  res.send("Blog backend server running");
});

// Auth routes
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const existingUser = await User.findOne({ username });
  if (existingUser) return res.status(400).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });
  await user.save();
  res.status(201).json({ message: "Signup successful" });
});

app.post('/signin', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ message: "User not found" });

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ message: "Login successful", token });
});

// Blog CRUD routes
app.get('/blogs', async (req, res) => {
  const blogs = await Blog.find();
  res.json(blogs);
});

app.post('/blogs', auth, async (req, res) => {
  const { title, description } = req.body;
  const blog = new Blog({ title, description });
  await blog.save();
  res.status(201).json(blog);
});

app.put('/blogs/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  const blog = await Blog.findByIdAndUpdate(id, { title, description }, { new: true });
  if (!blog) return res.status(404).json({ message: "Blog not found" });
  res.json(blog);
});

app.delete('/blogs/:id', auth, async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);
  res.json({ message: "Blog deleted" });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
