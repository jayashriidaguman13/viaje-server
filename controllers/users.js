/*****************
USER CONTROLLER
******************/
const bcrypt = require("bcrypt");

const User = require("../models/User");

const auth = require("../auth");

const { errorHandler } = require("../auth.js");

module.exports.loginUser = (req, res) => {
  if(req.body.email.includes("@")) {
    const queryEmail = req.body.email.toLowerCase().trim();
    return User.findOne({ email: req.body.email.toLowerCase() })
    .then(result => {
      if(result == null) {
        return res.status(404).send({ error: "No Email Found" });
      } else {
        const isPasswordCorrect = bcrypt.compareSync(req.body.password, result.password);

        if(isPasswordCorrect) {
          return res.status(200).send({
            message: "Login successful!",
            access: auth.createAccessToken(result),
            isAdmin: result.isAdmin
          })
        } else {
          return res.status(401).send({ error: "Email and password do not match" });
        }
      }
    })
    .catch(error => errorHandler(error, req, res));
  } else {
    return res.status(400).send({ error: "Invalid Email" });
  }
}

module.exports.registerUser = async (req, res) => {
  try {
    const { firstName, lastName, birthday, email, phoneNumber, password, confirmPassword, isAdmin } = req.body;

    if (!firstName || !lastName || !birthday || !email || !phoneNumber || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!email.includes("@")) {
      return res.status(400).json({ message: "Invalid email" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    const phoneRegex = /^[0-9]{11,}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ message: "Phone number must contain only numbers and be at least 11 digits long" });
    }

    const existingUser = await User.findOne({
      $or: [
        { email: email },
        { phoneNumber: phoneNumber }
      ]
    });

    if (existingUser) {
      let duplicateField = existingUser.email === email ? "email" : "phoneNumber";
      return res.status(400).json({ message: `The ${duplicateField} is already registered` });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      firstName,
      lastName,
      birthday,
      email,
      phoneNumber,
      password: hashedPassword,
      isAdmin: isAdmin || false
    });

    const savedUser = await newUser.save();
    const { password: _, ...userWithoutPassword } = savedUser.toObject();

    res.status(201).json({
      message: "User registered successfully",
      user: userWithoutPassword
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports.getProfile = (req, res) => {
  return User.findById(req.user.id)
  .select('_id firstName lastName birthday email phoneNumber isAdmin mobileNo __v')
  .then((user) => {
    if (!user) {
      return res.status(404).send({message: "User not found"});
    }
    return res.status(200).send({user});
    })
  .catch((error) => errorHandler(error, req, res));
};

module.exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, birthday, email, phoneNumber } = req.body;

    if (!firstName || !lastName || !birthday || !email || !phoneNumber) {
      return res.status(400).send({ message: "All fields are required" });
    }

    if (!email.includes("@")) {
      return res.status(400).send({ message: "Invalid email" });
    }

    const phoneRegex = /^[0-9]{11,}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).send({ message: "Phone number must contain only numbers and be at least 11 digits long" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, birthday, email, phoneNumber },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send({ message: "User not found" });
    }

    res.status(200).send({ user: updatedUser });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to update profile" });
  }
}

module.exports.updatePassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const { id } = req.user;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).send({
        message: "New password must be at least 8 characters"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).send({
        message: "Passwords do not match"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await User.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    res.status(200).send({ message: "Password reset successfully!" });

  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Internal server error",
      details: {
        name: error.name,
        message: error.message,
        path: error.path,
        value: error.value
      }
    });
  }
};