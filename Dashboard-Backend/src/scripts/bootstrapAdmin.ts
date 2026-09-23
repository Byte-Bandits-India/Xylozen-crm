import prisma from "../prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

async function createAdmin() {
  const email = "abrahambillclinton@gmail.com";
  const password = "admin@123";

  const existing = await prisma.account.findUnique({
    where: { email },
  });

  if (existing) {
    console.log("Admin already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);


  let adminRole = await prisma.role.findUnique({
    where: { name: "SUPER_ADMIN" },
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        name: "SUPER_ADMIN",
        description: "Super Administrator",
      },
    });
  }

  const account = await prisma.account.create({
    data: {
      publicId: crypto.randomUUID(),
      email,
      username: email,
      status: "ACTIVE",
      isEmailVerified: true,

      credential: {
        create: {
          passwordHash: hashedPassword,
        },
      },

      profile: {
        create: {
          firstName: "System",
          lastName: "Admin",
        },
      },
    },
  });

  await prisma.accountRole.create({
    data: {
      accountPublicId: account.publicId,
      roleId: adminRole.id,
    },
  });

  console.log("Admin created successfully");
  console.log("Email:", email);
  console.log("Password:", password);
}

createAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());