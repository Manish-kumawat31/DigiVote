const Admin = require('../models/admin');
const User = require('../models/User');
const Election = require('../models/election');

module.exports.postProfile = async (req, res) => {
    try {
        const { passkey, number, department } = req.body;

        // Input validation
        if (!passkey || !number || !department) {
            return res.status(400).send("All fields (passkey, number, department) are required.");
        }

        // Check if req.user and req.user.email exist
        if (!req.user || !req.user.email || !req.user._id) {
            return res.status(401).send("User not authenticated.");
        }

        let newAdmin = new Admin({ passkey, mobile: number, department });
        await newAdmin.save();

        let email = req.user.email;
        await User.findOneAndUpdate({ email }, { info: newAdmin._id });

        res.redirect(`/login/${req.user._id}/profile`);
    } catch (err) {
        console.error("Error in postProfile:", err);
        res.status(500).send("Something went wrong while submitting profile.");
    }
};



module.exports.adminProfileEdit = async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.user || !req.user._id) {
            return res.status(401).send("User not authenticated.");
        }

        let user = await User.findById(req.user._id).populate("info");

        if (!user) {
            return res.status(404).send("User not found.");
        }

        res.render("edit_admin_profile.ejs", { user });
    } catch (err) {
        console.error("Error in adminProfileEdit:", err);
        res.status(500).send("Something went wrong while loading the profile edit page.");
    }
};


module.exports.putProfile = async (req, res) => {
    try {
        let data = req.body;

        // Check for required fields
        if (!data.name || !data.passkey || !data.number || !data.department) {
            return res.status(400).send("All fields (name, passkey, number, department) are required.");
        }

        // Check if user is authenticated
        if (!req.user || !req.user._id || !req.user.info) {
            return res.status(401).send("User not authenticated.");
        }

        await User.findByIdAndUpdate(req.user._id, { name: data.name });
        await Admin.findByIdAndUpdate(req.user.info, {
            passkey: data.passkey,
            mobile: data.number,
            department: data.department
        });

        res.redirect(`/login/${req.user._id}/profile`);
    } catch (err) {
        console.error("Error in putProfile:", err);
        res.status(500).send("Something went wrong while updating the profile.");
    }
};



module.exports.getCreateElection = async (req, res) => {
    try {
        // Check if ID is provided in params
        if (!req.params.id) {
            return res.status(400).send("User ID is required.");
        }

        let user = await User.findById(req.params.id).populate("info");

        if (!user) {
            return res.status(404).send("User not found.");
        }

        res.render("createElection.ejs", { user });
    } catch (err) {
        console.error("Error in getCreateElection:", err);
        res.status(500).send("Something went wrong while loading the election creation page.");
    }
};



module.exports.postCreateElection = async (req, res) => {
    try {
        let data = req.body;
        let id = req.params.id;

        // Validate required fields
        if (
            !data.title ||
            !data.description ||
            !data.electionType ||
            !data.eligibleVoters ||
            !data.startTime ||
            !data.endTime
        ) {
            return res.status(400).send("All election fields are required.");
        }

        // Check if user is authenticated
        if (!req.user || !req.user._id) {
            return res.status(401).send("User not authenticated.");
        }

        if (!id) {
            return res.status(400).send("User ID parameter is missing.");
        }

        let newElection = new Election({
            title: data.title,
            description: data.description,
            electionType: data.electionType,
            eligibleVoters: data.eligibleVoters,
            startTime: data.startTime,
            endTime: data.endTime,
            createdBy: req.user._id
        });

        await newElection.save();

        res.redirect(`/login/${id}/home`);
    } catch (err) {
        console.error("Error in postCreateElection:", err);
        res.status(500).send("Something went wrong while creating the election.");
    }
};


module.exports.editElection = async (req, res) => {
    try {
        let id = req.params.id;
        let eleId = req.params.eleId;

        // Validate presence of required parameters
        if (!id || !eleId) {
            return res.status(400).send("User ID and Election ID are required.");
        }

        let user = await User.findById(id);
        if (!user) {
            return res.status(404).send("User not found.");
        }

        let election = await Election.findById(eleId);
        if (!election) {
            return res.status(404).send("Election not found.");
        }

        res.render('edit_election', { election, user });
    } catch (err) {
        console.error("Error in editElection:", err);
        res.status(500).send("Something went wrong while loading the election edit page.");
    }
};


module.exports.putEditElection = async (req, res) => {
    try {
        let id = req.params.id;
        let eleId = req.params.eleId;
        let data = req.body;

        if (!id || !eleId) {
            return res.status(400).send("User ID and Election ID are required.");
        }

        if (!data || Object.keys(data).length === 0) {
            return res.status(400).send("Update data is required.");
        }

        let user = await User.findById(id);
        if (!user) {
            return res.status(404).send("User not found.");
        }

        let election = await Election.findById(eleId);
        if (!election) {
            return res.status(404).send("Election not found.");
        }

        await Election.findByIdAndUpdate(eleId, data);

        req.flash('success', 'Updated successfully!');
        res.redirect(`/login/${id}/home`);
    } catch (err) {
        console.error("Error in putEditElection:", err);
        res.status(500).send("Something went wrong while updating the election.");
    }
};


module.exports.deleteElection = async (req, res) => {
    try {
        let id = req.params.id;
        let eleId = req.params.eleId;

        if (!id || !eleId) {
            return res.status(400).send("User ID and Election ID are required.");
        }

        let election = await Election.findById(eleId);
        if (!election) {
            return res.status(404).send("Election not found.");
        }

        await Election.findByIdAndDelete(eleId);

        req.flash('success', 'Election deleted successfully!');
        res.redirect(`/login/${id}/home`);
    } catch (err) {
        console.error("Error in deleteElection:", err);
        res.status(500).send("Something went wrong while deleting the election.");
    }
};


module.exports.getApproveCandidates = async (req, res) => {
    try {
        let userId = req.params.id;
        let eleId = req.params.eleId;

        if (!userId || !eleId) {
            return res.status(400).send("User ID and Election ID are required.");
        }

        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).send("User not found.");
        }

        let election = await Election.findById(eleId).populate({ path: 'candidates', populate: { path: 'info' } });
        if (!election) {
            return res.status(404).send("Election not found.");
        }

        let candidates = election.candidates;

        res.render('approveCandidates.ejs', { election, candidates, user });
    } catch (err) {
        console.error("Error in getApproveCandidates:", err);
        res.status(500).send("Something went wrong while loading candidates for approval.");
    }
};


module.exports.postApprove = async (req, res) => {
    try {
        let user = await User.findById(req.params.adminId);
        let voter = await User.findById(req.params.id);
        let election = await Election.findById(req.params.eleId);

        if (!voter || !election) {
            req.flash('error', 'User or Election not found');

            // Check if user and election exist before redirect
            const redirectUserId = user ? user._id : '';
            const redirectElectionId = election ? election._id : '';

            return res.redirect(`/login/admin/${redirectUserId}/${redirectElectionId}/candidate`);
        }

        // Remove the candidate from the `candidates` array
        election.candidates = election.candidates.filter(
            candidateId => candidateId.toString() !== voter._id.toString()
        );

        // Add to ApprovedCandidates if not already present
        if (!election.ApprovedCandidates.some(c => c.userId.toString() === voter._id.toString())) {
            election.ApprovedCandidates.push({ userId: voter._id });
        }

        await election.save();

        req.flash('success', "Candidate Approved successfully!");
        res.redirect(`/login/admin/${user._id}/${election._id}/candidate`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


module.exports.postReject = async (req, res) => {
    try {
        let user = await User.findById(req.params.adminId);
        let voter = await User.findById(req.params.id);
        let election = await Election.findById(req.params.eleId);

        if (!voter || !election) {
            req.flash('error', 'User or Election not found');

            const redirectUserId = user ? user._id : '';
            const redirectElectionId = election ? election._id : '';

            return res.redirect(`/login/admin/${redirectUserId}/${redirectElectionId}/candidate`);
        }

        // Remove election ID from user's `isCandidate` array
        voter.isCandidate = voter.isCandidate.filter(
            eleId => eleId.toString() !== election._id.toString()
        );

        // Remove user ID from election's `candidates` array
        election.candidates = election.candidates.filter(
            candidateId => candidateId.toString() !== voter._id.toString()
        );

        // Adjust this if ApprovedCandidates stores objects, e.g. { userId: ObjectId }
        // Otherwise, if it stores just user IDs, this is fine:
        if (election.ApprovedCandidates && election.ApprovedCandidates.length > 0) {
            election.ApprovedCandidates = election.ApprovedCandidates.filter(approved => {
                // If ApprovedCandidates is array of objects with userId:
                if (approved.userId) {
                    return approved.userId.toString() !== voter._id.toString();
                }
                // If just array of IDs:
                return approved.toString() !== voter._id.toString();
            });
        }

        await voter.save();
        await election.save();

        req.flash('success', "Candidate rejected successfully!");
        res.redirect(`/login/admin/${user._id}/${election._id}/candidate`);
    } catch (error) {
        console.error(error);
        req.flash('error', "Server error");
        res.status(500).json({ success: false, message: "Server error" });
    }
};



