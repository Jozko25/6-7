import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("Admin123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      password: hashedPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  console.log("✅ Created admin user:", admin.email);

  // Create sample vehicles
  const vehicles = [
    {
      make: "Tesla",
      model: "Model 3",
      year: 2024,
      price: 42990,
      mileage: 1250,
      description:
        "Brand new Tesla Model 3 with Autopilot, premium interior, and long range battery. Stunning performance and efficiency.",
      images: [
        "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800",
      ],
      status: "AVAILABLE" as const,
    },
    {
      make: "BMW",
      model: "X5",
      year: 2023,
      price: 67500,
      mileage: 8500,
      description:
        "Luxurious BMW X5 with M Sport package, panoramic sunroof, and advanced driver assistance systems. Perfect family SUV.",
      images: [
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800",
      ],
      status: "AVAILABLE" as const,
    },
    {
      make: "Mercedes-Benz",
      model: "C-Class",
      year: 2023,
      price: 48900,
      mileage: 5200,
      description:
        "Elegant Mercedes-Benz C-Class with AMG Line, leather interior, and MBUX infotainment system. German engineering at its finest.",
      images: [
        "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800",
      ],
      status: "RESERVED" as const,
    },
    {
      make: "Audi",
      model: "A4",
      year: 2024,
      price: 45200,
      mileage: 2100,
      description:
        "Sporty Audi A4 with Quattro all-wheel drive, virtual cockpit, and premium sound system. Nearly brand new condition.",
      images: [
        "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800",
      ],
      status: "AVAILABLE" as const,
    },
    {
      make: "Porsche",
      model: "911 Carrera",
      year: 2022,
      price: 115000,
      mileage: 12000,
      description:
        "Iconic Porsche 911 Carrera with PDK transmission, Sport Chrono package, and stunning performance. A true driver's car.",
      images: [
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
      ],
      status: "AVAILABLE" as const,
    },
    {
      make: "Lexus",
      model: "RX 350",
      year: 2023,
      price: 52900,
      mileage: 6800,
      description:
        "Reliable Lexus RX 350 with luxury package, Mark Levinson audio, and hybrid efficiency. Ultimate comfort and reliability.",
      images: [
        "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800",
      ],
      status: "SOLD" as const,
    },
  ];

  for (const vehicleData of vehicles) {
    const vehicle = await prisma.vehicle.create({
      data: vehicleData,
    });
    console.log(`✅ Created vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}`);
  }

  console.log("✨ Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
