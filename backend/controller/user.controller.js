import User from '../models/user.model.js'
import bcrypt from 'bcrypt'
import createToken from '../jwt/generateToken.js'
import { getTransporter } from '../config/nodemailer.config.js'
import StoreOTP from '../models/otp.model.js'

const transporter = getTransporter()

export const signup = async (req, res) => {
  try {
    let { username, name, email, password, confirmpassword, profilePicURL, withGoogle } = req.body

    if (!withGoogle && password !== confirmpassword) {
      return res.status(400).json({ message: 'Passwords do not match' })
    }

    if (!username || !name || !email || !profilePicURL) {
      return res.status(400).json({ message: 'Please provide valid data' })
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] })
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email or username' })
    }

    let newUser

    if (!withGoogle) {
      const hash = await bcrypt.hash(password, 10)
      newUser = new User({
        username,
        name,
        email,
        password: hash,
        profilePicURL,
      })
    } else {
      newUser = new User({
        username,
        name,
        email,
        profilePicURL,
        signupWithGoogle: true,
      })
    }

    await newUser.save()
    console.log('User saved successfully!')

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: 'Welcome to AIspire',
      text: `Hi ${name},

      Welcome to AIspire — we're thrilled to have you on board!

      You’ve just joined a community passionate about using AI to achieve more, think smarter, and build the future.

      Here's what you can do next:
      🔍 Explore your dashboard to get familiar with the tools.
      🎯 Set up your profile to personalize your experience.
      📘 Check out our getting started guide to make the most of AIspire.

      If you have any questions, we're always here — just hit reply or visit our Help Center.

      Warm regards,  
      The AIspire Team  
      www.aispire.com | support@aispire.com`,
    }

    await transporter.sendMail(mailOptions)

    const token = createToken(newUser._id)

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        username: newUser.username,
        profilePicURL: newUser.profilePicURL,
      },
      token, 
    })
  } catch (err) {
    console.log('Error in signup:', err)
    res.status(500).json({ message: 'Server error' })
  }
}


export const login = async (req, res) => {
  try {
    const { email, password, withGoogle } = req.body

    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: 'User not found' })

    if (!user.active)
      return res.status(403).json({ message: 'Account deleted! Cannot login!' })

    if (!withGoogle) {
      const validPass = await bcrypt.compare(password, user.password)
      if (!validPass) return res.status(400).json({ message: 'Wrong password' })
    }

    const token = createToken(user._id)

    res.status(200).json({
      message: 'User logged in successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        profilePicURL: user.profilePicURL,
        mobileNumber: user.mobileNumber,
      },
      token,
    })
  } catch (err) {
    console.log('Error in login:', err)
    res.status(500).json({ message: 'Server error' })
  }
}


export const logout = async (req, res) => {
  try {
    return res.status(200).json({ message: 'User logged out successfully (client should delete token)' })
  } catch (err) {
    console.log('Logout error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}


export const sendOtp = async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ message: 'Please provide a valid email' })

  try {
    await StoreOTP.findOneAndDelete({ email })

    const otp = String(Math.floor(100000 + Math.random() * 900000))

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: 'AIspire Account Verification OTP',
      text: `Your OTP is ${otp}. Verify your email ID using this OTP. It is valid for 24 hours.`,
    }

    const otpData = new StoreOTP({
      email,
      verifyOtp: otp,
      verifyOtpExpireAt: Date.now() + 24 * 60 * 60 * 1000,
    })

    await otpData.save()
    await transporter.sendMail(mailOptions)

    res.status(200).json({ message: 'OTP sent successfully' })
  } catch (err) {
    console.log('Error in sendOtp:', err)
    res.status(500).json({ message: 'Failed to send OTP' })
  }
}

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body
  if (!email || !otp)
    return res.status(400).json({ message: 'Please provide a valid email and OTP' })

  try {
    const data = await StoreOTP.findOne({ email })
    if (!data) return res.status(404).json({ message: 'Email not found' })

    if (data.verifyOtpExpireAt < Date.now()) {
      await StoreOTP.findOneAndDelete({ email })
      return res.status(400).json({ message: 'Your OTP has expired!' })
    }

    const valid = otp === data.verifyOtp
    return res.status(200).json({ message: 'OTP checked', valid })
  } catch (err) {
    console.log('Error in verifyOtp:', err)
    res.status(500).json({ message: 'Failed to verify OTP' })
  }
}

export const updateMobile = async (req, res) => {
  const userId = req.user._id
  const { mobileNumber } = req.body

  try {
    if (!mobileNumber)
      return res.status(400).json({ message: 'Please provide a mobile number!' })

    const mobileRegex = /^[0-9]{10}$/
    if (!mobileRegex.test(mobileNumber))
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number.' })

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { mobileNumber },
      { new: true }
    )

    if (!updatedUser) return res.status(404).json({ message: 'User not found.' })

    res.status(200).json({
      message: 'Mobile number updated successfully!',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        username: updatedUser.username,
        profilePicURL: updatedUser.profilePicURL,
        mobileNumber: updatedUser.mobileNumber,
      },
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Server error.' })
  }
}


export const deleteMobile = async (req, res) => {
  const userId = req.user._id
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { mobileNumber: '' },
      { new: true }
    )

    if (!updatedUser) return res.status(404).json({ message: 'User not found.' })

    res.status(200).json({
      message: 'Mobile number deleted!',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        username: updatedUser.username,
        profilePicURL: updatedUser.profilePicURL,
        mobileNumber: updatedUser.mobileNumber,
      },
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Server error.' })
  }
}
