const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is already set by auth middleware
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
        required: allowedRoles,
        yourRole: req.user.role
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
