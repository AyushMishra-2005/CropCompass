import { Server } from 'socket.io'
import http from 'http'
import express from 'express'

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
})

const espClients = {};

const getEspSocketId = (espId) => {
  return espClients[espId];
};


io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("register", (esp_id) => {
    espClients[esp_id] = socket.id;
    console.log(`ESP registered: ${esp_id}`);
  });

  socket.on("disconnect", () => {
    for (let id in espClients) {
      if (espClients[id] === socket.id) {
        delete espClients[id];
        console.log(`ESP disconnected: ${id}`);
        break;
      }
    }
  });
});

export { app, io, server, getEspSocketId }























