const UserModel = require("../model/user.model");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const BlacklistModel = require("../model/blacklist.model");

async function register(req, res) {
   const { username, email, password } = req.body;

   if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
   }

   const existingUser = await UserModel.findOne(
    { $or :[{ username }, { email }]}
   );
    
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = await UserModel.create({
        username,
        email,
        password: hashedPassword
    })

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET);
    
    res.cookie('token', token)

res.status(201).json({ message: 'User registered successfully'})






}

async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await UserModel.findOne({ email })
    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.cookie('token', token)
    res.status(200).json({ message: 'Login successful' });
}

async function logout(req, res) {
    const token = req.cookies.token;
  if(token){
    // Add the token to the blacklist
        await BlacklistModel.create({ token });
  }

    res.clearCookie('token');
    res.status(200).json({ message: 'Logout successful' });
}

async function getme(req, res) {
    const userId = await UserModel.findById(req.user.userId).select('-password');
    res.status(200).json({ user: userId });
}


module.exports = { register, login, logout, getme }

