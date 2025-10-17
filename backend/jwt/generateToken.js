import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY

const createToken = (userId) => {
  try {
    const token = jwt.sign({ userId }, JWT_SECRET_KEY, { expiresIn: '1d' })
    return token
  } catch (err) {
    console.error("JWT Error:", err)
    return null
  }
}

export default createToken
