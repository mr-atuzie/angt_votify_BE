const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const Token = require("../models/token");
const sendEmail = require("../utils/sendEmail");
const Election = require("../models/election");
const crypto = require("crypto");

const characters = "0123456789";
// "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateString(length) {
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

// Register a new user
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password || !phone) {
    res.status(400);
    throw new Error("Please enter all required fields");
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error("Email already exists");
  }

  // Hash password before saving
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create a new user
  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
  });

  if (newUser) {
    // Generate JWT token with 1-hour expiration
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      // expiresIn: "5h", // Set JWT token to expire in 1 hour
    });

    // Set the cookie to expire in 1 hour
    // res.cookie("token", token, {
    //   path: "/",
    //   httpOnly: true,
    //   expires: new Date(Date.now() + 5000 * 60 * 60), // 1 hour in milliseconds
    //   sameSite: "none",
    //   secure: true,
    // });

    const subject = "Verify your Email";
    const send_to = newUser.email;
    const send_from = process.env.EMAIL_USER;
    const verificationCode = generateString(6);

    const admin_MsgSubject = "A new user was registered";
    const admin_SendTo = "Idrisoluwabunmi@gmail.com";

    const hashedCode = await bcrypt.hash(verificationCode, salt);

    //find and remove old token
    let oldToken = await Token.findOne({ userId: newUser._id });

    if (oldToken) {
      await oldToken.deleteOne();
    }

    // create new token
    const newToken = await new Token({
      userId: newUser._id,
      token: hashedCode,
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * (60 * 1000),
    }).save();

    const message = `<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
    
    <!-- Header Section -->
    <div style="background-color: #1e40af; padding: 20px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px;">Email Verification</h1>
    </div>
    
    <!-- Content Section -->
    <div style="padding: 20px; color: #333333;">
      <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>${newUser?.name}</strong>,</p>
      <p style="font-size: 16px;">Thank you for signing up! Please use the verification code below to complete your registration. This code will expire in <strong>15 minutes</strong>.</p>
      
      <p style="font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; color: #1e40af;">${verificationCode}</p>
      
      <p style="font-size: 16px; margin-bottom: 20px;">If you didn’t request this email, you can safely ignore it.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{verificationLink}}" style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: #1e40af; text-decoration: none; border-radius: 5px;">Verify Email</a>
      </div>
    </div>
    
    <!-- Footer Section -->
    <div style="background-color: #f4f4f4; padding: 10px; text-align: center; color: #777777;">
      <p style="margin: 0; font-size: 12px;">&copy; 2024 Secure Auth. All rights reserved.</p>
    </div>
  </div>
</body>
`;

    const adminMessage = `<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
    
    <!-- Header Section -->
    <div style="background-color: #1e40af; padding: 20px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px;">New User Registration</h1>
    </div>
    
    <!-- Content Section -->
    <div style="padding: 20px; color: #333333;">
      <p style="font-size: 16px; margin-bottom: 20px;">Hello Admin,</p>
      
      <p style="font-size: 16px; margin-bottom: 20px;">A new user has registered on the app. Here are the details:</p>
      
      <ul style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 20px; padding: 0;">
        <li><strong>Name:</strong> ${newUser?.name}</li>
        <li><strong>Email:</strong> ${newUser?.email}</li>
        <li><strong>Registration Date:</strong> ${new Date().toLocaleString()}</li>
      </ul>
      
      <p style="font-size: 16px;">Please verify the user's information and take any necessary actions.</p>
    </div>
    
    <!-- Footer Section -->
    <div style="background-color: #f4f4f4; padding: 10px; text-align: center; color: #777777;">
      <p style="margin: 0; font-size: 12px;">&copy; 2024 Your App Name. All rights reserved.</p>
    </div>
  </div>
</body>
`;

    try {
      await sendEmail(subject, message, send_to, send_from);
      await sendEmail(admin_MsgSubject, adminMessage, admin_SendTo, send_from);
      res.status(201).json({
        newUser,
        msg: "Email has been sent",
        token,
      });
    } catch (error) {
      res.status(500);
      throw new Error("Email not sent , Please try Again.");
    }
  } else {
    res.status(400);
    throw new Error("unable to register user");
  }
});

//validate email
const verifyEmail = asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    res.status(400);
    throw new Error("Please enter verification code");
  }

  const userToken = await Token.findOne({
    userId: req.user._id,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(404);
    throw new Error("Token has expired.");
  }

  //Validate password
  const checkCode = await bcrypt.compare(code, userToken.token);

  if (!checkCode) {
    res.status(404);
    throw new Error("Invalid Token");
  }

  res.status(200).json("Email verified successfully");
});

// Login user and return a JWT token
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    res.status(400);
    throw new Error("Invalid credentials");
  }

  // Check if password is correct
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    res.status(400);
    throw new Error("Invalid credentials");
  }

  if (user) {
    // Generate JWT token with 1-hour expiration
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      // expiresIn: "5h", // Set JWT token to expire in 1 hour
    });

    // Set the cookie to expire in 1 hour
    // res.cookie("token", token, {
    //   path: "/",
    //   httpOnly: true,
    //   expires: new Date(Date.now() + 5000 * 60 * 60), // 1 hour in milliseconds
    //   sameSite: "none",
    //   secure: true,
    // });

    res.status(201).json({ message: "Login successfully", user, token });
  } else {
    res.status(400);
    throw new Error("Something went wrong, Please try again.");
  }
});

// Get user details by ID
const getUserDetails = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json(user);
});

// Update user profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  // Check if the user exists
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Check if password is provided and hash it
  // let updatedPassword = user.password;
  // if (password) {
  //   const salt = await bcrypt.genSalt(10);
  //   updatedPassword = await bcrypt.hash(password, salt);
  // }

  // Update user details
  user.fullName = fullName || user.fullName;
  user.email = email || user.email;
  // user.password = updatedPassword;

  await user.save();
  res.status(200).json({ message: "User profile updated successfully", user });
});

const updateUserPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;

  // Check if the user exists
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Check if password is provided and hash it
  let updatedPassword = user.password;
  if (password) {
    const salt = await bcrypt.genSalt(10);
    updatedPassword = await bcrypt.hash(password, salt);
  }

  // Update user details
  user.password = updatedPassword;

  await user.save();
  res.status(200).json({ message: "User password updated successfully", user });
});

// Delete user account
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  await user.remove();
  res.status(200).json({ message: "User account deleted successfully" });
});

// Subscribe
const subscribe = asyncHandler(async (req, res) => {
  const { subscriptionPlan, flutterwavePaymentReciept } = req.body;

  if (!subscriptionPlan) {
    res.status(400);
    throw new Error("Please select a plan");
  }

  // Check if the user exists
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Update user subscription details
  user.subscription.electionsAllowed += subscriptionPlan.electionsAllowed;
  user.subscription.voterLimit += subscriptionPlan.voterLimit;

  const planType = subscriptionPlan.tier;
  const planPrice = subscriptionPlan.amount;

  await user.save();

  // Send email with user and subscription info
  const admin_MsgSubject = "Subscription Updated Successfully";
  const admin_SendTo = "Idrisoluwabunmi@gmail.com";
  const send_from = process.env.EMAIL_USER;

  const adminMessage = `
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
        <!-- Header Section -->
        <div style="background-color: #1e40af; padding: 20px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px;">Subscription Update</h1>
        </div>
        
        <!-- Content Section -->
        <div style="padding: 20px; color: #333333;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hello Admin,</p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">A user has updated their subscription. Here are the details:</p>
          
          <ul style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 20px; padding: 0;">
            <li><strong>User Name:</strong> ${user.name}</li>
            <li><strong>Email:</strong> ${user.email}</li>
            <li><strong>Plan Type:</strong> ${planType}</li>           
            <li><strong>Price:</strong> ${planPrice} USD</li>           
            <li><strong>Flutterwave Ref:</strong> ${flutterwavePaymentReciept}</li>
          </ul>
          
          <p style="font-size: 16px;">Please verify the subscription information and take any necessary actions.</p>
        </div>
        
        <!-- Footer Section -->
        <div style="background-color: #f4f4f4; padding: 10px; text-align: center; color: #777777;">
          <p style="margin: 0; font-size: 12px;">&copy; 2024 Your App Name. All rights reserved.</p>
        </div>
      </div>
    </body>
  `;

  try {
    await sendEmail(admin_MsgSubject, adminMessage, admin_SendTo, send_from);

    res
      .status(200)
      .json({ message: "User subscription updated successfully", user });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent. Please try again.");
  }
});

const getElectionsByUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Fetch elections created by the user
  const elections = await Election.find({ user: userId }).sort("-createdAt");

  // if (!elections.length) {
  //   return res
  //     .status(404)
  //     .json({ message: "No elections found for this user" });
  // }

  res.status(200).json(elections);
});

const userDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Total elections by user
  const totalElections = await Election.countDocuments({ user: userId });

  // Ongoing elections
  const ongoingElections = await Election.countDocuments({
    user: userId,
    status: "Ongoing",
  });

  // Completed elections
  const completedElections = await Election.countDocuments({
    user: userId,
    status: "Ended",
  });

  // Upcoming elections
  const upcomingElections = await Election.countDocuments({
    user: userId,
    status: "Upcoming",
  });

  // Last 5 elections added by the user
  const recentElections = await Election.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("title startDate endDate status _id image");

  // Total users (if applicable)
  // const totalUsers = await User.countDocuments();

  res.json({
    totalElections,
    ongoingElections,
    completedElections,
    upcomingElections,
    recentElections,
  });
});

const loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.json(false);
  }

  //Verify token
  const verified = jwt.verify(token, process.env.JWT_SECRET, (err, data) => {
    if (err) {
      res.json(false);
    } else {
      res.json(true);
    }
  });
});

const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    secure: true,
  });

  res.status(200).json("Successfully Logged Out");
});

const forgetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Validate Request
  if (!email) {
    res.status(400);
    throw new Error("Please provide an email address.");
  }

  // Check if user exists
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("User not found. Please sign up.");
  }

  // Generate Reset Token
  let resetToken = crypto.randomBytes(32).toString("hex") + user._id;

  // Hash the token
  const hashToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Save token details to DB
  const tokenDoc = await Token.findOneAndUpdate(
    { userId: user._id },
    {
      resetToken: hashToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 45 * (60 * 1000), // Token valid for 45 minutes
    },
    { upsert: true, new: true } // Create a new token document if none exists
  );

  // Reset Link
  const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  const currentYear = new Date().getFullYear(); // Dynamic year

  // Email Message
  const message = `<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
    <!-- Header -->
    <tr>
      <td align="center" style="padding: 20px 0;">
        <h2 style="color: #333333; margin: 0;">Reset Your Password</h2>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding: 20px; color: #333333;">
        <p style="margin: 0 0 20px;">Hello, <strong>${user.name}</strong>,</p>
        <p style="margin: 0 0 20px;">We received a request to reset your password. Please click the button below to proceed:</p>
        <p style="text-align: center;">
          <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #ffffff; background-color: #007BFF; border-radius: 5px; text-decoration: none;">Reset Password</a>
        </p>
        <p style="margin: 20px 0 0;">If you didn't request a password reset, please ignore this email or contact our support team.</p>
        <p style="margin: 0;">Thank you,</p>
        <p style="margin: 0;">The 2rueVote Team</p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td align="center" style="padding: 20px 0; color: #999999; font-size: 12px;">
        <p style="margin: 0;">&copy; ${currentYear} 2rueVote</p>
      </td>
    </tr>
  </table>
</body>
`;

  const subject = "Password Reset Request";
  const sendTo = email;
  const sendFrom = process.env.EMAIL_USER;

  // Send Email
  try {
    await sendEmail(subject, message, sendTo, sendFrom);
    res.status(200).json({
      message: "Password reset email sent successfully. Check your inbox.",
    });
  } catch (error) {
    res.status(500);
    throw new Error("Email could not be sent. Please try again later.");
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  // Validate password length
  if (!password || password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters long.");
  }

  // Hash the reset token
  const hashToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Find the token in the database
  const tokenDoc = await Token.findOne({
    resetToken: hashToken,
    expiresAt: { $gt: Date.now() }, // Ensure token is not expired
  });

  // Handle invalid or expired token
  if (!tokenDoc) {
    res.status(400);
    throw new Error("Invalid or expired reset token.");
  }

  // Hash the new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Update user password
  const updatedUser = await User.findByIdAndUpdate(
    tokenDoc.userId,
    {
      password: hashedPassword,
    },
    { new: true } // Return the updated document
  );

  // Remove token from database to prevent reuse
  await Token.findByIdAndDelete(tokenDoc._id);

  // Respond to the client
  res.status(200).json({
    message: "Password has been successfully updated.",
    user: updatedUser._id,
  });
});

module.exports = {
  registerUser,
  loginUser,
  getUserDetails,
  updateUserProfile,
  deleteUser,

  loginStatus,
  logout,

  subscribe,

  verifyEmail,

  getElectionsByUser,
  userDashboard,
  updateUserPassword,

  forgetPassword,
  resetPassword,
};
