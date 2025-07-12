const AppError = require("../utils/errorHandler");

// Express error-handling middleware
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // Default error status and message
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // Handle specific MongoDB validation errors
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors).map((val) => val.message).join(", ");
    }

    // Handle Mongoose duplicate key error (e.g., duplicate email)
    if (err.code === 11000) {
        statusCode = 400;
        message = "Duplicate field value entered!";
    }

    res.status(statusCode).json({
        success: false,
        message,
    });
};

module.exports = errorHandler;
