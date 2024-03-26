const uploadOnS3 = require("../Utils/awsS3");
// const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { generateToken, verifyToken } = require("../Utils/jwt");
const User = require("../Model/User");
const sendEmail = require("../Utils/SendEmail");
// const CsvParser = require("json2csv").Parser;

const HttpStatus = {
  OK: 200,
  INVALID: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  SERVER_ERROR: 500,
  NOT_FOUND: 404,
};
const StatusMessage = {
  INVALID_CREDENTIALS: "Invalid credentials.",
  INVALID_EMAIL_PASSWORD: "Please provide email and password.",
  USER_NOT_FOUND: "User not found.",
  SERVER_ERROR: "Server error.",
  MISSING_DATA: "Please provide all necessary user details.",
  DUPLICATE_DATA: "Data already exists.",
  DUPLICATE_EMAIL: "Email already exists.",
  DUPLICATE_CONTACT: "Contact number already exists.",
  USER_DELETED: "Deleted successfully.",
  UNAUTHORIZED_ACCESS: "Unauthorized access.",
  USER_UPDATED: "User updated successfully.",
  MISSING_PAGE_PARAMS: "Please provide page number and limit.",
  SAVED_SUCC: "Saved Successfully!",
  NOT_FOUND: "Data not found.",
};

exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Invalid request" });
    }

    let fileName = req.file.originalname;

    let url = await uploadOnS3(req.file.buffer, fileName);

    return res.status(200).json({ status: true, url: url });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.addUser = async (req, res ,next) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(401).json({success: false, error: "User with this email already exists." });
  }

  const userData = {
    email,
    provider_ID: req.body.provider_ID,
    name: req.body.name,
    contact: req.body.contact,
    provider: req.body.provider,
    avatar: req.body.avatar
  };

  if (password) {
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);
    userData.password = password;
  }

  try {
    const newUser = await User.create(userData);
    // sendToken(newUser, 201, res);
    const token = generateToken({ id: newUser._id });

    const user = {
      success: true,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        contact: newUser.contact,
        provider: newUser.provider,
        avatar: newUser.avatar
      },
      token: token,
    };

    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  let updateData = req.body;

  if (updateData.email) {
    console.log("Email update request detected and ignored.");
    delete updateData.email;
    delete updateData.password;
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    return res.status(200).json({ success: true, message: updatedUser });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error occurred while updating the user.",
      error: error.message,
    });
  }
};

exports.updateUserPassword = async (req, res) => {
  const id = req.user._id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Please provide both old and new password.",
    });
  }

  try {
    const user = await User.findById(id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    // Handle possible errors
    return res.status(500).json({
      success: false,
      message: "Server error occurred while updating the password.",
      error: error.message,
    });
  }
};

exports.forgotPwd = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .json({ success: false, message: StatusMessage.INVALID_EMAIL_PASSWORD });
  }
  let user = await User.findOne({ email });
  if (!user) {
    return res
      .status(HttpStatus.UNAUTHORIZED)
      .json({ success: false, message: StatusMessage.USER_NOT_FOUND });
  }
  const token = generateToken({ email: user.email });
  user.resetToken = token;
  await user.save();
  const mailOptions = {
    from: "@gmail.com",
    to: user.email,
    subject: "Reset Password Link",
    text: `<h2>Hello! ${user.name} </h2>
        <h3>Please follow the link to reset your password: <a href=http//:localhost:3000/${token}>Link</a></h3>
        <h3>Thanks and regards</h3>
        `,
  };

  try {
    const info = await sendEmail(mailOptions);
    console.log("Email sent:", info);
    return res
      .status(200)
      .json({ success: true, message: "Reset link sent to registered mail." });
  } catch (error) {
    console.log("Error sending email:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send email" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    } else {
      token = authHeader;
    }
    const tokenUser = await verifyToken(token);
    const { newPassword } = req.body;

    if (!newPassword) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ success: false, message: StatusMessage.MISSING_DATA });
    }
    const user = await User.findOne({ email: tokenUser.email });
    if (!user) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ success: false, message: StatusMessage.USER_NOT_FOUND });
    }

    if (user.resetToken !== token) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ success: false, message: StatusMessage.USER_NOT_FOUND });
    }
    // Verify the current password

    // Hash the new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = "";
    await user.save();

    // Optionally, send an email to the user acknowledging the password change

    return res
      .status(HttpStatus.OK)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(HttpStatus.SERVER_ERROR)
      .json({ success: false, message: StatusMessage.SERVER_ERROR });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error occurred while deleting the user.",
      error: error.message,
    });
  }
};

exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error occurred while retrieving the user.",
      error: error.message,
    });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email) {
      return res.status(401).json({ success: false, error: "Email not found" });
    }

    const findUser = await User.findOne({ email }).select("+password");

    if (!findUser) {
      return res.status(401).json({ success: false, error: "User not found" });
    }

    if (findUser.password) {
      // If password is not provided for a local user
      if (!password) {
        return res.status(401).json({ success: false, error: "Password is required" });
      }

      // Check if the provided password matches the stored password
      if (!(await findUser.matchPasswords(password))) {
        return res.status(401).json({ success: false, error: "Invalid credentials" });
      }
    } else {
      if (!findUser.provider) {
        return res.status(401).json({ success: false, error: "Invalid user" });
      }
    }

    const token = generateToken({ id: findUser._id });
    
    await User.findByIdAndUpdate(
      { _id: findUser._id?.toString() },
      { activeToken: token },
      { new: true }
    );

    const user = {
      _id: findUser._id,
      name: findUser.name,
      email: findUser.email,
      contact: findUser.contact,
      provider: findUser.provider,
      activeToken: findUser.activeToken
    };

    return res.status(200).json({ success: true, user, token });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

exports.logoutUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    } else {
      token = authHeader;
    }
    const email = req.user.email;
    if (!email) {
      return res.status(401).json({
        success: false,
        message: "Invalid session or token, please login again",
      });
    }
    const userData = await User.findOne({ email });
    if (userData.activeToken && userData.activeToken === token) {
      const user = await User.findOneAndUpdate(
        { email: email, activeToken: token },
        { $unset: { activeToken: "" } },
        { new: true }
      );
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid session or token, please login again",
        });
      }
      return res.status(HttpStatus.OK).json({
        success: true,
        message: `${userData.email} is Logout Successfully`,
      });
    } else {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ success: false, message: "Token expired, please login again" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token" });
    } else {
      console.error("Other error:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }
};

exports.getAllUsersWithPagination = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const searchQuery = {};
  if (req.query.search) {
    searchQuery.$or = [
      { name: { $regex: req.query.search, $options: "i" } }, 
      { email: { $regex: req.query.search, $options: "i" } },
      { contact: { $regex: req.query.search, $options: "i" } },
    ];
  }

  try {
    const totalUsers = await User.countDocuments(searchQuery);

    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find(searchQuery).skip(skip).limit(limit);

    return res.status(200).json({
      success: true,
      count: users.length,
      page,
      totalPages,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error occurred while retrieving users.",
      error: error.message,
    });
  }
};

exports.getMyProfile = async (req, res) => {
  const id  = req.user;

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error occurred while retrieving the user.",
      error: error.message,
    });
  }
}