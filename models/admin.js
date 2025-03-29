const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
    // user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Linked User model
    mobile: { type: String, required: true , unique: true}, // Admin's contact number
    department: { type: String, required: true }, // Admin's department
    passkey: { type: String, required: true }, // Unique passkey for admin authentication
    // createdElections: [{ type: mongoose.Schema.Types.ObjectId, ref: "Election" }], // Elections managed by the admin
});

module.exports = mongoose.model("Admin", adminSchema);
