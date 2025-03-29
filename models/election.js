const mongoose = require("mongoose");

const electionSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        electionType: { type: String, enum: ["Institutional", "Club"], required: true },
        candidates: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        ApprovedCandidates: [
            {
                userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                votes: { type: Number, default: 0 }, // Track candidate votes
            },
        ],
        eligibleVoters: {
            department: { type: String }, // e.g., "Computer"
            class: { type: String }, // e.g., "Computer"
            division: { type: String }, // e.g., "B"
            clubName: { type: String }, // e.g., "Coding Club"
        },
        resultDeclared: { type: Boolean, default: false },
        winner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        voters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Track who has voted
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },
        status: {
            type: String,
            enum: ["Upcoming", "Ongoing", "Completed"],
            default: "Upcoming",
        },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

// Middleware to auto-update status and resultDeclared based on time
electionSchema.pre("save", function (next) {
    const now = new Date();

    if (now < this.startTime) {
        this.status = "Upcoming";
    } else if (now >= this.startTime && now <= this.endTime) {
        this.status = "Ongoing";
    } else {
        this.status = "Completed";
        this.resultDeclared = true;
    }
    next();
});

// Function to update status dynamically
electionSchema.methods.updateStatus = function () {
    const now = new Date();

    if (now < this.startTime) return "Upcoming";
    if (now >= this.startTime && now <= this.endTime) return "Ongoing";
    return "Completed";
};

const Election = mongoose.model("Election", electionSchema);
module.exports = Election;
