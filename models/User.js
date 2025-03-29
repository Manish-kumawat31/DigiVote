const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    college: { type: String, required: true },
    role: { type: String, enum: ["Voter", "Admin"], required: true },
    isCandidate:[{type:mongoose.Schema.Types.ObjectId , ref:'Election'}],
    info: { type:mongoose.Schema.Types.ObjectId, refPath: 'role'},
    votedElections: [{ type: mongoose.Schema.Types.ObjectId, ref: "Election" }]  // Store elections user has voted in
});

userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

module.exports = mongoose.model("User", userSchema);
