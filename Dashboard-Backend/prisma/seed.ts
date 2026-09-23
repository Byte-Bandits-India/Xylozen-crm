import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Cleaning up old database records...");

  // Delete in reverse foreign key order
  await prisma.activityAuditLog.deleteMany();
  await prisma.authAuditLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.invoicePayment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.contribution.deleteMany();
  await prisma.report.deleteMany();
  await prisma.workItem.deleteMany();
  await prisma.site.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.emailVerification.deleteMany();
  await prisma.authProvider.deleteMany();
  await prisma.session.deleteMany();
  await prisma.credential.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.accountRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.functionalRole.deleteMany();
  await prisma.client.deleteMany();
  await prisma.account.deleteMany();

  console.log("✅ Database clean complete.");

  ////////////////////////////////////////
  // 1. ROLES
  ////////////////////////////////////////
  console.log("🌱 Seeding canonical roles...");
  const roleDefs = [
    { name: "ADMIN", description: "Universal System Administrator" },
    { name: "MANAGER", description: "Team / Department Manager with dynamic page permissions" },
    { name: "INTERNAL_USER", description: "Internal Employee / Staff" },
    { name: "EXTERNAL_USER", description: "External Partner / Contractor" },
    { name: "SUPER_ADMIN", description: "Legacy Super Admin alias" },
    { name: "USER", description: "Standard User alias" },
  ];

  const roleMap: Record<string, bigint> = {};
  for (const r of roleDefs) {
    const created = await prisma.role.create({
      data: r,
    });
    roleMap[r.name] = created.id;
  }

  ////////////////////////////////////////
  // 2. FUNCTIONAL ROLES
  ////////////////////////////////////////
  console.log("🌱 Seeding functional roles...");
  const functionalRoleDefs = [
    { name: "Developer", description: "Software development and engineering", color: "indigo" },
    { name: "Marketing", description: "Marketing campaigns and user growth", color: "pink" },
    { name: "Design", description: "UI/UX and brand design", color: "amber" },
    { name: "Product", description: "Product management and requirements", color: "violet" },
    { name: "QA", description: "Quality assurance and testing", color: "teal" },
    { name: "Operations", description: "Business operations and support", color: "gray" },
  ];

  for (const fr of functionalRoleDefs) {
    await prisma.functionalRole.create({
      data: {
        publicId: crypto.randomUUID(),
        ...fr,
      },
    });
  }

  ////////////////////////////////////////
  // 3. PERMISSIONS
  ////////////////////////////////////////
  console.log("🌱 Seeding permissions...");
  const permissions = [
    { code: "user:create", description: "Create new user accounts" },
    { code: "user:read", description: "View user profiles and directories" },
    { code: "user:update", description: "Update user profiles and permissions" },
    { code: "user:delete", description: "Delete user accounts" },
    { code: "role:assign", description: "Assign or change user roles" },

    { code: "work:create", description: "Create work assessments and tasks" },
    { code: "work:read", description: "View work assessments and boards" },
    { code: "work:update", description: "Update work tasks, status, milestones" },
    { code: "work:delete", description: "Delete work items" },
    { code: "work:priority", description: "Update work priority on impact board" },

    { code: "expense:create", description: "Create expenses" },
    { code: "expense:read", description: "View expenses" },
    { code: "expense:update", description: "Update expenses" },
    { code: "expense:delete", description: "Delete expenses" },
    { code: "expense:pay", description: "Mark expense as paid" },

    { code: "invoice:create", description: "Create invoices" },
    { code: "invoice:read", description: "View invoices" },
    { code: "invoice:update", description: "Update invoices" },
    { code: "invoice:delete", description: "Delete invoices" },
    { code: "invoice:pay", description: "Record invoice payment" },

    { code: "client:create", description: "Create clients" },
    { code: "client:read", description: "View clients" },
    { code: "client:update", description: "Update clients" },
    { code: "client:delete", description: "Delete clients" },

    { code: "contribution:create", description: "Create contributions" },
    { code: "contribution:read", description: "View contributions" },
    { code: "contribution:update", description: "Update contributions" },
    { code: "contribution:delete", description: "Delete contributions" },

    { code: "transaction:create", description: "Create transactions" },
    { code: "transaction:read", description: "View transactions" },
    { code: "transaction:update", description: "Update transactions" },
    { code: "transaction:delete", description: "Delete transactions" },

    { code: "report:generate", description: "Generate business reports" },
    { code: "report:read", description: "View business reports" },
  ];

  const permissionMap: Record<string, bigint> = {};
  for (const p of permissions) {
    const created = await prisma.permission.create({
      data: p,
    });
    permissionMap[p.code] = created.id;
  }

  // Assign ALL permissions to ADMIN and SUPER_ADMIN
  for (const permId of Object.values(permissionMap)) {
    await prisma.rolePermission.create({
      data: { roleId: roleMap["ADMIN"], permissionId: permId },
    });
    await prisma.rolePermission.create({
      data: { roleId: roleMap["SUPER_ADMIN"], permissionId: permId },
    });
  }

  ////////////////////////////////////////
  // 4. SEED ADMIN USERS ONLY
  ////////////////////////////////////////
  console.log("🌱 Seeding Admin user accounts with password: pass@123 ...");
  const defaultPassword = "pass@123";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  async function createAccount(params: {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: string;
    functionalRole?: string;
    affiliation?: "internal" | "external";
    managerPublicId?: string | null;
    accessiblePages?: string[];
  }) {
    const publicId = crypto.randomUUID();
    const account = await prisma.account.create({
      data: {
        publicId,
        email: params.email,
        username: params.username,
        status: "ACTIVE",
        isEmailVerified: true,
        managerPublicId: params.managerPublicId || null,
        accessiblePages: params.accessiblePages || Prisma.JsonNull,
        credential: {
          create: {
            passwordHash,
          },
        },
        profile: {
          create: {
            firstName: params.firstName,
            lastName: params.lastName,
            phone: params.phone || "9876543210",
            functionalRole: params.functionalRole || null,
            affiliation: params.affiliation || "internal",
          },
        },
        roles: {
          create: {
            roleId: roleMap[params.role] || roleMap["ADMIN"],
          },
        },
      },
    });

    console.log(`  ✓ Created Admin: ${params.email} (Username: ${params.username}, Password: ${defaultPassword})`);
    return account;
  }

  // A. Primary System Admin
  await createAccount({
    email: "admin@bytebandits.com",
    username: "admin",
    firstName: "Master",
    lastName: "Admin",
    phone: "9876543210",
    role: "ADMIN",
    affiliation: "internal",
    accessiblePages: ["*"],
  });

  // B. Secondary System Admin
  await createAccount({
    email: "abrahambillclinton@gmail.com",
    username: "abraham",
    firstName: "Abraham",
    lastName: "Clinton",
    phone: "9876543211",
    role: "ADMIN",
    affiliation: "internal",
    accessiblePages: ["*"],
  });

  console.log("🎉 Seeding completed successfully!");
  console.log("==========================================");
  console.log("Admin 1: admin@bytebandits.com (pass@123)");
  console.log("Admin 2: abrahambillclinton@gmail.com (pass@123)");
  console.log("==========================================");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
