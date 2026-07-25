const userService = require('../service/user.service');
const { successResponse } = require('../../../shared/response/responseFormatter');

const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const { search, role, status } = req.query;

    const { users, total } = await userService.getAllUsers({ search, role, status }, page, limit);

    // Format profiles
    const formatted = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.roleId?.name,
      phone: user.phone,
      status: user.status,
      createdAt: user.createdAt
    }));

    res.status(200).json(successResponse('Users retrieved successfully', formatted, {
      page,
      limit,
      total
    }));
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    
    res.status(200).json(successResponse('User retrieved successfully', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.roleId?.name,
      phone: user.phone,
      status: user.status,
      createdAt: user.createdAt
    }));
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    
    res.status(201).json(successResponse('User created successfully', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: req.body.role || 'Auditor',
      phone: user.phone,
      status: user.status
    }));
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    
    res.status(200).json(successResponse('User updated successfully', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.roleId?.name,
      phone: user.phone,
      status: user.status
    }));
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id, req.user._id);
    res.status(200).json(successResponse('User deleted successfully'));
  } catch (error) {
    next(error);
  }
};

const getRoles = async (req, res, next) => {
  try {
    const roles = await userService.getRoles();
    res.status(200).json(successResponse('Roles retrieved successfully', roles));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getRoles
};
