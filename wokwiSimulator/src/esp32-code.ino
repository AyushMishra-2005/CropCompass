#include <WiFi.h>
#include <PubSubClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "DHT.h"
#include <HTTPClient.h>


const char* ssid = "Wokwi-GUEST";
const char* password = "";

const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
String espId = "ESP_01";

WiFiClient espClient;
PubSubClient client(espClient);


const char* serverUrl = "http://10.138.21.41:8001/sensor-data";

#define DHTPIN 4
#define DHTTYPE DHT22
#define ONE_WIRE_BUS 5
#define LED_PIN 2  

DHT dht(DHTPIN, DHTTYPE);
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature ds18b20(&oneWire);


float dhtTemp[10];
float dhtHum[10];
float dsTemp[10];
int readingCount = 0;
bool readingActive = false;
bool dataSent = false;


void callback(char* topic, byte* payload, unsigned int length) {
  String msg = "";
  for (int i = 0; i < length; i++) msg += (char)payload[i];
  Serial.printf("Received on %s: %s\n", topic, msg.c_str());

  if (msg == "on" && !readingActive) {
    readingActive = true;
    readingCount = 0;
    dataSent = false;  
    digitalWrite(LED_PIN, HIGH);
    Serial.println("Reading started...");
  } else if (msg == "off") {
    readingActive = false;
    digitalWrite(LED_PIN, LOW);
    Serial.println("Reading stopped manually.");
  }
}


void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    if (client.connect(espId.c_str())) {
      Serial.println("Connected!");
      String topic = "myESPProject/" + espId + "/command";
      client.subscribe(topic.c_str());
      Serial.println("Subscribed to topic: " + topic);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" retry in 5s");
      delay(5000);
    }
  }
}



void sendDataHTTP() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, cannot send data");
    return;
  }

  String json = "{";
  json += "\"espId\":\"" + espId + "\",";


  json += "\"DHT22_Temp\":[";
  for (int i = 0; i < 10; i++) {
    json += String(dhtTemp[i]);
    if (i < 9) json += ",";
  }
  json += "],";


  json += "\"DHT22_Humidity\":[";
  for (int i = 0; i < 10; i++) {
    json += String(dhtHum[i]);
    if (i < 9) json += ",";
  }
  json += "],";


  json += "\"DS18B20_Temp\":[";
  for (int i = 0; i < 10; i++) {
    json += String(dsTemp[i]);
    if (i < 9) json += ",";
  }
  json += "]";

  json += "}";

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  int httpResponseCode = http.POST(json);

  if (httpResponseCode > 0) {
    Serial.printf("Data sent successfully. Response code: %d\n", httpResponseCode);
  } else {
    Serial.printf("Failed to send data. Error: %s\n", http.errorToString(httpResponseCode).c_str());
  }

  http.end();
}


void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  dht.begin();
  ds18b20.begin();

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}


void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  if (readingActive && readingCount < 10) {
    float dhtTempVal = NAN;
    float dhtHumVal = NAN;


    for (int retry = 0; retry < 5 && (isnan(dhtTempVal) || isnan(dhtHumVal)); retry++) {
      dhtTempVal = dht.readTemperature();
      dhtHumVal = dht.readHumidity();
      if (!isnan(dhtTempVal) && !isnan(dhtHumVal)) break;
      delay(1000);
    }

    ds18b20.requestTemperatures();
    delay(750);
    float dsTempVal = ds18b20.getTempCByIndex(0);

    if (!isnan(dhtTempVal) && !isnan(dhtHumVal) && dsTempVal != DEVICE_DISCONNECTED_C) {
      dhtTemp[readingCount] = dhtTempVal;
      dhtHum[readingCount] = dhtHumVal;
      dsTemp[readingCount] = dsTempVal;

      Serial.printf("Reading %d - DHT22: %.2f°C / %.2f%% | DS18B20: %.2f°C\n",
                    readingCount + 1, dhtTempVal, dhtHumVal, dsTempVal);
      readingCount++;
    } else {
      Serial.println("Sensor read error, skipping...");
    }

    delay(2000);
  }


  if (readingCount >= 10 && !dataSent) {
    readingActive = false;
    digitalWrite(LED_PIN, LOW);
    Serial.println("Reading complete. Sending data via HTTP POST...");
    sendDataHTTP();
    dataSent = true;
  }
}
