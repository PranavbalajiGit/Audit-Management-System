require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Role = require('../modules/users/model/role.model');
const User = require('../modules/users/model/user.model');
const AuditCategory = require('../modules/checklists/model/auditCategory.model');

const seedData = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart_infrastructure_audit';
    console.log(`Connecting to database for seeding: ${mongoURI}`);
    await mongoose.connect(mongoURI);
    console.log('Database connected successfully.');

    // 1. Seed Roles
    console.log('Seeding Roles...');
    const rolesToSeed = [
      { name: 'Admin', description: 'Administrative user with full system access' },
      { name: 'Auditor', description: 'Field auditor who conducts inspections' },
    ];

    const seededRoles = {};
    for (const roleData of rolesToSeed) {
      let role = await Role.findOne({ name: roleData.name });
      if (!role) {
        role = await Role.create(roleData);
        console.log(`Created Role: ${role.name}`);
      } else {
        console.log(`Role already exists: ${role.name}`);
      }
      seededRoles[role.name] = role._id;
    }

    // 2. Seed Audit Categories
    console.log('Seeding Audit Categories...');
    const categoriesToSeed = [
      { name: 'Classroom', description: 'Standard teaching classrooms' },
      { name: 'Laboratory', description: 'Scientific or computer laboratories' },
      { name: 'Hostel', description: 'Student residential hostels' },
      { name: 'Library', description: 'Institution library zones' },
      { name: 'Office', description: 'Administrative and staff offices' },
      { name: 'Other', description: 'Other building zones and amenities' },
    ];

    for (const catData of categoriesToSeed) {
      let cat = await AuditCategory.findOne({ name: catData.name });
      if (!cat) {
        cat = await AuditCategory.create(catData);
        console.log(`Created Audit Category: ${cat.name}`);
      } else {
        console.log(`Category already exists: ${cat.name}`);
      }
    }

    // 3. Seed Users
    console.log('Seeding Users...');
    
    // Admin User
    const adminEmail = 'admin@s7.com';
    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Admin User',
        email: adminEmail,
        password: 'Password123!', // Hashed automatically by pre-save hook
        roleId: seededRoles['Admin'],
        phone: '+1234567890',
        status: 'Active'
      });
      console.log(`Created Admin User: ${adminEmail}`);
    } else {
      console.log(`Admin User already exists: ${adminEmail}`);
    }

    // Auditor User
    const auditorEmail = 'auditor@s7.com';
    let auditorUser = await User.findOne({ email: auditorEmail });
    if (!auditorUser) {
      auditorUser = await User.create({
        name: 'Auditor User',
        email: auditorEmail,
        password: 'Password123!', // Hashed automatically by pre-save hook
        roleId: seededRoles['Auditor'],
        phone: '+1234567891',
        status: 'Active'
      });
      console.log(`Created Auditor User: ${auditorEmail}`);
    } else {
      console.log(`Auditor User already exists: ${auditorEmail}`);
    }

    console.log('Seeding finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
