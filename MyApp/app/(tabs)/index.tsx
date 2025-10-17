import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'
import { useAuth } from '../../context/AuthProvider.jsx'

const Index = () => {
  const { authUser } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Index Page</Text>
      <Link href="/Login">Go to Login</Link>

      {authUser ? (
        <View>
          <Text>User logged in:</Text>
          <Text>{JSON.stringify(authUser, null, 2)}</Text>
        </View>
      ) : (
        <Text>No user logged in</Text>
      )}
    </View>
  );
}

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
});
