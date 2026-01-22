const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Connect using the local URL from your .env file
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("✅ Local MongoDB Connected via Compass!");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1); // Exit if connection fails
  }
};

module.exports = connectDB;