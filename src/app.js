import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true,
    optionsSuccessStatus:200
}))
//to read json
app.use(express.json({limit:"16kb"}))
//to get the ecncrypted url param data
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))

//cookie parser
app.use(cookieParser())



export {app};