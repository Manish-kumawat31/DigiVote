const mongoose = require('mongoose');

const voterSchema = new mongoose.Schema({
    age: {
        type: Number,
        required: true,
        min: 18
    },
    mobile: {
        type: String,
        required: true,
        unique: true, // Ensures no duplicate numbers
        match: [/^\d{10}$/, "Please enter a valid 10-digit mobile number"]
    },
    PRN: {
        type: String,
        required: true,
        unique: true // Ensures each PRN is unique
    },
    department: { type: String, required: true },
    std: { type: String, required: true },
    div: { type: String, required: true },
    clubName: { type: String },
});

module.exports = mongoose.model('Voter', voterSchema);