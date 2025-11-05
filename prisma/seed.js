const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function hashPassword(password) {
  const rounds = Number.parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
  return bcrypt.hash(password, rounds);
}

async function main() {
  // Check if the employee already exists
  const existingEmployee = await prisma.employee.findUnique({
    where: { employeeId: 'EMP001' },
  });

  // Only create if it doesn't exist
  if (!existingEmployee) {
    const passwordHash = await hashPassword('EmpSecurePass123!');
    
    const employee = await prisma.employee.create({
      data: {
        employeeId: 'EMP001',
        fullName: 'Admin Employee',
        email: 'admin@globewire.test',
        passwordHash,
        isActive: true
      },
    });
    
    console.log(`Created default employee: ${employee.fullName} (${employee.employeeId})`);
  } else {
    console.log('Default employee already exists, skipping creation');
  }
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });