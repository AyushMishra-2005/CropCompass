import mongoose from "mongoose";
import { Schema } from "mongoose";

const otpSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    verifyOtp: {
      type: String,
      default: ""
    },
    verifyOtpExpireAt: {
      type: Number,
      default: 0
    },
  },
  {
    timestamps: true,
  }
);

const StoreOTP = mongoose.model("StoreOTP", otpSchema);

export default StoreOTP;






















