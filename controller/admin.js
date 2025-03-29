const Admin = require('../models/admin');
const User = require('../models/User');
const Election = require('../models/election');

module.exports.postProfile = async (req,res)=>{
    const {passkey , number , department} = req.body;
    let newAdmin = new Admin({passkey , mobile:number , department})
    await newAdmin.save();
    let email=req.user.email;
    await User.findOneAndUpdate({email}, {info:newAdmin._id})
    res.redirect(`/login/${req.user._id}/profile`)
};

module.exports.adminProfileEdit = async (req,res)=>{
    let user = await User.findById(req.user._id).populate("info");
    res.render("edit_admin_profile.ejs" , {user})
};
module.exports.putProfile = async (req,res)=>{
    let data = req.body;
    // res.send(data);
    await User.findByIdAndUpdate(req.user._id,{name:data.name})
    await Admin.findByIdAndUpdate(req.user.info,{passkey:data.passkey,mobile:data.number,department:data.department})
    res.redirect(`/login/${req.user._id}/profile`)
};
module.exports.getCreateElection = async(req,res)=>{
    let user = await User.findById(req.params.id).populate("info");
    res.render("createElection.ejs" , {user})
};
module.exports.postCreateElection = async (req,res)=>{
    let data = req.body;
    // res.send(data);
    let id = req.params.id;
    let newElection = new Election({title:data.title,description:data.description,electionType:data.electionType,eligibleVoters:data.eligibleVoters,startTime:data.startTime,endTime:data.endTime,createdBy:req.user._id});
    await newElection.save();
    res.redirect(`/login/${id}/home`)
};
module.exports.editElection = async (req,res)=>{
    let id = req.params.id;
    let user = await User.findById(id);
    let eleId = req.params.eleId;
    let election = await Election.findById(eleId);
    res.render('edit_election' , {election,user})
};
module.exports.putEditElection = async (req,res)=>{
    let id = req.params.id;
    let eleId = req.params.eleId;
    let data = req.body;
    let user = await User.findById(id);
    let election = await Election.findByIdAndUpdate(eleId , data);
    req.flash('success' , 'Updated successfully!')
    res.redirect(`/login/${id}/home`); 
}
module.exports.deleteElection = async (req,res)=>{
    let id = req.params.id;
    let eleId = req.params.eleId;
    let election = await Election.findByIdAndDelete(eleId);
    req.flash('success' , 'Election deleted successfully!')
    res.redirect(`/login/${id}/home`); 
}
module.exports.getApproveCandidates = async (req,res)=>{
    let user = await User.findById(req.params.id);
    let eleId = req.params.eleId;
    let election = await Election.findById(eleId).populate({path: 'candidates',populate: {path: 'info'}});
    let candidates = election.candidates;
    console.log(candidates[0]);
    
    res.render('approveCandidates.ejs' , {election , candidates ,user});
}
module.exports.postApprove = async (req, res) => {
    try {
        let user = await User.findById(req.params.adminId);
        let voter = await User.findById(req.params.id);
        let election = await Election.findById(req.params.eleId);

        if (!voter || !election) {
            req.flash('error' , 'User or Election not found');
            return res.redirect(`/login/admin/${user._id}/${election._id}/candidate`);
        }

        // Remove the candidate from the `candidates` array
        election.candidates = election.candidates.filter(candidateId => candidateId.toString() !== voter._id.toString());

        // Check if user is already in `ApprovedCandidates`, if not then add
        if (!election.ApprovedCandidates.includes(voter._id.toString())) {
            election.ApprovedCandidates.push({userId:voter._id});
        }

        await election.save();
        req.flash('success' , "Candidate Approved successfully!");
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
            req.flash('error' , 'User or Election not found')
            return res.redirect(`/login/admin/${user._id}/${election._id}/candidate`);
        }

        // Remove election ID from user's `isCandidate` array
        voter.isCandidate = voter.isCandidate.filter(eleId => eleId.toString() !== election._id.toString());

        // Remove user ID from election's `candidates` array
        election.candidates = election.candidates.filter(candidateId => candidateId.toString() !== voter._id.toString());
        election.ApprovedCandidates = election.ApprovedCandidates.filter(approvedId => approvedId.toString() !== voter._id.toString());

        await voter.save();
        await election.save();
        req.flash('success' , "Candidate rejected successfully!");
        res.redirect(`/login/admin/${user._id}/${election._id}/candidate`);
    } catch (error) {
        console.error(error);
        req.flash('error' , "Server error");
        res.status(500).json({ success: false, message: "Server error" });
    }
};


