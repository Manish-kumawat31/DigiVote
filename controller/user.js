const User = require('../models/User');
const Election = require('../models/election');
const Voter = require('../models/voter');

module.exports.home = async (req, res) => {
    try {
        let id = req.params.id;
        if (!id) return res.status(400).send("User ID required");

        let user = await User.findById(id).populate("info");
        if (!user) return res.status(404).send("User not found");

        res.locals.user = user;
        let allElection = await Election.find();

        const userElections = allElection.filter(election => {
            const isInstitutionalEligible = election.electionType === "Institutional" && (
                (!election.eligibleVoters.department || election.eligibleVoters.department === user.info.department) &&
                (!election.eligibleVoters.class || election.eligibleVoters.class === user.info.std) &&
                (!election.eligibleVoters.division || election.eligibleVoters.division === user.info.div)
            );

            const isClubEligible = election.electionType === "Club" && (
                election.eligibleVoters.clubName === user.info.clubName
            );

            return isInstitutionalEligible || isClubEligible;
        });

        const otherElections = allElection.filter(election => !userElections.includes(election));

        if (user.role === "Voter") {
            res.render("Voter_home.ejs", { userElections, otherElections });
        } else if (user.role === "Admin") {
            res.render("Admin_home.ejs", { allElection });
        } else {
            res.status(403).send("Unauthorized role");
        }
    } catch (error) {
        console.error("Error in home:", error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports.profile = async (req, res) => {
    try {
        let user = await User.findById(req.params.id).populate("info");
        if (!user) return res.status(404).send("User not found");

        if (user.role === "Admin") {
            return res.render("admin_profile.ejs", { user });
        } else {
            return res.render("voter_profile.ejs", { user });
        }
    } catch (error) {
        console.error("Error in profile:", error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports.postProfile = async (req, res) => {
    try {
        const id = req.params.id;
        const { age, number, prn, department, std, div, clubName } = req.body;

        if (!age || !number || !prn || !department || !std || !div) {
            return res.status(400).send("Please fill all required fields.");
        }

        const newVoter = new Voter({
            age,
            mobile: number.trim(),
            PRN: prn,
            department,
            std,
            div,
            clubName
        });

        await newVoter.save();

        let email = req.user.email;
        await User.findOneAndUpdate({ email }, { info: newVoter._id });

        res.redirect(`/login/${id}/home`);
    } catch (err) {
        console.error("Error saving voter:", err);
        res.status(500).send("Error saving voter information.");
    }
};

module.exports.putProfile = async (req, res) => {
    try {
        let data = req.body;
        if (!req.user || !req.user._id || !req.user.info) {
            return res.status(401).send("User not authenticated.");
        }
        await User.findByIdAndUpdate(req.user._id, { name: data.name });
        await Voter.findByIdAndUpdate(req.user.info, {
            age: data.age,
            mobile: data.number,
            PRN: data.prn,
            department: data.department,
            std: data.std,
            div: data.div,
            clubName: data.clubName
        });
        res.redirect(`/login/${req.params.id}/home`);
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).send("Error updating profile.");
    }
};

module.exports.profileEdit = async (req, res) => {
    try {
        let user = await User.findById(req.params.id).populate("info");
        if (!user) return res.status(404).send("User not found");

        if (user.role === "Voter") {
            return res.render("edit_voter_profile.ejs", { user });
        } else {
            return res.render("edit_admin_profile.ejs", { user });
        }
    } catch (error) {
        console.error("Error in profileEdit:", error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports.postCandidate = async (req, res) => {
    try {
        let electionId = req.params.eleId;
        let election = await Election.findById(electionId);
        let user = await User.findById(req.params.id);

        if (!election || !user) {
            req.flash('error', 'User or Election not found');
            return res.redirect(`/login/${req.params.id}/home`);
        }

        for (const cand of user.isCandidate) {
            if (cand.toString() === electionId.toString()) {
                console.log("id present");
                req.flash('error', 'Already a candidate');
                return res.redirect(`/login/${user._id}/home`);
            }
        }

        user.isCandidate.push(electionId);
        election.candidates.push(user._id);

        await user.save();
        await election.save();

        req.flash('success', 'Applied Successfully! Wait for admin approval');
        res.redirect(`/login/${user._id}/home`);
    } catch (error) {
        console.error("Error in postCandidate:", error);
        req.flash('error', 'An error occurred');
        res.redirect("back");
    }
};

module.exports.votePage = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) return res.status(404).send("User not found");

        let election = await Election.findById(req.params.eleId)
            .populate({
                path: 'ApprovedCandidates.userId',
                select: 'name email'
            })
            .exec();

        if (!election) return res.status(404).send("Election not found");

        res.render("votePage", { user, election });
    } catch (error) {
        console.error("Error in votePage:", error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports.voteForCandidate = async (req, res) => {
    try {
        const { id, eleId, candidateId } = req.params;

        const user = await User.findById(id);
        if (!user) {
            req.flash("error", "User not found.");
            return res.redirect("back");
        }

        const election = await Election.findById(eleId);
        if (!election) {
            req.flash("error", "Election not found.");
            return res.redirect("back");
        }

        if (election.voters.includes(id)) {
            req.flash("error", "You have already voted in this election.");
            return res.redirect("back");
        }

        const candidateIndex = election.ApprovedCandidates.findIndex(c => c._id.toString() === candidateId);
        if (candidateIndex === -1) {
            req.flash("error", "Candidate not found.");
            return res.redirect("back");
        }

        election.ApprovedCandidates[candidateIndex].votes += 1;

        election.voters.push(id);
        user.votedElections.push(election._id);

        await election.save();
        await user.save();

        req.flash("success", "Your vote has been recorded successfully!");
        res.redirect(`/login/${id}/home`);
    } catch (error) {
        console.error("Error processing vote:", error);
        req.flash("error", "An error occurred while processing your vote.");
        res.redirect("back");
    }
};

module.exports.resultPage = async (req, res) => {
    try {
        let election = await Election.findById(req.params.eleId)
            .populate({
                path: 'ApprovedCandidates.userId',
                select: 'name email'
            })
            .exec();

        if (!election) return res.status(404).send("Election not found");

        const currentTime = new Date();
        election.resultDeclared = currentTime >= new Date(election.endTime);

        election.ApprovedCandidates.sort((a, b) => b.votes - a.votes);

        if (election.resultDeclared && election.ApprovedCandidates.length > 0) {
            election.winner = election.ApprovedCandidates[0]._id;
        }

        res.render("result", { user: req.user, election });
    } catch (err) {
        console.error("Error in resultPage:", err);
        res.redirect("back");
    }
};

