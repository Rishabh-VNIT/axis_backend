const express = require('express');
const cors = require("cors");
const rootRouter = require("./routes/index");
const app = express();
const env = require('./config');
const PORT = env("PORT")

app.use(cors());

app.use(express.json());

app.use("/", rootRouter);
app.get('/', (req, res)=>{
    res.json({
        msg : "Hello"
    })
})

app.listen(PORT);