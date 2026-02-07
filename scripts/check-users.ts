import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("📋 Checking all users in the database...\n");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (users.length === 0) {
    console.log("❌ No users found in the database.");
    return;
  }

  console.log(`Found ${users.length} user(s):\n`);

  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email}`);
    console.log(`   Name: ${user.name || "N/A"}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Email Verified: ${user.emailVerified ? "Yes" : "No"}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${user.createdAt.toISOString()}`);
    console.log("");
  });
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
