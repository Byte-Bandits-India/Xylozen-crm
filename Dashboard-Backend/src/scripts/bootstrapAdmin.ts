import "dotenv/config";
import prisma from "../prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Creates the single admin account, or updates its mobile number and password
// if it already exists. Safe to run against a live database: nothing is deleted.
async function bootstrapAdmin() {
  const email = "xylozentechnologies@gmail.com";
  const phone = process.env.ADMIN_PHONE;
  const password = process.env.ADMIN_PASSWORD;

  if (!phone || !password) {
    throw new Error("ADMIN_PHONE and ADMIN_PASSWORD must be set in the environment");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: { name: "ADMIN", description: "Universal System Administrator" },
  });

  const existing = await prisma.account.findFirst({
    where: {
      OR: [{ email }, { profile: { phone } }],
    },
  });

  if (existing) {
    await prisma.account.update({
      where: { publicId: existing.publicId },
      data: { status: "ACTIVE", isEmailVerified: true, accessiblePages: ["*"] },
    });
    await prisma.credential.upsert({
      where: { accountPublicId: existing.publicId },
      update: { passwordHash, passwordChangedAt: new Date(), failedAttempts: 0, lockedUntil: null },
      create: { accountPublicId: existing.publicId, passwordHash },
    });
    await prisma.userProfile.upsert({
      where: { accountPublicId: existing.publicId },
      update: { phone },
      create: { accountPublicId: existing.publicId, firstName: "Admin", lastName: "Xylozen", phone },
    });
    await prisma.accountRole.upsert({
      where: { accountPublicId_roleId: { accountPublicId: existing.publicId, roleId: adminRole.id } },
      update: {},
      create: { accountPublicId: existing.publicId, roleId: adminRole.id },
    });

    console.log(`Admin updated: ${existing.email}`);
  } else {
    await prisma.account.create({
      data: {
        publicId: crypto.randomUUID(),
        email,
        username: "xylozentech",
        status: "ACTIVE",
        isEmailVerified: true,
        accessiblePages: ["*"],
        credential: { create: { passwordHash } },
        profile: {
          create: { firstName: "Admin", lastName: "Xylozen", phone, affiliation: "internal" },
        },
        roles: { create: { roleId: adminRole.id } },
      },
    });

    console.log(`Admin created: ${email}`);
  }

  console.log("Login (mobile):", phone);
}

bootstrapAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
