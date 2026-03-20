const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function createToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

exports.register = async (req, res) => {
  try {
    const { fullName, email, phone, dob, age, gender, password, role } = req.body;

    if (!fullName || !email || !phone || !dob || !age || !gender || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, phone, dob, age, gender, password, and role are required."
      });
    }

    if (!["admin", "voter"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role selected." });
    }

    if (role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin registration is disabled. Admin users must be added manually."
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      phone,
      dob,
      age,
      gender,
      password: hashedPassword,
      role,
      isVerified: false
    });

    const token = createToken(user);

    res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
        age: user.age,
        gender: user.gender,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to register user." });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: "Email, password, and role are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: "User does not exist." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: "Incorrect password." });
    }

    if (user.role !== role) {
      return res.status(403).json({ success: false, message: "Selected role does not match this account." });
    }

    if (user.role === "voter" && !user.isVerified) {
      return res.status(403).json({ success: false, message: "Voter account is pending admin verification." });
    }

    const token = createToken(user);

    res.json({
      success: true,
      message: "Login successful.",
      token,
      redirectTo: user.role === "admin" ? "/admin-dashboard" : "/elections",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
        age: user.age,
        gender: user.gender,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to login." });
  }
};
