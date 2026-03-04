import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, { Express } from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import cron from "node-cron";

//Routes Import
import { checkPromos } from "./custom_function/check_promo";
import adminRoutes from "./routes/admin.route";
import authV2Routes from "./routes/authV2.route";
import cartRoutes from "./routes/cart.route";
import documentationRoutes from "./routes/documentation.route";
import eventRoutes from "./routes/events.route";
import eventsV2Routes from "./routes/eventsV2.route";
import indexRoutes from "./routes/index.route";
import logRoutes from "./routes/logs.route";
import merchRoutes from "./routes/merchandise.route";
import orderRoutes from "./routes/orders.route";
import privateRoutes from "./routes/private.route";
import promoRoutes from "./routes/promo.route";
import studentRoutes from "./routes/students.route";
import studentV2Routes from './routes/studentsV2.route';
import { errorHandler } from "./util/errors.util";

//Declaration
const app: Express = express();
dotenv.config();
const PORT = process.env.PORT || 5000;

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.CORS,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.set("trust proxy", 1);
app.use(bodyParser.json());
mongoose
  .connect(process.env.MONGODB_URI ?? "", {
    dbName: process.env.DB_NAME ?? "psits-test",
  })
  .then(() =>
    console.log("MongoDB PSITS Connected [" + process.env.DB_NAME + "]")
  )
  .catch((err: any) => console.log(err));

//Routes
app.use("/api", indexRoutes);
app.use("/api", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/merch", merchRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/promo", promoRoutes);
app.use("/api", privateRoutes);
app.use("/api/docs", documentationRoutes);
app.use("/api/v2/auth", authV2Routes);
app.use("/api/v2/events", eventsV2Routes);
app.use("/api/v2/students", studentV2Routes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server started, listening at port ${PORT}`);
  //Check Promo

  cron.schedule("0 0 * * *", async () => {
    console.log("Running daily promo check...");
    await checkPromos();
  });
});
