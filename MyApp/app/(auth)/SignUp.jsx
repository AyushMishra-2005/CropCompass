import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../src/context/AuthProvider';
import { Link, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import server from '../../envirnoment';


const OTPInput = ({ value, onChange, error, disabled, onFocus, focusedIndex }) => {
  const inputRefs = useRef([]);

  const focusInput = (index) => {
    if (inputRefs.current[index]) {
      inputRefs.current[index].focus();
    }
  };

  const handleChange = (text, index) => {
    if (!/^\d*$/.test(text)) return;
    
    const newOtp = [...value.split('')];
    
    if (text.length > 1) {
      const pastedDigits = text.split('').slice(0, 6 - index);
      pastedDigits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      const newOtpString = newOtp.join('');
      onChange(newOtpString);
      
      const lastFilledIndex = Math.min(index + pastedDigits.length - 1, 5);
      focusInput(lastFilledIndex);
      return;
    }
    
    newOtp[index] = text;
    const newOtpString = newOtp.join('');
    onChange(newOtpString);

    if (text && index < 5) {
      focusInput(index + 1);
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!value[index] && index > 0) {
        focusInput(index - 1);
      }
    }
  };

  const digits = value.split('');
  while (digits.length < 6) digits.push('');

  return (
    <View style={styles.otpContainer}>
      {digits.map((digit, index) => (
        <TextInput
          ref={(ref) => (inputRefs.current[index] = ref)}
          key={index}
          style={[
            styles.otpInput,
            error && styles.otpInputError,
            focusedIndex === index && styles.otpInputFocused,
            disabled && styles.otpInputDisabled
          ]}
          value={digit}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          keyboardType="number-pad"
          maxLength={index === 0 ? 6 : 1}
          editable={!disabled}
          onFocus={() => onFocus(index)}
          onBlur={() => onFocus(-1)}
        />
      ))}
    </View>
  );
};

function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [profileFile, setProfileFile] = useState(null);
  const { setAuthUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [focusedOtpIndex, setFocusedOtpIndex] = useState(-1);

  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    otp: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({
    name: false,
    username: false,
    email: false,
    otp: false,
    password: false,
    confirmPassword: false
  });

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: false
      }));
    }
  };

  const handleOtpChange = (otpValue) => {
    setFormData(prev => ({
      ...prev,
      otp: otpValue
    }));

    if (errors.otp) {
      setErrors(prev => ({
        ...prev,
        otp: false
      }));
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setProfilePic(asset.uri);
        setProfileFile({
          uri: asset.uri,
          type: asset.type || 'image',
          name: `profile_${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSendOtp = async () => {
    if (!formData.email) {
      setErrors(prev => ({ ...prev, email: true }));
      Alert.alert('Error', 'Please enter your email first');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrors(prev => ({ ...prev, email: true }));
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setSendingOtp(true);
    try {
      const { data } = await axios.post(
        `${server}/user/sendOTP`,
        { email: formData.email },
        { withCredentials: true }
      );

      if (data) {
        setOtpSent(true);
        Alert.alert('Success', 'OTP sent successfully! Check your email.');
      }
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const validateForm = () => {
    const newErrors = {
      name: !formData.name,
      username: !formData.username,
      email: !formData.email,
      otp: !formData.otp || formData.otp.length !== 6,
      password: !formData.password,
      confirmPassword: !formData.confirmPassword || formData.password !== formData.confirmPassword
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleGoogleSignUp = () => {
    Alert.alert('Info', 'Google signup will be implemented soon');
  };

  const handleVerifyOtp = async () => {
    if (!formData.email) {
      setErrors(prev => ({ ...prev, email: true }));
      return false;
    }

    if (!formData.otp || formData.otp.length !== 6) {
      setErrors(prev => ({ ...prev, otp: true }));
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return false;
    }

    try {
      const { data } = await axios.post(
        `${server}/user/verifyOTP`,
        {
          email: formData.email,
          otp: formData.otp
        },
        { withCredentials: true }
      );

      if (!data.valid) {
        Alert.alert('Error', 'Invalid OTP! Please try again.');
      }
      return data.valid;
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'OTP verification failed!');
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      if (!formData.otp || formData.otp.length !== 6) {
        Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      } else {
        Alert.alert('Error', 'Please fill all required fields correctly');
      }
      return;
    }

    setLoading(true);
    const valid = await handleVerifyOtp();

    if (!valid) {
      setLoading(false);
      return;
    }

    let imageURL = "";

    if (profileFile) {
      try {
        const { data } = await axios.get(
          `${server}/getImage`,
          { withCredentials: true }
        );

        const imageFormData = new FormData();
        imageFormData.append("file", {
          uri: profileFile.uri,
          type: profileFile.mimeType || 'image/jpeg',
          name: profileFile.name || `profile_${Date.now()}.jpg`,
        });
        imageFormData.append('api_key', data.apiKey);
        imageFormData.append('timestamp', data.timestamp);
        imageFormData.append('signature', data.signature);

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${data.cloudName}/image/upload`;

        const uploadRes = await axios.post(cloudinaryUrl, imageFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        imageURL = uploadRes.data.secure_url;
      } catch (err) {
        console.log("Image upload error:", err);
      }
    }

    const userInfo = {
      name: formData.name,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      confirmpassword: formData.confirmPassword,
      profilePicURL: imageURL,
      otp: formData.otp,
      withGoogle: false,
    };

    if (!imageURL || imageURL.trim() === "") {
      const name = userInfo.name.trim();
      const encodedName = encodeURIComponent(name);
      imageURL = `https://ui-avatars.com/api/?name=${encodedName}&background=random&color=fff&size=128`;
      userInfo.profilePicURL = imageURL;
    }

    try {
      const response = await axios.post(
        `${server}/user/signup`,
        userInfo,
        { withCredentials: true }
      );

      if (response.data) {
        // Store user data in AsyncStorage (React Native equivalent of localStorage)
        await AsyncStorage.setItem("authUserData", JSON.stringify(response.data));
        setAuthUser(response.data);
        
        Alert.alert('Success', 'SignUp successful! You can now login.');
        router.push('/Login');
      }
    } catch (err) {
      console.log("Error in signup page : ", err);
      if (err.response && err.response.data) {
        Alert.alert('Error', err.response.data.message || "Signup failed. Please try again.");
      } else {
        Alert.alert('Error', "Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Already have an account?{' '}
            <Link href="/Login" style={styles.link}>
              Sign in instead
            </Link>
          </Text>
        </View>

        {/* Profile Picture Upload */}
        <View style={styles.profileContainer}>
          <TouchableOpacity onPress={pickImage}>
            <View style={styles.avatarContainer}>
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.cameraIcon}>📷</Text>
                </View>
              )}
              <View style={styles.cameraButton}>
                <Text style={styles.cameraButtonText}>📷</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {/* Name and Username */}
          <View style={styles.rowContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.name && styles.inputError
                ]}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                value={formData.name}
                onChangeText={(value) => handleChange('name', value)}
              />
              {errors.name && (
                <Text style={styles.errorText}>This field is required</Text>
              )}
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.username && styles.inputError
                ]}
                placeholder="Enter your username"
                placeholderTextColor="#999"
                value={formData.username}
                onChangeText={(value) => handleChange('username', value)}
                autoCapitalize="none"
              />
              {errors.username && (
                <Text style={styles.errorText}>This field is required</Text>
              )}
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[
                styles.input,
                errors.email && styles.inputError
              ]}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && (
              <Text style={styles.errorText}>This field is required</Text>
            )}
          </View>

          {/* OTP Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Enter OTP</Text>
            <Text style={styles.otpDescription}>
              Enter the 6-digit OTP sent to your email
            </Text>

            <View style={styles.otpSection}>
              <OTPInput
                value={formData.otp}
                onChange={handleOtpChange}
                error={errors.otp}
                disabled={!otpSent}
                onFocus={setFocusedOtpIndex}
                focusedIndex={focusedOtpIndex}
              />

              <TouchableOpacity
                style={[
                  styles.otpButton,
                  sendingOtp && styles.buttonDisabled
                ]}
                onPress={handleSendOtp}
                disabled={sendingOtp}
              >
                {sendingOtp ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.otpButtonText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            </View>

            {errors.otp && (
              <Text style={styles.errorText}>Please enter a valid 6-digit OTP</Text>
            )}
          </View>

          {/* Password */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  errors.password && styles.inputError
                ]}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                value={formData.password}
                onChangeText={(value) => handleChange('password', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.visibilityButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.visibilityButtonText}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>This field is required</Text>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  errors.confirmPassword && styles.inputError
                ]}
                placeholder="Confirm your password"
                placeholderTextColor="#999"
                value={formData.confirmPassword}
                onChangeText={(value) => handleChange('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.visibilityButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Text style={styles.visibilityButtonText}>
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={styles.errorText}>
                {formData.password !== formData.confirmPassword
                  ? 'Passwords do not match'
                  : 'This field is required'
                }
              </Text>
            )}
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[
              styles.signUpButton,
              loading && styles.buttonDisabled
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.signUpButtonText}>SIGN UP</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign Up Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignUp}
          >
            <Text style={styles.googleButtonText}>Sign up with Google (Coming Soon)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  link: {
    color: '#2e7d32',
    fontWeight: '500',
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#2e7d32',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2e7d32',
  },
  cameraIcon: {
    fontSize: 30,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2e7d32',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  form: {
    width: '100%',
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  inputWrapper: {
    flex: 1,
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: 4,
  },
  otpDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  otpSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  otpContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  otpInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    minHeight: 50,
  },
  otpInputError: {
    borderColor: '#d32f2f',
  },
  otpInputFocused: {
    borderColor: '#2e7d32',
    borderWidth: 2,
  },
  otpInputDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  otpButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  passwordContainer: {
    position: 'relative',
  },
  visibilityButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  visibilityButtonText: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '500',
  },
  signUpButton: {
    backgroundColor: '#2e7d32',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  googleButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SignUp;