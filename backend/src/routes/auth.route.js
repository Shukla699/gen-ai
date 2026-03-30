const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

const AuthRouter = express.Router();

AuthRouter.post('/register', authController.register)
AuthRouter.post('/login', authController.login)
AuthRouter.get('/logout', authController.logout)
AuthRouter.get('/me', authMiddleware, authController.getme)



module.exports = AuthRouter;