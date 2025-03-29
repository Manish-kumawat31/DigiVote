const User = require('../models/User');
const Election = require('../models/election');
const Voter = require('../models/voter');


module.exports.home = async(req,res)=>{
    let id  = req.params.id;    
    let user = await User.findById(id).populate("info");
    res.locals.user=user;
    let allElection  = await Election.find();

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
    if (user.role == "Voter") {
        res.render("Voter_home.ejs" , { userElections , otherElections })
    }else if(user.role == "Admin"){
        res.render("Admin_home.ejs" , {allElection})
    }
    
};

module.exports.profile = async (req,res)=>{
    let user = await User.findById(req.params.id).populate("info");
    if (user.role=="Admin") {
        return res.render("admin_profile.ejs" , {user})
    }else{
        return res.render("voter_profile.ejs" , {user})
    }
};

module.exports.postProfile = async (req,res)=>{
    try {
        const id = req.params.id;
        const {age, number, prn , department ,std ,div , clubName } = req.body;
        
        const newVoter = new Voter({
            age,
            mobile: number.trim(),
            PRN:prn,
            department,
            std,
            div,
            clubName
        });
        
        await newVoter.save();
        let email=req.user.email;
        await User.findOneAndUpdate({email}, {info:newVoter._id})
        res.redirect(`/login/${id}/home`)
    } catch (err) {
        console.error("Error saving voter:", err);
        res.status(500).send("Error saving voter information.");
    }
};

module.exports.putProfile = async (req,res)=>{
    let data = req.body;
    await User.findByIdAndUpdate(req.user._id,{name:data.name})
    await Voter.findByIdAndUpdate(req.user.info,{age:data.age,mobile:data.number,PRN:data.prn , department:data.department, std:data.std , div:data.div , clubName:data.clubname})
    res.redirect(`/login/${req.params.id}/home`)
};
module.exports.profileEdit = async (req,res)=>{
    let user = await User.findById(req.params.id).populate("info");
    if (user.role=="Voter") {
        return res.render("edit_voter_profile.ejs" , {user})
    }else{
        return res.render("edit_admin_profile.ejs" , {user})
    }
};
module.exports.postCandidate = async(req,res)=>{
    let electionId = req.params.eleId;
    let election = await Election.findById(electionId);
    let user = await User.findById(req.params.id);
    for (const cand of user.isCandidate) {
        if (cand == electionId) {
            console.log("id present");
            req.flash('error' , 'Already a candidate')
            return res.redirect(`/login/${user._id}/home`); 
        }
    }
    user.isCandidate.push(electionId);
    election.candidates.push(user._id);
    await user.save();
    await election.save();
    req.flash('success' , 'Appelid Successfully! , wait for admin approval')
    res.redirect(`/login/${user._id}/home`);
};
module.exports.votePage = async (req, res) => {
    const user = await User.findById(req.params.id);
    
    let election = await Election.findById(req.params.eleId)
        .populate({
            path: 'ApprovedCandidates.userId', // Populate userId inside ApprovedCandidates
            select: 'name email' // Select only necessary fields
        })
        .exec();

    console.log("Election Data:", JSON.stringify(election, null, 2)); // Debugging

    if (!election) return res.status(404).send("Election not found");
    res.render("votePage", { user, election });
};


module.exports.voteForCandidate = async (req, res) => {
    try {
        const { id, eleId, candidateId } = req.params;

        const user = await User.findById(id);
        // Fetch election and ensure it exists
        const election = await Election.findById(eleId);
        if (!election) {
            req.flash("error", "Election not found.");
            return res.redirect("back");
        }

        // Check if the user has already voted
        if (election.voters.includes(id)) {
            req.flash("error", "You have already voted in this election.");
            return res.redirect("back");
        }

        // Find the candidate
        const candidateIndex = election.ApprovedCandidates.findIndex(c => c._id.toString() === candidateId);
        if (candidateIndex === -1) {
            req.flash("error", "Candidate not found.");
            return res.redirect("back");
        }

        // Increment the vote count for the candidate
        election.ApprovedCandidates[candidateIndex].votes += 1;

        // Mark the user as having voted
        election.voters.push(id);
        user.votedElections.push(election._id);
        // Save the updated election
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
module.exports.resultPage = async (req,res)=>{
    try {
        let election = await Election.findById(req.params.eleId)
        .populate({
            path: 'ApprovedCandidates.userId', // Populate userId inside ApprovedCandidates
            select: 'name email' // Select only necessary fields
        })
        .exec();

        // Check if the result is declared
        const currentTime = new Date();
        election.resultDeclared = currentTime >= new Date(election.endTime);

        // Sort candidates by votes in descending order
        election.ApprovedCandidates.sort((a, b) => b.votes - a.votes);

        // Determine winner
        if (election.resultDeclared) {
            election.winner = election.ApprovedCandidates[0]._id;
        }

        res.render("result", { user: req.user, election });
    } catch (err) {
        console.error(err);
        res.redirect("back");
    }
}
