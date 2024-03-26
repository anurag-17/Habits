const jwt = require("jsonwebtoken");
const User = require("../Model/User");
const Admin = require("../Model/Admin");

exports.generateToken = (payload) => {
  console.log(payload);
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};
exports.generateTokenForPwd = (payload, expiresIn = "5m") => {
  console.log(payload);
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};
exports.verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    // Handle invalid/expired tokens here
    console.log(error);
    return null;
  }
};
exports.isAuthJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = "";

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else {
    token = authHeader;
  }

  if (!token) {
    return res
      .status(401)
      .json({
        success: false,
        message: "Please login to access this resource",
      });
  }

  try {
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findOne({ _id: decodedData?.id });

    if (!req.user) {
      req.user = await Admin.findOne({ id: decodedData?.id });
    }
    if (req.user.activeToken && req.user.activeToken === token) {
      next();
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Token expired, please login again" });
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
// auth role
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        res
          .status(403)
          .json({
            success: false,
            message: `Role: ${req.user.role} is not allowed  to access this resource`,
          })
      );
    }
    next();
  };
};
exports.emitEvent = (req, event, users, data) => {
  console.log("Emiting Event" ,event);
};