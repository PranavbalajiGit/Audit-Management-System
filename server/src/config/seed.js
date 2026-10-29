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
      { name: 'Guest House', description: 'Institutional guest house accommodations and VIP guest suites' },
      { name: 'COE Office', description: 'Controller of Examinations office and secure record rooms' },
      { name: 'Research and Development Centre', description: 'R&D labs, innovation hubs, and specialized equipment centres' },
      { name: 'Medical Centre', description: 'Campus health centre, infirmary, and medical emergency facilities' },
      { name: 'Radio Station', description: 'Campus community radio station, broadcast studio, and control rooms' },
      { name: 'Classroom', description: 'Standard teaching classrooms' },
      { name: 'Laboratory', description: 'Scientific or computer laboratories' },
      { name: 'Hostel', description: 'Student residential hostels' },
      { name: 'Library', description: 'Institution library zones' },
      { name: 'Office', description: 'Administrative and staff offices' },
      { name: 'Other', description: 'Other building zones and amenities' },
    ];

    const seededCategories = {};
    for (const catData of categoriesToSeed) {
      let cat = await AuditCategory.findOne({ name: catData.name });
      if (!cat) {
        cat = await AuditCategory.create(catData);
        console.log(`Created Audit Category: ${cat.name}`);
      } else {
        console.log(`Category already exists: ${cat.name}`);
      }
      seededCategories[cat.name] = cat._id;
    }

    // 2b. Seed Default Checklists for Mandatory Categories
    console.log('Seeding Default Checklists...');
    const Checklist = require('../modules/checklists/model/checklist.model');
    const checklistsToSeed = [
      {
        title: 'Guest House Inspection Checklist',
        categoryName: 'Guest House',
        items: [
          { question: 'Are all room furnishings, bedding, and curtains clean and in pristine condition?', type: 'boolean', mandatory: true },
          { question: 'Is the air conditioner, television, and electric kettle functioning properly?', type: 'boolean', mandatory: true },
          { question: 'Is the attached bathroom sanitized with proper water supply and toiletries?', type: 'boolean', mandatory: true },
          { question: 'Are safety locks and emergency evacuation signage intact?', type: 'boolean', mandatory: true },
        ]
      },
      {
        title: 'COE Office Confidential Audit Checklist',
        categoryName: 'COE Office',
        items: [
          { question: 'Are examination records and confidential answer scripts stored in locked steel almirahs?', type: 'boolean', mandatory: true },
          { question: 'Is the CCTV camera surveillance system active and covering entrance and storage zones?', type: 'boolean', mandatory: true },
          { question: 'Are access control logs maintained for unauthorized personnel restrictions?', type: 'boolean', mandatory: true },
          { question: 'Is the paper shredder and high-speed scanner fully operational?', type: 'boolean', mandatory: true },
        ]
      },
      {
        title: 'Research & Development Centre Audit Checklist',
        categoryName: 'Research and Development Centre',
        items: [
          { question: 'Are precision measurement instruments and workstations properly calibrated and maintained?', type: 'boolean', mandatory: true },
          { question: 'Are safety goggles, gloves, and specialized PPE equipment readily available?', type: 'boolean', mandatory: true },
          { question: 'Is the emergency power shutoff switch clearly marked and accessible?', type: 'boolean', mandatory: true },
          { question: 'Are chemical/electronic waste disposal protocols properly followed?', type: 'boolean', mandatory: true },
        ]
      },
      {
        title: 'Medical Centre Health & Safety Checklist',
        categoryName: 'Medical Centre',
        items: [
          { question: 'Is the emergency first-aid kit and emergency medicine inventory fully stocked and unexpired?', type: 'boolean', mandatory: true },
          { question: 'Are examination beds sanitized with fresh disposable sheets and pillows?', type: 'boolean', mandatory: true },
          { question: 'Are bio-medical waste segregation bins (color-coded) properly placed and emptied?', type: 'boolean', mandatory: true },
          { question: 'Is the oxygen cylinder and vital signs monitoring equipment functional?', type: 'boolean', mandatory: true },
        ]
      },
      {
        title: 'Radio Station Broadcast Infrastructure Checklist',
        categoryName: 'Radio Station',
        items: [
          { question: 'Are studio microphones, audio mixer, and sound monitoring headphones fully functional?', type: 'boolean', mandatory: true },
          { question: 'Is the acoustic soundproofing on walls and ceiling intact without physical damage?', type: 'boolean', mandatory: true },
          { question: 'Is the "ON AIR" indicator light operational when broadcasting equipment is active?', type: 'boolean', mandatory: true },
          { question: 'Are transmission backup UPS power systems verified and online?', type: 'boolean', mandatory: true },
        ]
      },
    ];

    for (const chkData of checklistsToSeed) {
      const catId = seededCategories[chkData.categoryName];
      if (catId) {
        let chk = await Checklist.findOne({ title: chkData.title });
        if (!chk) {
          chk = await Checklist.create({
            title: chkData.title,
            categoryId: catId,
            items: chkData.items,
          });
          console.log(`Created Checklist: ${chk.title}`);
        } else {
          console.log(`Checklist already exists: ${chk.title}`);
        }
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
