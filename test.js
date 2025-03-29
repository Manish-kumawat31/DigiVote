const User = require("./models/User.js");
const Election = require("./models/election.js");
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/DVS", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

const updateUser = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) return console.error(`User ${userId} not found!`);

        console.log("Before Update:", user);
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { isCandidate: [] } },
            { new: true, runValidators: true }
        );
        console.log("Updated User:", updatedUser);
    } catch (error) {
        console.error(`Error updating user ${userId}:`, error.message);
    }
};

const updateElection = async (electionId) => {
    try {
        const election = await Election.findById(electionId);
        if (!election) return console.error(`Election ${electionId} not found!`);

        console.log("Before Update:", election);
        const updatedElection = await Election.findByIdAndUpdate(
            electionId,
            { $set: { ApprovedCandidates: [] } },
            { new: true, runValidators: true }
        );
        console.log("Updated Election:", updatedElection);
    } catch (error) {
        console.error(`Error updating election ${electionId}:`, error.message);
    }
};

// Run updates concurrently
Promise.all([
    updateUser("67b01cc96e303a5c98d98a46"),
    updateUser("67b01cd46e303a5c98d98a4b"),
    updateUser("67b54497098c36fe7e09140f"),
    updateElection("67b16853a059aab78a1cd799"),
    updateElection("67b16867a059aab78a1cd7a1"),
    updateElection("67b1687aa059aab78a1cd7a9"),
    updateElection("67c0009593b13b54cbb88d79"),
    updateElection("67c1e60cd6d9d51cbe2b87f8")
]).then(() => {
    console.log("All updates completed.");
    mongoose.connection.close(); // Close connection after all updates
}).catch(err => console.error("Error in updates:", err));
