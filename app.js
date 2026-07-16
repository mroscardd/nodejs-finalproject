const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'your_secret_key';

mongoose.set('strictQuery', false);

const uri =  "mongodb://root:taLdsfcBVB1ggNRgUPZGooG5@172.21.138.54:27017";
mongoose.connect(uri,{'dbName':'SocialDB'});

const User = mongoose.model('User', { username: String, email: String, password: String });
const Post = mongoose.model('Post', { userId: mongoose.Schema.Types.ObjectId, text: String });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: SECRET_KEY, resave: false, saveUninitialized: true, cookie: { secure: false } }));


function authenticateJWT(req, res, next) {
    // Get token from session
    const token = req.session.token;
  
    // If no token, return 401 Unauthorized
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
  
    try {
      // Verify token
      const decoded = jwt.verify(token, SECRET_KEY);
      
      // Attach user data to request
      req.user = decoded;
      
      // Continue to the next middleware
      next();
    } catch (error) {
      // If invalid token, return 401
      return res.status(401).json({ message: 'Invalid token' });
    }
  }

  function requireAuth(req, res, next) {
    const token = req.session.token;  // Retrieve token from session
  
    if (!token) return res.redirect('/login');  // If no token, redirect to login page
  
    try {
      const decoded = jwt.verify(token, SECRET_KEY);  // Verify the token using the secret key
      req.user = decoded;  // Attach decoded user data to the request
      next();  // Pass control to the next middleware/route
    } catch (error) {
      return res.redirect('/login');  // If token is invalid, redirect to login page
    }
  }

  app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
  app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
  app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
  app.get('/post', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'public', 'post.html')));
  app.get('/index', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html'), { username: req.user.username }));
  

app.post('/register', async (req, res) => {
    const {username, email, password} = req.body
    try {
        const existingUser = await User.findOne({ $or: [{ username }, { email }] })
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' })     
           }
        const newUser =  new User ({
            username: username,
            email: email,
            password: password
        })
        await newUser.save()

        const token = jwt.sign({ userId: newUser._id, username: newUser.username }, SECRET_KEY, { expiresIn: '1h' })
        req.session.token
        return res.status(201).send({"message":`The user ${username} has been added`})
        
    
        } catch (error) {
            console.error(error)
            res.status(500).json({ message: 'Internal Server Error' })
        }
})


app.post('/login', async (res, req) => {
    const {username, password} = req.body
    try {
        const user = await User.findOne({username, password})
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' })
        }
        const token = jwt.sign({ userId: newUser._id, username: newUser.username }, SECRET_KEY, { expiresIn: '1h' })
        req.session.token = token
        return res.status(200).send({"message":`${user.username} has logged in`})
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
})


app.post('/post', authenticateJWT, async (req, res) => {
    const text = req.body
    if (!text || typeof text !== 'string') {
        res.status(400).json({ message: 'Please provide valid post content' })
    try {
        const newPost = new Post({userId: req.user.userId, text})
        await newPost.save()
        res.status(500).json({ message: 'Internal Server Error' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Internal Server Error' });
    }     
    }
})

app.get('/posts',authenticateJWT, async (req, res) => {
    try {
    const posts = Post.find({userId: req.user.userId})
    res.status(200).json(posts)

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
    })


// Insert your post updation code here.

// Insert your post deletion code here.

// Insert your user logout code here.

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
