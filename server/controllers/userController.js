import User from "../models/userModel.js";
import { ErrorHandler } from "../utils/errorHandler.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { sendToken } from "../utils/jwtToken.js";
import { sendEmail } from "../utils/senEmail.js";
import crypto from "crypto";
import {oauth2Client } from "../utils/googleClinet.js"
import axios from "axios";

const registerUser = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;
  let alreadyExist = await User.findOne({ email: email });
  if (alreadyExist) {
    return next(new ErrorHandler("Please Enter Email Or Password", 400));
  }

  const user = await User.create({
    name,
    email,
    password,
  });
  const token = user.generateToken();
  return res.status(201).json({
    success: true,
    message: "User Registered Successfully",
    token: token,
  });
});

const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Please Enter Email and Password", 400));
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid Credentials", 401));
  }
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Credentilas", 401));
  }
  // creating token and saving in cookie
  sendToken(user, 201, res);
});
//Login with google

let googleAuth = asyncHandler(async (req, res, next) => {
  let password= crypto.randomBytes(4).toString('hex')
  
  const code = req.query.code;
  console.log(process.env.GOOGLE_CLIENT_ID);
  
  const googleRes = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(googleRes.tokens);
  const userRes = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes?.tokens?.access_token}`);
  
  const { email, name } = userRes?.data;
  
  // console.log(userRes);
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name,
      email,
      password:password,
    });
  }
  else{
    user.password=password;
    user.save();
  }
  sendToken(user, 201, res);
});
//Logout User
const logout = asyncHandler(async (req, res, next) => {
  return res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
      sameSite: "None",
      secure: true,
    })
    .json({
      success: true,
      message: "Logged Out",
    });
});

//forgot password

const forgetPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorHandler("User not Found!", 404));
  }
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${req.protocol}://mern-bloging-front-8zd9.vercel.app/login/passwordReset/${resetToken}`; //http://localhost:4000/api/v1/

  const message = `Your password reset Link is:- \n\n ${resetPasswordUrl} \n\n if you have not requested this email then please ignore`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Ecommerce password recovery",
      message: message,
    });

    return res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});

//reset password

const resetPassword = asyncHandler(async (req, res, next) => {
  console.log(crypto);

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler("invalid or expired password reset token", 400)
    );
  }
  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new ErrorHandler("Password dose not match comfirm password", 400)
    );
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();
  sendToken(user, 200, res);
});

//get user details

const getUserDetails = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  return res.status(200).json({
    success: true,
    message: "User Details Fetched",
    user,
  });
});

//update user password
const changeUserPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");
  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is incorrect", 400));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(
      new ErrorHandler("New password and confirm password should mathch", 400)
    );
  }

  user.password = req.body.newPassword;
  await user.save();
  sendToken(user, 200, res);
});
const updateUserProfile = asyncHandler(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };

  //we will add clodinary later

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

//get all user

const getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find({ role: "user" }).sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    users,
  });
});

//get single user details
const getSingleUserDetails = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`user dosenot exist with id ${req.params.id}`)
    );
  }

  res.status(200).json({
    success: true,
    user,
  });
});

//update user role --Admin
const updateUserRole = asyncHandler(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  if (!user) {
    return next(
      new ErrorHandler(`User dose'nt exist with id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
  });
});

//delete user
const deleteUser = asyncHandler(async (req, res, next) => {
  console.log(req.params.id);

  //we will remove cloudinary

  const user = await User.findById(req.params.id);
  if (!user) {
    return next(
      new ErrorHandler(`User dose'nt exist with id ${req.params.id}`, 404)
    );
  }
  await User.findByIdAndDelete(req.params.id);

  return res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

// check auth
const checkAuth = asyncHandler(async (req, res, next) => {
  let user = req.user;
  res.status(200).json({
    success: true,
    message: "User Fetched successfully",
    user,
  });
});

const getAllUsersLength = asyncHandler(async (req, res, next) => {
  const users = await User.countDocuments();

  res.status(200).json({
    success: true,
    users,
  });
});

export {
  registerUser,
  loginUser,
  logout,
  forgetPassword,
  resetPassword,
  getUserDetails,
  changeUserPassword,
  updateUserProfile,
  getAllUsers,
  getSingleUserDetails,
  updateUserRole,
  deleteUser,
  checkAuth,
  getAllUsersLength,
  googleAuth,
};
