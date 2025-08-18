import { prisma, User } from "../src/index";

const PASSWORD = {
  plainText: `12345678`,
  hashed: "$2a$10$80hdDK0X7L1e4aTpB8fGj.ofRUBOQQz4fUxWzLm9gp/avCLjLbIWO",
};

async function seedAgents(): Promise<User[]> {
  console.log("Seeding agents...");

  const agent1 = await prisma.user.create({
    data: {
      name: "Sunny",
      email: "sunny@gmail.com",
      password: PASSWORD.hashed,
      phone: "+919876543210",
      role: "AGENT",
      isActive: true,
      referralCode: "AGENT1",
      agentProfile: {
        create: {
          businessName: "Sunny's Business",
          businessAddress: "Patiala, Punjab, India",
        },
      },
      kybData: {
        create: {
          kybStatus: "NOT_STARTED",
        },
      },
    },
  });

  return [agent1];
}

async function main() {
  try {
    console.log("🌱 Starting database seeding...\n");

    console.log("Clearing existing data...");
    await prisma.systemConfig.deleteMany();
    await prisma.agentProfile.deleteMany();
    await prisma.customerProfile.deleteMany();
    await prisma.kYC.deleteMany();
    await prisma.kYB.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.commission.deleteMany();
    await prisma.user.deleteMany();
    console.log("✓ Cleared existing data\n");

    await seedAgents();

    console.log("\n🎉 Duty database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
