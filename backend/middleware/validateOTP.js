import StoreOTP from "../models/otp.model.js";

const validateOTP = async (req, res, next) => {
  const { email, otp, withGoogle } = req.body;

  if(withGoogle){
    return next();
  }

  if (!email || !otp) {
    return res.status(500).json({ message: "Please provide a valid email or OTP" });
  }

  try {

    const data = await StoreOTP.findOne({ email });

    let valid = false;

    if (!data) {
      return res.status(200).json({ message: "Email does not found!" });
    }

    if (data.verifyOtpExpireAt < Date.now()) {
      await StoreOTP.findOneAndDelete({ email });
      return res.status(200).json({ message: "Your OTP has been Expired!" });
    }

    if (otp === data.verifyOtp) {
      valid = true;
      next();
    }else{
      return res.status(500).json({ message: "Wrong OTP" });
    }
    

  } catch (err) {
    console.log("error in verifyOtp : ", err);
    return res.status(500).json({ message: "Failed to verify OTP" });
  }
};


export default validateOTP;




















