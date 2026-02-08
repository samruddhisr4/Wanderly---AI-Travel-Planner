const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");

dotenv.config({ path: __dirname + "/.env" });

const testConnection = async () => {
  try {
    console.log("Testing MongoDB connection with MongoClient...");
    console.log("Connection string:", process.env.MONGODB_URI);

    const client = new MongoClient(process.env.MONGODB_URI);

    await client.connect();
    console.log("✅ MongoDB connected successfully with MongoClient!");

    // Test database operations
    const db = client.db("travelplanner");
    const collection = db.collection("test");

    // Insert test document
    const result = await collection.insertOne({
      test: "Connection successful",
      timestamp: new Date(),
    });
    console.log("✅ Test document inserted:", result.insertedId);

    // Find test document
    const found = await collection.findOne({ _id: result.insertedId });
    console.log("✅ Test document found:", found);

    await client.close();
    console.log("✅ Connection closed successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    if (error.code) {
      console.error("Error code:", error.code);
    }
    if (error.name) {
      console.error("Error name:", error.name);
    }
  }
};

testConnection();
