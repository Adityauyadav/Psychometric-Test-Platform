import { connect } from "mongoose";

export const connectDB = async () => {
  try {
    // Use the MONGODB_URI environment variable or fallback to the default URI
    const dbURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/psychometric";

    // Connect to MongoDB with specified options
    const conn = await connect(dbURI, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // Uncomment if needed in your version of Mongoose:
      // useCreateIndex: true,
      // useFindAndModify: false,
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
