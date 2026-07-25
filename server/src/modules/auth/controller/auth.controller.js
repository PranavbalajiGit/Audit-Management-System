const jwt = require('jsonwebtoken');
const User = require('../../users/model/user.model');
const Role = require('../../users/model/role.model');
const AppError = require('../../../shared/errors/appError');
const { successResponse } = require('../../../shared/response/responseFormatter');

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, email: user.email, role: user.roleId.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );

  return { accessToken, refreshToken };
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password').populate('roleId');
    if (!user) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Check if account status is active
    if (user.status !== 'Active') {
      return next(new AppError('Account is disabled. Please contact support.', 403));
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Prepare response data
    const userProfile = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.roleId.name,
      phone: user.phone,
      status: user.status
    };

    res.status(200).json(successResponse('Login successful', {
      user: userProfile,
      accessToken,
      refreshToken
    }));
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError('Refresh token is required', 400));
    }

    // Verify token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user and populate role
    const user = await User.findById(decoded.userId).populate('roleId');
    if (!user) {
      return next(new AppError('User belonging to refresh token no longer exists', 401));
    }

    if (user.status !== 'Active') {
      return next(new AppError('Your account has been disabled.', 403));
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    res.status(200).json(successResponse('Token refreshed successfully', tokens));
  } catch (error) {
    next(new AppError('Invalid or expired refresh token. Please login again.', 401));
  }
};

const logout = async (req, res, next) => {
  try {
    // Since we are stateless, logging out is mostly handled client-side.
    // However, we can perform audit logging here if required.
    res.status(200).json(successResponse('Logout successful'));
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const userProfile = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.roleId.name,
      phone: user.phone,
      status: user.status
    };
    res.status(200).json(successResponse('Profile fetched successfully', { user: userProfile }));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
  getProfile,
};
