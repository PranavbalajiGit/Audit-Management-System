const User = require('../model/user.model');
const Role = require('../model/role.model');

class UserRepository {
  async findAll(filter = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const query = { isDeleted: { $ne: true }, ...filter };
    
    const users = await User.find(query)
      .populate('roleId')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);
    return { users, total };
  }

  async findById(id) {
    return await User.findById(id).populate('roleId');
  }

  async findByEmail(email, selectPassword = false) {
    let query = User.findOne({ email, isDeleted: { $ne: true } });
    if (selectPassword) {
      query = query.select('+password');
    }
    return await query.populate('roleId');
  }

  async create(userData) {
    return await User.create(userData);
  }

  async update(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate('roleId');
  }

  async softDelete(id, deletedBy) {
    return await User.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy
    }, { new: true });
  }

  async findAllRoles() {
    return await Role.find();
  }

  async findRoleByName(name) {
    return await Role.findOne({ name });
  }
}

module.exports = new UserRepository();
