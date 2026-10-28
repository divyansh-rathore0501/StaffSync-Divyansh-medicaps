import { db } from './db.js';

console.log('--- StaffSync HRMS Database Seeding ---');
db.init();
db.resetAndSeed();

console.log('Seeded successfully with default accounts:');
console.log('1. HR Admin:      hr@staffsync.com        / AdminPassword123!');
console.log('2. Manager:       manager@staffsync.com   / ManagerPassword123!');
console.log('3. Employee:      employee@staffsync.com  / EmployeePassword123!');
console.log('Total Users:', db.users.length);
console.log('Total Departments:', db.departments.length);
console.log('Total Attendance Records:', db.attendance.length);
console.log('Total Leave Requests:', db.leaves.length);
console.log('Total Announcements:', db.announcements.length);
console.log('Total Training Programs:', db.trainingPrograms.length);
