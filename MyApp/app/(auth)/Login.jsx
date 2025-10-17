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
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../src/context/AuthProvider';
import { Link, useRouter } from 'expo-router';
import server from '../../envirnoment';

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const { setAuthUser } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    otp: ['', '', '', '', '', ''],
    password: ''
  });
  const [errors, setErrors] = useState({
    email: false,
    otp: false,
    password: false
  });
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const router = useRouter();
  const otpRefs = useRef([]);

  // Initialize refs for OTP inputs
  React.useEffect(() => {
    otpRefs.current = [...Array(6)].map((_, i) => otpRefs.current[i] || React.createRef());
  }, []);

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

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) value = value.slice(0, 1);

    const newOtp = [...formData.otp];
    newOtp[index] = value;
    setFormData(prev => ({
      ...prev,
      otp: newOtp
    }));

    if (value && index < 5 && otpRefs.current[index + 1]?.current) {
      otpRefs.current[index + 1].current.focus();
    }
  };

  const handleOtpKeyPress = (index, e) => {
    if (e.nativeEvent.key === 'Backspace' && !formData.otp[index] && index > 0) {
      otpRefs.current[index - 1]?.current?.focus();
    }
  };

  const handleSendOtp = async () => {
    if (!formData.email) {
      setErrors(prev => ({ ...prev, email: true }));
      Alert.alert('Error', 'Email is required');
      return;
    }
    
    setIsSendingOtp(true);
    
    try {
      const { data } = await axios.post(
        `${server}/user/sendOTP`,
        { email: formData.email },
        { withCredentials: true }
      );

      if (data) {
        Alert.alert('Success', 'OTP sent successfully');
      }
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to send OTP!');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!formData.email) {
      setErrors(prev => ({ ...prev, email: true }));
      return false;
    }

    const otpValue = formData.otp.join('');
    if (!otpValue) {
      setErrors(prev => ({ ...prev, otp: true }));
      return false;
    }

    try {
      const { data } = await axios.post(
        `${server}/user/verifyOTP`,
        {
          email: formData.email,
          otp: otpValue
        },
        { withCredentials: true }
      );

      if (!data.valid) {
        Alert.alert('Error', 'Wrong OTP!');
      }
      return data.valid;
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'OTP verification failed!');
      return false;
    }
  };

  // Temporary: Remove Google login or implement it properly later
  const handleGoogleLogin = () => {
    Alert.alert('Info', 'Google login will be implemented soon');
    // You can implement Expo AuthSession here later
  };

  const validateForm = () => {
    const otpValue = formData.otp.join('');
    const newErrors = {
      email: !formData.email,
      otp: !otpValue,
      password: !formData.password
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setIsLoggingIn(true);

    try {
      const valid = await handleVerifyOtp();

      if (!valid) {
        setIsLoggingIn(false);
        return;
      }

      const userInfo = {
        email: formData.email,
        password: formData.password,
        otp: formData.otp.join(''),
        withGoogle: false,
      };

      await axios.post(`${server}/user/login`, userInfo, {
        withCredentials: true,
      })
        .then((response) => {
          if (response.data) {
            Alert.alert('Success', 'User logged in successfully!');
            // Store user data
            // setAuthUser(response.data);
          } else {
            Alert.alert('Error', 'Failed to log in!');
            return;
          }
        })
        .catch((err) => {
          console.log("Error in login: ", err);
          Alert.alert('Error', 'Login failed. Please try again.');
        });
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'An error occurred during login.');
    } finally {
      setIsLoggingIn(false);
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
          <Text style={styles.title}>Login to Your Account</Text>
          <Text style={styles.subtitle}>Welcome back to Prepverse.AI</Text>
        </View>

        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
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
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Enter OTP</Text>
            <View style={styles.otpContainer}>
              <View style={styles.otpInputs}>
                {formData.otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={otpRefs.current[index]}
                    style={[
                      styles.otpInput,
                      errors.otp && styles.inputError
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(index, value)}
                    onKeyPress={(e) => handleOtpKeyPress(index, e)}
                    keyboardType="number-pad"
                    maxLength={1}
                  />
                ))}
              </View>
              <TouchableOpacity
                style={[
                  styles.otpButton,
                  isSendingOtp && styles.buttonDisabled
                ]}
                onPress={handleSendOtp}
                disabled={isSendingOtp}
              >
                {isSendingOtp ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.otpButtonText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            </View>
            {errors.otp && (
              <Text style={styles.errorText}>OTP is required</Text>
            )}
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
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

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoggingIn && styles.buttonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Login Button - Temporarily disabled */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
          >
            <Text style={styles.googleButtonText}>Sign in with Google (Coming Soon)</Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>
              Don't have an account?{' '}
            </Text>
            <Link href="/SignUp" asChild>
              <TouchableOpacity>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
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
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
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
  otpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  otpInputs: {
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
  loginButton: {
    backgroundColor: '#2e7d32',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
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
    marginVertical: 20,
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
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: '#666',
    fontSize: 14,
  },
  signupLink: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default Login;