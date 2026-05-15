module.exports = function isAdmin(req, res, next) {
  if (req.user?.role?.toLowerCase() === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Access denied: Admins only" });
};
