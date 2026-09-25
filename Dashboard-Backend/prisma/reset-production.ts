import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("==================================================");
  console.log("🚀 PRODUCTION RESET: CLEAN DATA & PRESERVE SITES");
  console.log("==================================================");

  // 1. Temporarily unlink Site creators so Sites are preserved when Accounts are deleted
  console.log("🔒 Preserving Site Management data...");
  const siteCountBefore = await prisma.site.count();
  await prisma.site.updateMany({
    data: {
      createdByPublicId: null,
    },
  });
  console.log(`  ✓ Preserved ${siteCountBefore} Site records from deletion.`);

  // 2. Delete transactional and operational records in reverse foreign-key order
  console.log("🧹 Purging all transactional & operational records...");
  await prisma.activityAuditLog.deleteMany();
  await prisma.authAuditLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.invoicePayment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.clientInvoice.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.contribution.deleteMany();
  await prisma.report.deleteMany();
  await prisma.workItem.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.client.deleteMany();
  await prisma.emailVerification.deleteMany();
  await prisma.authProvider.deleteMany();
  await prisma.session.deleteMany();
  await prisma.credential.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.accountRole.deleteMany();
  await prisma.account.deleteMany();
  console.log("  ✓ All old user accounts, invoices, expenses, tasks, and audit logs purged.");

  // 3. Ensure Canonical System Roles exist
  console.log("⚙️  Verifying System Roles...");
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
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
    roleMap[r.name] = role.id;
  }

  // 4. Ensure System Permissions & Role Permissions exist
  console.log("⚙️  Verifying Permissions...");
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
    const perm = await prisma.permission.upsert({
      where: { code: p.code },
      update: { description: p.description },
      create: p,
    });
    permissionMap[p.code] = perm.id;
  }

  // Link permissions to ADMIN and SUPER_ADMIN
  for (const permId of Object.values(permissionMap)) {
    const adminRoleId = roleMap["ADMIN"];
    const superAdminRoleId = roleMap["SUPER_ADMIN"];

    if (adminRoleId) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: adminRoleId, permissionId: permId },
        },
        update: {},
        create: { roleId: adminRoleId, permissionId: permId },
      });
    }

    if (superAdminRoleId) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: superAdminRoleId, permissionId: permId },
        },
        update: {},
        create: { roleId: superAdminRoleId, permissionId: permId },
      });
    }
  }

  // 5. Ensure Functional Roles exist
  console.log("⚙️  Verifying Functional Roles...");
  const functionalRoleDefs = [
    { name: "Developer", description: "Software development and engineering", color: "indigo" },
    { name: "Marketing", description: "Marketing campaigns and user growth", color: "pink" },
    { name: "Design", description: "UI/UX and brand design", color: "amber" },
    { name: "Product", description: "Product management and requirements", color: "violet" },
    { name: "QA", description: "Quality assurance and testing", color: "teal" },
    { name: "Operations", description: "Business operations and support", color: "gray" },
  ];

  for (const fr of functionalRoleDefs) {
    await prisma.functionalRole.upsert({
      where: { name: fr.name },
      update: { description: fr.description, color: fr.color },
      create: {
        publicId: crypto.randomUUID(),
        ...fr,
      },
    });
  }

  // 6. Create the single Admin User
  console.log("👤 Creating single Administrator account...");
  const adminEmail = "xylozentechnologies@gmail.com";
  const adminPasswordPlain = "G7Z}EQY%H$^OtsR!";
  const adminPasswordHash = await bcrypt.hash(adminPasswordPlain, 12);
  const adminPublicId = crypto.randomUUID();

  const adminAccount = await prisma.account.create({
    data: {
      publicId: adminPublicId,
      email: adminEmail,
      username: "xylozentech",
      status: "ACTIVE",
      isEmailVerified: true,
      accessiblePages: ["*"],
      credential: {
        create: {
          passwordHash: adminPasswordHash,
        },
      },
      profile: {
        create: {
          firstName: "Admin",
          lastName: "Xylozen",
          phone: "9876543210",
          affiliation: "internal",
          functionalRole: "Operations",
        },
      },
      roles: {
        create: [
          { roleId: roleMap["ADMIN"] },
        ],
      },
    },
  });

  console.log(`  ✓ Created Admin: ${adminAccount.email} (Username: xylozentech)`);

  // 7. Re-link all existing Sites to the new Admin account
  console.log("🔗 Re-linking preserved Sites to new Administrator...");
  const updatedSites = await prisma.site.updateMany({
    data: {
      createdByPublicId: adminPublicId,
    },
  });
  console.log(`  ✓ Re-linked ${updatedSites.count} Sites to ${adminEmail}.`);

  console.log("==================================================");
  console.log("🎉 PRODUCTION RESET COMPLETED SUCCESSFULLY!");
  console.log("==================================================");
  console.log(`Email:    ${adminEmail}`);
  console.log(`Password: ${adminPasswordPlain}`);
  console.log(`Sites:    ${updatedSites.count} preserved`);
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("❌ Reset script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
