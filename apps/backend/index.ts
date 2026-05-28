import express from "express";
import cors from "cors";
import marketsRouter from "./routes/markets";
import ordersRouter from "./routes/orders";
import userRouter from "./routes/user";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// Mount routers
app.use(marketsRouter);
app.use(ordersRouter);
app.use(userRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
