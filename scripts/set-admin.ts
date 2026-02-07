import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.log("❌ Please provide an email address.");
    console.log("Usage: tsx scripts/set-admin.ts <email>");
    process.exit(1);
  }

  console.log(`🔍 Looking for user with email: ${email}\n`);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log(`❌ User with email "${email}" not found in the database.`);
    console.log("\nAvailable users:");
    const allUsers = await prisma.user.findMany({
      select: { email: true, role: true },
    });
    allUsers.forEach((u) => {
      console.log(`  - ${u.email} (${u.role})`);
    });
    process.exit(1);
  }

  console.log(`Found user: ${user.name || user.email}`);
  console.log(`Current role: ${user.role}\n`);

  if (user.role === "ADMIN") {
    console.log("✅ User is already an ADMIN. No changes needed.");
    return;
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
  });

  console.log(`✅ Successfully updated ${updated.email} to ADMIN role!`);
  console.log("\n⚠️  The user will need to log out and log back in for the changes to take effect.");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
