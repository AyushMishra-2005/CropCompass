import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import server from '../../envirnoment.js';

const saved = () => {
  const [loading, setLoading] = useState(false);

  const sendCommand = async (command) => {
    setLoading(true);
    const esp_id = "ESP_01";
    try {
      const response = await axios.post(`${server}/testing-esp`, {
        command, // "on" or "off"
        esp_id
      }, {withCredentials: true});
      if (response.status === 200) {
        Alert.alert('Success', `LED turned ${command.toUpperCase()}`);
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to send command');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ESP32 LED Control</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: 'green' }]}
          onPress={() => sendCommand('on')}
          disabled={loading}
        >
          <Text style={styles.buttonText}>ON</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: 'red' }]}
          onPress={() => sendCommand('off')}
          disabled={loading}
        >
          <Text style={styles.buttonText}>OFF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default saved;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 30,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  button: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
