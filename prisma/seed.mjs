import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password) {
  const rounds = Number.parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
  return bcrypt.hash(password, rounds);
}

async function main() {
  const existingEmployee = await prisma.employee.findUnique({
    where: { employeeId: 'EMP001' },
  });

  if (existingEmployee) {
    console.log('Default employee already exists, skipping creation');
    return;
  }

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
}

try {
  await main(); // top-level await is valid in ESM
} catch (e) {
  console.error('Error seeding database:', e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
