import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import path from "path";
import { PrismaClient } from "../src/generated/prisma/client.js";

dotenv.config({
  path: path.resolve("../../packages/db/.env"),
});

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });


export { prisma };