const jwt = require('jsonwebtoken')
const User = require('../models/user')
const { promisify } = require('util');
const catchAsync = require('../helper/catchAsync')
require('dotenv').config()
const AppError = require('../helper/CustomError')

const JWT_SECRET_KEY = "mysecretkey";

const auth = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    console.log('Decoded token:', decoded);

    if (!decoded.id) { // Change `_id` to `id` here
      throw new Error('User ID not found in token payload');
    }

    const currentUser = await User.findById(decoded.id);
    console.log('Current user:', currentUser);

    if (!currentUser) {
      return next(new AppError('The user belonging to this token does no longer exist.', 401));
    }

    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(new AppError('User recently changed password, please login again!', 401));
    }

    req.user = currentUser;
    next();
  } catch (error) {
    console.error('Token decoding error:', error);
    return next(new AppError('Invalid token. Please log in again.', 401));
  }
});



module.exports = auth
