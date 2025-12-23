import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // 创建集团 (Makrite)
  const group = await prisma.group.upsert({
    where: { id: 'makrite-group-id' },
    update: {},
    create: {
      id: 'makrite-group-id',
      name: 'Makrite',
      settings: { defaultLanguage: 'zh' },
    },
  });
  console.log(`✅ Group created: ${group.name}`);

  // 创建默认子公司 (Makrite Headquarters)
  const company = await prisma.company.upsert({
    where: { domain: 'default' },
    update: {},
    create: {
      name: 'Makrite Headquarters',
      domain: 'default',
      groupId: group.id,
      settings: { defaultLanguage: 'zh' },
    },
  });
  console.log(`✅ Company created: ${company.name}`);

  // 创建示例部门
  const salesDept = await prisma.department.upsert({
    where: { id: 'sales-dept-id' },
    update: {},
    create: {
      id: 'sales-dept-id',
      name: '销售部',
      code: 'SALES',
      description: 'Sales Department',
      companyId: company.id,
    },
  });
  console.log(`✅ Department created: ${salesDept.name}`);

  const techDept = await prisma.department.upsert({
    where: { id: 'tech-dept-id' },
    update: {},
    create: {
      id: 'tech-dept-id',
      name: '技术部',
      code: 'TECH',
      description: 'Technology Department',
      companyId: company.id,
    },
  });
  console.log(`✅ Department created: ${techDept.name}`);

  // 创建集团管理员 (密码: admin123)
  const adminPassword = await bcrypt.hash('admin123', 10);
  const groupAdmin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@makrite.com',
      passwordHash: adminPassword,
      firstName: 'Group',
      lastName: 'Admin',
      role: UserRole.GROUP_ADMIN,
      language: 'zh',
      companyId: company.id,
      departmentId: null,
    },
  });
  console.log(`✅ Group Admin created: ${groupAdmin.username}`);

  // 创建部门经理 (密码: manager123)
  const managerPassword = await bcrypt.hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { username: 'manager' },
    update: {},
    create: {
      username: 'manager',
      email: 'manager@makrite.com',
      passwordHash: managerPassword,
      firstName: 'Sales',
      lastName: 'Manager',
      role: UserRole.MANAGER,
      language: 'zh',
      companyId: company.id,
      departmentId: salesDept.id,
    },
  });
  console.log(`✅ Manager created: ${manager.username}`);

  console.log('🎉 Seed completed!');
  console.log('');
  console.log('📋 Default Credentials:');
  console.log('   Group Admin - Username: admin    Password: admin123');
  console.log('   Manager     - Username: manager  Password: manager123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
