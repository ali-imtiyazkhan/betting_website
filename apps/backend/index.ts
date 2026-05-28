import express from "express"
import cors from "cors";
import { middleware } from "./middleware";

const app = express();

app.use(cors());
app.use(express.json());


app.get("/health",middleware, (req, res) => {
    res.json({ message: "OK" });
});

app.post("/buy",middleware,(req,res)=>{
    res.json({ message: "i am responding from the buy endpoint " });
})

app.post("/sell",middleware,(req,res)=>{
    res.json({ message: "OK" });
})

app.post("/split",middleware,(req,res)=>{
    res.json({ message: "OK" });
})

app.post("/merge",middleware,(req,res)=>{
    res.json({ message: "OK" });
})

app.get("/balance",middleware,(req,res)=>{
    res.json({ message: "OK" });
})


app.post("/history",middleware,(req,res)=>{
    res.json({ message: "OK" });
})

app.get("/postion",middleware,(req,res)=>{
    res.json({ message: "OK" });
})



app.listen(3000, () => {
    console.log("Server started on port 3000");
});

