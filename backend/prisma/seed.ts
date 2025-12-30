import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SALES_DEPT_ID = '9b8a7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
const TECH_DEPT_ID = '1a2b3c4d-5e6f-4a7b-9c8d-0e1f2a3b4c5d';

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
  const company =
    (await prisma.company.findFirst({ where: { domain: 'default', groupId: group.id } })) ||
    (await prisma.company.create({
      data: {
        name: 'Makrite Headquarters',
        domain: 'default',
        groupId: group.id,
        settings: { defaultLanguage: 'zh' },
      },
    }));
  console.log(`✅ Company created: ${company.name}`);

  // 创建示例部门
  const salesDept = await prisma.department.upsert({
    where: { id: SALES_DEPT_ID },
    update: { name: '销售部', description: 'Sales Department', companyId: company.id, isActive: true },
    create: {
      id: SALES_DEPT_ID,
      name: '销售部',
      description: 'Sales Department',
      companyId: company.id,
    },
  });
  console.log(`✅ Department created: ${salesDept.name}`);

  const techDept = await prisma.department.upsert({
    where: { id: TECH_DEPT_ID },
    update: { name: '技术部', description: 'Technology Department', companyId: company.id, isActive: true },
    create: {
      id: TECH_DEPT_ID,
      name: '技术部',
      description: 'Technology Department',
      companyId: company.id,
    },
  });
  console.log(`✅ Department created: ${techDept.name}`);

  // 创建超级管理员 (密码: super123)
  const superPassword = await bcrypt.hash('super123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      email: 'superadmin@makrite.com',
      passwordHash: superPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      language: 'zh',
      companyId: company.id,
      departmentId: null,
    },
  });
  console.log(`✅ Super Admin created: ${superAdmin.username}`);

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
  console.log('   Super Admin - Username: superadmin  Password: super123');
  console.log('   Group Admin - Username: admin       Password: admin123');
  console.log('   Manager     - Username: manager     Password: manager123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
