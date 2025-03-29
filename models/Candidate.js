const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    hasVoted: { type: Boolean, default: false },
    useralso:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
});

module.exports.candidateSchema = mongoose.model("CandidateSchema" , candidateSchema)