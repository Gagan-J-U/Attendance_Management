const user=require("../models/users");


exports.createTeacher=async(req,res)=>{
  try{
    const{
      name,
      email,
      password,
      phoneNumber,
      teacherInfo
    }=req.body;

    if(!name||!email||!password||!teacherInfo){
      return res.status(400).json({message:"Missing required teacher data"});
    }

    const existingUser=await user.findOne({email});
    if(existingUser){
      return res.status(409).json({message:"Email already exists"});
    }

    const teacher=await user.create({
      name,
      email,
      password,
      phoneNumber,
      role:"teacher",
      teacherInfo
    });

    return res.status(201).json({
      message:"Teacher created successfully",
      teacher
    });
  }
  catch(err){
    console.error("Create teacher error:",err);
    return res.status(500).json({message:"Server error"});
  }
};

exports.getAllTeachers=async(req,res)=>{
  try{
    const teachers=await user.find({role:"teacher",isActive:true}).select("-password");
    return res.status(200).json({teachers});
  }
  catch(err){
    console.error("Get teachers error:",err);
    return res.status(500).json({message:"Server error"});
  }
};

exports.getTeacherById=async(req,res)=>{
  try{
    const teacherId=req.params.id;
    const teacher=await user.findOne({_id:teacherId,role:"teacher",isActive:true}).select("-password");
    if(!teacher){
      return res.status(404).json({message:"Teacher not found"});
    }
    return res.status(200).json({teacher});
  }
  catch(err){
    console.error("Get teacher by ID error:",err);
    return res.status(500).json({message:"Server error"});
  }
};

exports.updateTeacherStatus=async(req,res)=>{
  try{
    const {id}=req.params;
    const {isActive}=req.body;

    const teacher=await user.findOneAndUpdate(
      {_id:id,role:"teacher"},
      {isActive},
      {new:true}
    );

    if(!teacher){
      return res.status(404).json({message:"Teacher not found"});
    }

    return res.status(200).json({
      message:"Teacher status updated successfully",
      teacher
  });
  }
  catch(err){
    console.error("Update teacher status error:",err);
    return res.status(500).json({message:"Server error"});
  }
};

exports.updateFingerprint=async(req,res)=>{
  try{
    const {id}=req.params;
    const {fingerprintData}=req.body;

    if(!fingerprintData){
      return res.status(400).json({message:"Missing fingerprint data"});
    }

    const teacher=await user.findOneAndUpdate(
      {_id:id,role:"teacher"},
      {"teacherInfo.fingerprintData":fingerprintData},
      {new:true}
    );

    if(!teacher){
      return res.status(404).json({message:"Teacher not found"});
    }

    return res.status(200).json({
      message:"Teacher fingerprint updated successfully",
      teacher
    });
  }
  catch(err){
    console.error("Update teacher fingerprint error:",err);
    return res.status(500).json({message:"Server error"});
  }
};

exports.updateTeacherProfile=async(req,res)=>{
  try{
    const {id}=req.params;
    const {name,phoneNumber,teacherInfo}=req.body;

    if(teacherInfo&& teacherInfo.employeeId){
      return res.status(400).json({message:"Cannot update employeeId"});
    }

    const updateData=user.findOneAndUpdate(
      {_id:id,role:"teacher"},
      {name,phoneNumber,teacherInfo},
      {new:true,runValidators:true}
    );

    if(!updateData){
      return res.status(404).json({message:"Teacher not found"});
    }

    return res.status(200).json({message:"Teacher profile updated successfully",updateData});
  }
  catch(err){
    console.error("Update teacher profile error:",err);
    return res.status(500).json({message:"Server error"});
  }
}