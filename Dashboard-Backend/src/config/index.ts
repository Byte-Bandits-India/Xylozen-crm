import dotenv from "dotenv";
import fs from "fs";

// Load standard .env
dotenv.config();

// Load .env.local if present (e.g. on EC2)
if (fs.existsSync("/home/ec2-user/.env.local")) {
  dotenv.config({ path: "/home/ec2-user/.env.local" });
}

export default {
  email: {
    host: process.env.SMTP_HOST || "smtpout.secureserver.net",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : true,
    user: process.env.SMTP_USER || process.env.EMAIL_USER || "info@thebytebandits.com",
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || "ByteBandits@123",
    from: process.env.SMTP_FROM || "support@thebytebandits.com",
  },
  appUrl: process.env.APP_URL || process.env.FRONTEND_URL || "https://crm.thebytebandits.com",
};
