const userRepository = require('../repository/user.repository');
const AppError = require('../../../shared/errors/appError');

class UserService {
  async getAllUsers(filters, page, limit) {
    const dbFilter = {};
    if (filters.role) {
      const role = await userRepository.findRoleByName(filters.role);
      if (role) {
        dbFilter.roleId = role._id;
      } else {
        // If role doesn't exist, return empty array
        return { users: [], total: 0 };
      }
    }
    
    if (filters.search) {
      dbFilter.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    if (filters.status) {
      dbFilter.status = filters.status;
    }

    return await userRepository.findAll(dbFilter, page, limit);
  }

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  async createUser(userData) {
    const existing = await userRepository.findByEmail(userData.email);
    if (existing) {
      throw new AppError('Email is already in use', 400);
    }

    // Resolve roleName to roleId if roleId is not provided directly
    if (userData.role && !userData.roleId) {
      const role = await userRepository.findRoleByName(userData.role);
      if (!role) {
        throw new AppError(`Role '${userData.role}' not found`, 400);
      }
      userData.roleId = role._id;
    }

    if (!userData.roleId) {
      throw new AppError('Role is required', 400);
    }

    return await userRepository.create(userData);
  }

  async updateUser(id, updateData) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (updateData.email && updateData.email !== user.email) {
      const existing = await userRepository.findByEmail(updateData.email);
      if (existing) {
        throw new AppError('Email is already in use', 400);
      }
    }

    if (updateData.role) {
      const role = await userRepository.findRoleByName(updateData.role);
      if (!role) {
        throw new AppError(`Role '${updateData.role}' not found`, 400);
      }
      updateData.roleId = role._id;
    }

    return await userRepository.update(id, updateData);
  }

  async deleteUser(id, deletedBy) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Prevent self-deletion
    if (user._id.toString() === deletedBy.toString()) {
      throw new AppError('You cannot delete your own account', 400);
    }

    return await userRepository.softDelete(id, deletedBy);
  }

  async getRoles() {
    return await userRepository.findAllRoles();
  }
}

module.exports = new UserService();
