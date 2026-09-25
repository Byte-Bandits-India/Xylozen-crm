import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import adminRoutes from "./routes/admin.routes";
import clientRoutes from "./routes/client.routes";
import invoiceRoutes from "./routes/invoice.routes";
import expenseRoutes from "./routes/expense.routes";
import contributionRoutes from "./routes/contribution.routes";
import transactionRoutes from "./routes/transaction.routes";
import reportRoutes from "./routes/report.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import imageRoutes from "./routes/image.routes";
import siteRoutes from "./routes/site.routes";
import contactRoutes from "./routes/contact.routes";
import workItemRoutes from "./routes/workItem.routes";
import leadRoutes from "./routes/lead.routes";
import driveRoutes from "./routes/drive.routes";
import path from "path";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";

dotenv.config();

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "https://crm.thebytebandits.com",
  "http://crm.thebytebandits.com",
  "https://thebytebandits.com",
  "https://testcrm.xylozentech.com",
  "http://testcrm.xylozentech.com",
  "https://abc-testig.duckdns.org",
  "http://abc-testig.duckdns.org",
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

if (process.env.ALLOWED_ORIGINS) {
  allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(","));
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes("*") ||
        (typeof origin === "string" &&
          (origin.includes("thebytebandits.com") ||
            origin.includes("xylozentech.com") ||
            origin.endsWith(".vercel.app") ||
            origin.includes("abc-testig.duckdns.org")))
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/auth", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/contributions", contributionRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/image", imageRoutes);
app.use("/api/sites", siteRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/work-items", workItemRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/drive", driveRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

export default app;
