import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const secureRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "User is not authorized" });
    }

    const token = authHeader.split(' ')[1];

    const verified = jwt.verify(token, JWT_SECRET_KEY);
    if (!verified) {
      return res.status(403).json({ message: "Invalid Token" });
    }

    const user = await User.findById(verified.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    req.user = user;
    next();

  } catch (err) {
    console.error("Error in secureRoute:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export default secureRoute;
