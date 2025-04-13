import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js"; // Adjust the path as needed

/**
 * Authentication middleware to verify JWT tokens
 *
 * Usage:
 * - For protected routes: router.get("/protected-route", auth, yourController);
 * - For admin-only routes: router.get("/admin-route", auth, isAdmin, yourController);
 */
export const auth = async (req, res, next) => {
  try {
    // Get token from the Authorization header
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Extract the token (remove "Bearer " prefix)
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    try {
      // Verify the token
      // Replace process.env.JWT_SECRET with your actual secret key or env variable
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your_jwt_secret_key"
      );

      // Find the user by ID from the decoded token
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid token. User not found.",
        });
      }

      // Add user info to request object
      req.user = user;

      // Proceed to the next middleware or route handler
      next();
    } catch (error) {
      // Handle token verification errors
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid token.",
        });
      }

      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired.",
        });
      }

      // For any other errors
      throw error;
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

/**
 * Middleware to check if the authenticated user is an admin
 * Must be used after the auth middleware
 */
export const isAdmin = (req, res, next) => {
  // Import the admin user type constant from your User model
  // or define it here if needed
  const USER_TYPE_ADMIN = 1;

  if (!req.user || req.user.userType !== USER_TYPE_ADMIN) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }

  next();
};
