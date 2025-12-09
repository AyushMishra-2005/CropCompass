import mqtt from 'mqtt';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
dotenv.config();
import axios from 'axios';

const app = express();
app.use(express.json());
app.use(cors({
  origin: "*"
}));

const PORT = process.env.PORT || 8001;
const MQTT_BROKER = "mqtt://broker.hivemq.com"; 
const MQTT_TOPIC_PREFIX = "myESPProject/";


const client = mqtt.connect(MQTT_BROKER);

client.on('connect', () => {
  console.log("Connected to MQTT broker");

  client.subscribe("myESPProject/+/command", { qos: 1 }, (err) => {
    if (!err) console.log("Subscribed to command topics");
    else console.error("Subscription error:", err);
  });

  client.subscribe("myESPProject/+/data", { qos: 1 }, (err) => {
    if (!err) console.log("Subscribed to data topics");
    else console.error("Subscription error:", err);
  });
});



client.on('message', (topic, message) => {
  const msgString = message.toString();
  console.log(`MQTT message received on ${topic}: ${msgString}`);
});

app.post("/sensor-data", async (req, res) => {
  const data = req.body;
  
  if (!data.espId || !data.DHT22_Temp || !data.DHT22_Humidity || !data.DS18B20_Temp) {
    return res.status(400).json({ success: false, message: "Invalid sensor data" });
  }

  res.json({ success: true, message: "Data received" });

  try{
    await axios.post("http://localhost:8000/receive-sensor-data", data);
    console.log("Forwarded data successfully");
  }catch(err){
    console.log("Forward error to server: ", err.message);
  }
});


app.post("/send-command", (req, res) => {
  const { esp_id, command } = req.body;
  if (!esp_id || !command) {
    return res.status(400).json({ success: false, message: "esp_id and command required" });
  }

  const topic = `${MQTT_TOPIC_PREFIX}${esp_id}/command`;

  client.publish(topic, command, { qos: 1 }, (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: `Command "${command}" sent to ${esp_id}`});
  });
});

app.get("/", (req, res) => res.send("MQTT backend running"));


app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port 8001');
});
