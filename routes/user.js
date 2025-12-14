/*****************
USER ROUTE
******************/
const express = require("express");
const userController = require("../controllers/users");

const { auth, isLoggedIn, admin } = require('../auth.js');

//[SECTION] Routing Component
const router = express.Router();

router.post("/login", userController.loginUser);

router.post("/register", userController.registerUser);

router.get("/profile", auth, isLoggedIn, userController.getProfile);

router.put("/update-profile", auth, isLoggedIn, userController.updateProfile);

router.put("/update-password", auth, isLoggedIn, userController.updatePassword);

module.exports = router;