const jwt = require("jsonwebtoken");
require('dotenv').config();

module.exports.createAccessToken = (user) => {
    const data = {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin
    };

    return jwt.sign(data, process.env.JWT_SECRET_KEY, {});
};

module.exports.auth = (req, res, next) => {
    let token = req.headers.authorization;

    if (typeof token === "undefined") {
        return res.status(401).send({ auth: "Failed", message: "No Token Provided" });
    }

    if (token.startsWith("Bearer ")) {
        token = token.slice(7, token.length);
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY, function (err, decodedToken) {
        if (err) {
            return res.status(403).send({ auth: "Failed", message: "Invalid or Expired Token" });
        } else {
            req.user = decodedToken;
            next();
        }
    });
};


module.exports.admin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).send({ auth: "Failed", message: "Authentication required." });
    }

    if (!req.user.isAdmin) {
        return res.status(403).send({ auth: "Failed", message: "Action Forbidden: Admin privileges required." });
    }

    next();
};

module.exports.notAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).send({ auth: "Failed", message: "Authentication required." });
    }

    if (req.user.isAdmin) {
        return res.status(403).send({ auth: "Failed", message: "Action Forbidden: Must be a regular user." });
    }

    next();
};

module.exports.errorHandler = (err, req, res, next) => {
    const statusCode = err.status || 500;
    const errorMessage = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        error: {
            message: errorMessage,
            errorCode: err.code || 'SERVER_ERROR',
            details: err.details || null
        }
    });
};

module.exports.isLoggedIn = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.status(401).send({ auth: "Failed", message: "User not logged in" });
    }
};