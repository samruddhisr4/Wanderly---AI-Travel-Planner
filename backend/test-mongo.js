const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: __dirname + "/.env" });

// Test MongoDB connection
const testConnection = async () => {
  try {
    console.log("Testing MongoDB connection...");
    console.log("Connection string:", process.env.MONGODB_URI);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully!");

    // Test creating a simple document
    const testSchema = new mongoose.Schema({ test: String });
    const TestModel = mongoose.model("Test", testSchema);

    const testDoc = new TestModel({ test: "Connection test" });
    await testDoc.save();
    console.log("✅ Test document saved successfully!");

    await mongoose.connection.close();
    console.log("✅ Connection closed");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.error("Error details:", error);
  }
};

testConnection();
