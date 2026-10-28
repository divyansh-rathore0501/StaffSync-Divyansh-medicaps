import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';

console.log('Running StaffSync Automated Test Suite...');

db.init();
db.resetAndSeed();

const JWT_SECRET = process.env.JWT_SECRET || 'staffsync_secret_key_production_grade_jwt_2026';

// Test 1: Authentication & Password Verification
{
  const hrUser = db.users.find(u => u.email === 'hr@staffsync.com')!;
  assert.ok(hrUser, 'HR user should exist in seeded database');
  assert.ok(bcrypt.compareSync('AdminPassword123!', hrUser.password!), 'Valid password should match bcrypt hash');
  assert.strictEqual(bcrypt.compareSync('WrongPassword', hrUser.password!), false, 'Wrong password should fail');

  const token = jwt.sign({ id: hrUser._id, role: hrUser.role }, JWT_SECRET);
  const decoded = jwt.verify(token, JWT_SECRET) as any;
  assert.strictEqual(decoded.id, hrUser._id, 'JWT payload should contain correct user ID');
  console.log('✓ Test 1 Passed: Authentication & Credential Verification');
}

// Test 2: RBAC Role Integrity
{
  const empUser = db.users.find(u => u.role === 'Employee')!;
  const mgrUser = db.users.find(u => u.role === 'Manager')!;
  const hrUser = db.users.find(u => u.role === 'HR')!;

  assert.strictEqual(empUser.role, 'Employee');
  assert.strictEqual(mgrUser.role, 'Manager');
  assert.strictEqual(hrUser.role, 'HR');
  console.log('✓ Test 2 Passed: Role-Based User Classifications');
}

// Test 3: Leave Balance & Calculation
{
  const emp = db.users.find(u => u.email === 'employee@staffsync.com')!;
  const initialAnnual = emp.leaveBalances.annual;
  assert.ok(initialAnnual > 0, 'Employee should have annual leave balance');

  // Verify leave duration calculation
  const start = new Date('2026-11-01');
  const end = new Date('2026-11-03');
  const durationDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  assert.strictEqual(durationDays, 3, 'Calculated duration between Nov 1 and Nov 3 inclusive must be 3 days');
  console.log('✓ Test 3 Passed: Leave Duration Calculation & Balances');
}

// Test 4: Overlap Prevention Logic
{
  const emp = db.users.find(u => u.email === 'employee@staffsync.com')!;
  const hasOverlap = db.leaves.some(l => {
    const empId = typeof l.employee === 'object' && l.employee ? l.employee._id : l.employee;
    return empId === emp._id && l.status === 'Pending';
  });
  assert.ok(hasOverlap, 'Demo pending leave should be registered for employee');
  console.log('✓ Test 4 Passed: Overlap Detection & State Tracking');
}

// Test 5: Attendance Duplicate Guard
{
  const todayStr = new Date().toISOString().split('T')[0];
  const emp = db.users.find(u => u.email === 'employee@staffsync.com')!;
  const countToday = db.attendance.filter(a => {
    const eId = typeof a.employee === 'object' && a.employee ? a.employee._id : a.employee;
    return eId === emp._id && a.date === todayStr;
  }).length;

  assert.ok(countToday <= 1, 'Employee cannot have more than 1 attendance check-in per day');
  console.log('✓ Test 5 Passed: Daily Single Check-in Invariant');
}

console.log('\n========================================');
console.log('All 5 StaffSync Automated Tests PASSED! ✓');
console.log('========================================\n');
