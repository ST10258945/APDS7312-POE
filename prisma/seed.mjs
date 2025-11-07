import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password) {
  const rounds = Number.parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
  return bcrypt.hash(password, rounds);
}

async function main() {
  // Seed default employee
  const existingEmployee = await prisma.employee.findUnique({
    where: { employeeId: 'EMP001' },
  });

  if (!existingEmployee) {
    const passwordHash = await hashPassword('EmpSecurePass123!');
    const employee = await prisma.employee.create({
      data: {
        employeeId: 'EMP001',
        fullName: 'Admin Employee',
        email: 'admin@globewire.test',
        passwordHash,
        isActive: true,
      },
    });
    console.log(`Created default employee: ${employee.fullName} (${employee.employeeId})`);
  } else {
    console.log('Default employee already exists, skipping creation');
  }

  // Seed default customer
  const existingCustomer = await prisma.customer.findUnique({
    where: { username: 'testcustomer' },
  });

  if (!existingCustomer) {
    const passwordHash = await hashPassword('TestPass123!');
    const customer = await prisma.customer.create({
      data: {
        fullName: 'Test Customer',
        idNumber: '1234567890123', // 13-digit SA ID format
        accountNumber: '12345678', // 8-12 digit account number
        username: 'testcustomer',
        email: 'customer@globewire.test',
        passwordHash,
      },
    });
    console.log(`Created default customer: ${customer.fullName} (${customer.username})`);
  } else {
    console.log('Default customer already exists, skipping creation');
  }
}

try {
  await main(); // top-level await is valid in ESM
} catch (e) {
  console.error('Error seeding database:', e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
