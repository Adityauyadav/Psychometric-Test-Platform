import { User } from "../models/user.model.js"; // Adjust the path as needed
import { USER_TYPE_REGULAR } from "../models/user.model.js"; // Import the user type constant
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
  try {
    // Extract user data from request body
    const { username, email, firstName, lastName, password, userType } =
      req.body;

    // Check if required fields are provided
    if (!username || !email || !firstName || !lastName || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check if user already exists with the same email or username
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          existingUser.email === email
            ? "Email already registered"
            : "Username already taken",
      });
    }

    // Create a new user
    // Note: Password hashing is handled by the pre-save hook in the User model
    const newUser = new User({
      username,
      email,
      firstName,
      lastName,
      password,
      // If userType is not provided, default to regular user
      userType: userType || USER_TYPE_REGULAR,
    });

    // Save the user to the database
    await newUser.save();

    // Return success response (excluding password)
    const userResponse = newUser.toObject();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: userResponse,
    });
  } catch (error) {
    console.log(error);

    // Handle validation errors from Mongoose
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors,
      });
    }

    // Handle other errors
    return res.status(500).json({
      success: false,
      message: "An error occurred during registration",
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    // Extract credentials from request body
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find the user by email
    const user = await User.findOne({ email });

    // If user doesn't exist
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Verify password using the comparePassword method from the User model
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Create JWT payload
    const payload = {
      userId: user._id,
      email: user.email,
      username: user.username,
      userType: user.userType,
    };

    // Generate JWT token
    // Note: Replace 'your_jwt_secret_key' with your actual secret key
    // It's best to store this in an environment variable
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || "your_jwt_secret_key",
      { expiresIn: "48h" } // Token expires in 24 hours
    );

    // Return success response with token
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "An error occurred during login",
    });
  }
};
