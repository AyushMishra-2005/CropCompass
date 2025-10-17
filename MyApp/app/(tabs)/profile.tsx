import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useAuth } from "../../context/AuthProvider";

const Profile = () => {
  const { authUser, logout } = useAuth();

  const user = authUser?.user || {
    name: "Guest User",
    email: "guest@example.com",
    username: "guest123",
    profilePicURL: "https://www.pngall.com/wp-content/uploads/5/Profile-PNG-File.png",
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Header */}
      <View style={styles.headerContainer}>
        <Image
          source={{ uri: user.profilePicURL }}
          style={styles.profileImage}
        />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.username}>@{user.username}</Text>
      </View>

      {/* User Info */}
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Account Details</Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Full Name</Text>
          <Text style={styles.value}>{user.name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user.email}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Username</Text>
          <Text style={styles.value}>{user.username}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity style={styles.editButton}>
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f5f7fa",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "#2e7d32",
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2e7d32",
  },
  username: {
    fontSize: 16,
    color: "#555",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "100%",
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2e7d32",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 10,
  },
  label: {
    fontSize: 15,
    color: "#555",
    fontWeight: "500",
  },
  value: {
    fontSize: 15,
    color: "#111",
    fontWeight: "600",
  },
  editButton: {
    backgroundColor: "#2e7d32",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#d32f2f",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Profile;
