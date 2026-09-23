import app from "./app";
import rateLimit from "express-rate-limit";
import prisma from "./prisma/client";

const PORT = process.env.PORT || 4000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Clean up any existing soft-deleted accounts that still retain original unique email/username
  try {
    const deletedAccounts = await prisma.account.findMany({
      where: {
        OR: [{ status: "DELETED" }, { deletedAt: { not: null } }],
        NOT: { email: { contains: "_deleted_" } },
      },
    });
    for (const acc of deletedAccounts) {
      const deletedSuffix = `_deleted_${Date.now()}`;
      await prisma.account.update({
        where: { id: acc.id },
        data: {
          email: `${acc.email}${deletedSuffix}`,
          username: `${acc.username}${deletedSuffix}`,
        },
      });
      console.log(`[Cleanup] Released email for deleted account: ${acc.email}`);
    }
  } catch (err) {
    // Non-blocking cleanup
  }
});

app.use(limiter);
