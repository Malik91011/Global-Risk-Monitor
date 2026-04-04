import express, { type Express } from "express";
import cors from "cors";
import router from "./routes/index";
import { startScheduler } from "./lib/scraper";

const app: Express = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// app.use("/api", router);
// Moved router call to match the rest of the app style
app.use("/api", router);

// No local scheduler in Vercel - use Crons in vercel.json instead
// startScheduler(); 

export default app;
