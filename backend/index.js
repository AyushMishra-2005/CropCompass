import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import user from './route/user.route.js';
import cookieParser from 'cookie-parser';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;
const MONGO_URI = process.env.MONGODB_URI;

const allowedOrigins = ["https://cropcompassespserver.onrender.com", "http://localhost:8001"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

const main = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Database is connected");
  } catch (err) {
    console.log("Database Error", err);
  }
}
main();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});



app.use("/user", user);

app.get("/getImage", (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp },
    process.env.CLOUDINARY_API_SECRET
  );

  res.json({
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME
  });
});

app.post('/deleteImage', async (req, res) => {
  const { publicId } = req.body;
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });
    res.status(200).json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/testing-esp", async (req, res) => {
  const { command, esp_id } = req.body;
  try {
    const { data } = await axios.post(
      'https://cropcompassespserver.onrender.com/send-command',
      { esp_id, command },
    );

    console.log(data);

    return res.status(200).json({ message: "success" });
  } catch (err) {
    return res.status(500).json({ message: "error" });
  }
});

app.post("/receive-sensor-data", (req, res) => {
  const data = req.body;

  if(!data){
    return req.status(400).json({ success: false, message: "No data received" });
  }

  console.log("Received Sensor Data on Final Server:");
  console.log("ESP ID:", data.espId);
  console.log("DHT22 Temperature:", data.DHT22_Temp);
  console.log("DHT22 Humidity:", data.DHT22_Humidity);
  console.log("DS18B20 Temperature:", data.DS18B20_Temp);

  return res.json({ success: true, message: "Sensor data received successfully" });
});
app.listen(port, () => {
  console.log(`App is running at port ${port}`);
});
