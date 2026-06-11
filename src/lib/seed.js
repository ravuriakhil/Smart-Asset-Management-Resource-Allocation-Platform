import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.assetTransaction.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  // Create Users
  const adminPasswordHash = await bcrypt.hash("adminpassword", 10);
  const userPasswordHash = await bcrypt.hash("userpassword", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      passwordHash: adminPasswordHash,
      role: "admin",
    },
  });

  const user = await prisma.user.create({
    data: {
      name: "Regular User",
      email: "user@example.com",
      passwordHash: userPasswordHash,
      role: "user",
    },
  });

  console.log("Users created:", { admin: admin.email, user: user.email });

  // Create Categories
  const camera = await prisma.category.create({ data: { name: "Camera", description: "Cameras and lenses" } });
  const audio = await prisma.category.create({ data: { name: "Audio", description: "Microphones, recorders, and headphones" } });
  const lighting = await prisma.category.create({ data: { name: "Lighting", description: "Studio lights, softboxes, and stands" } });
  const projectors = await prisma.category.create({ data: { name: "Projectors", description: "Video projectors and screens" } });
  const accessories = await prisma.category.create({ data: { name: "Accessories", description: "Tripods, cables, bags, and batteries" } });

  console.log("Categories created.");

  // Create Assets
  const assetsData = [
    {
      name: "Sony Alpha A7 III",
      categoryId: camera.id,
      description: "Full-frame mirrorless camera body, 24.2 MP, dual card slots.",
      totalQuantity: 5,
      availableQuantity: 5,
      status: "Available",
    },
    {
      name: "Canon EOS 5D Mark IV",
      categoryId: camera.id,
      description: "Professional DSLR camera body, 30.4 MP, 4K video.",
      totalQuantity: 2,
      availableQuantity: 2,
      status: "Available",
    },
    {
      name: "Shure SM7B Microphone",
      categoryId: audio.id,
      description: "Cardioid studio vocal microphone, dynamic transducer.",
      totalQuantity: 8,
      availableQuantity: 8,
      status: "Available",
    },
    {
      name: "Rode Wireless GO II",
      categoryId: audio.id,
      description: "Dual-channel wireless microphone system, compact.",
      totalQuantity: 6,
      availableQuantity: 6,
      status: "Available",
    },
    {
      name: "Aputure 120D II LED Light",
      categoryId: lighting.id,
      description: "High-output COB LED light, V-mount battery support, 180W.",
      totalQuantity: 4,
      availableQuantity: 4,
      status: "Available",
    },
    {
      name: "Epson EB-E01 Projector",
      categoryId: projectors.id,
      description: "3LCD technology projector, XGA resolution, 3300 lumens.",
      totalQuantity: 3,
      availableQuantity: 3,
      status: "Available",
    },
    {
      name: "Manfrotto Tripod",
      categoryId: accessories.id,
      description: "Aluminum 3-section tripod with 3-way pan/tilt head.",
      totalQuantity: 10,
      availableQuantity: 10,
      status: "Available",
    },
    {
      name: "DJI Ronin-S Gimbal",
      categoryId: accessories.id,
      description: "3-axis stabilizer gimbal for DSLR and mirrorless cameras.",
      totalQuantity: 2,
      availableQuantity: 2,
      status: "Available",
    },
  ];

  for (const asset of assetsData) {
    await prisma.asset.create({ data: asset });
  }

  console.log("Assets created.");
  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
