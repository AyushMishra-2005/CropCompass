import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import espServer from './route/espServer.route.js';
import cookieParser from 'cookie-parser';
import {app, io, server, getEspSocketId} from './socketIO/server.js'

dotenv.config();

const port = process.env.PORT || 8001;

app.use(cors({ origin: "*" }));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use("/esp-server", espServer);
app.use("/hello", (req, res) => {
  res.send("working");
});

app.post("/send-command", (req, res) => {
  const { esp_id, command } = req.body;
  const socketId = getEspSocketId(esp_id);

  if (socketId) {
    io.to(socketId).emit("command", command); 
    return res.json({ success: true, message: `Command sent to ${esp_id}` });
  } else {
    return res.status(404).json({ success: false, message: "ESP not connected" });
  }
});

server.listen(port, () => {
  console.log(`App is running at port ${port}`);
});
