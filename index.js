const express = require('express');
const cors = require('cors');
require("dotenv").config();

const app = express();
const port = process.env.port || 7000;

app.use(cors());
app.use(express.json())

app.get("/", (req, res)=>{
    res.send("assignment 11 backend is here")
})

app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`)
})