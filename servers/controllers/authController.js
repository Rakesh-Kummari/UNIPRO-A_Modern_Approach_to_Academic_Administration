const User = require("../models/User");
const Lecturer = require("../models/Lecturer");
const StudentWelfare = require("../models/StudentWelfare");
const Shedule = require("../models/Shedule");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Review = require("../models/Review");
const Announcement = require("../models/Announcement");
const { generateAccessToken, generateRefreshToken } = require("../../servers/utills/generateTokens");

const handleLogin = async (req, res) => {
  const { email, password } = req.body;

  // Validate request body
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  let foundUser = await User.findOne({ email }).exec();
  if (foundUser) {
    console.log("user found in user collection");
  } else {
    foundUser = await Lecturer.findOne({ email }).exec();
    if (foundUser) {
      console.log("user found in lecturer collection");
    } else {
      foundUser = await StudentWelfare.findOne({ email }).exec();
      if (foundUser) {
        console.log("user found in student welfare collection");
      }
    }
  }

  if (!foundUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const matchPassword = await bcrypt.compare(password, foundUser.password);
  if (matchPassword) {
    // Generate tokens
    const accessToken = generateAccessToken(foundUser);
    const refreshToken = generateRefreshToken(foundUser);

    // Save refresh token in the database
    foundUser.refreshToken = refreshToken;
    await foundUser.save();

    // Set refresh token as an HTTP-only secure cookie
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000, // 1 day expiration
    });

    // Send access token to client
    res.json({ accessToken });
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};
const handleRefreshToken = async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const refreshToken = cookies.jwt;

  // Check if refresh token exists in the database
  const foundUser = await User.findOne({ refreshToken }).exec();
  if (!foundUser) {
    return res.status(403).json({ message: "Forbidden" });
  }

  // Verify refresh token
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
    if (err || foundUser.email.toString() !== decoded.email) {
      // If there is an error or the user ID in the token doesn't match the found user's ID
      return res.status(403).json({ message: "Forbidden" });
    }
  
    // Proceed to generate new access and refresh tokens
    const newRefreshToken = generateRefreshToken(foundUser);
    foundUser.refreshToken = newRefreshToken;
    await foundUser.save();
  
    // Set the new refresh token in the cookie
    res.cookie("jwt", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000
    });
  
    // Generate a new access token and send it back
    const newAccessToken = generateAccessToken(foundUser);
    res.json({ accessToken: newAccessToken });
  });
  
};
const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch" });
  }
};
const getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const additionalFilters = req.body;

    const query = { email, ...additionalFilters };

    const result = await User.findOne(query);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch" });
  }
};
const getUsersByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    const additionalFilters = req.body;

    const query = { department, ...additionalFilters };

    const result = await User.find(query);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
};

const updateUser = async (req, res) => {
  try {
    let {
      username,
      studentnumber,
      email,
      password,
      phone,
      faculty,
      department,
    } = req.body;

    const updatedUser = await User.findOneAndUpdate(
      { email: email },
      {
        username: username,
        studentnumber: studentnumber,
        password: password,
        phone: phone,
        faculty: faculty,
        department: department,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User details updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error while updating user details" });
  }
};
const updateLecturer = async (req, res) => {
  try {
    let {
      username,
      email,
      phone,
      faculty,
      department,
      position,
      university,
      address,
    } = req.body;

    const updatedLecturer = await Lecturer.findOneAndUpdate(
      { email: email },
      {
        address: address,
        username: username,
        phone: phone,
        faculty: faculty,
        department: department,
        position: position,
        university: university,
      },
      { new: true }
    );

    if (!updatedLecturer) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User details updated successfully",
      user: updatedLecturer,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error while updating user details" });
  }
};
const updateStudentWelfare = async (req, res) => {
  try {
    let { username, email, phone, position, university, address } = req.body;

    const updatedWelfare = await StudentWelfare.findOneAndUpdate(
      { email: email },
      {
        address: address,
        username: username,
        phone: phone,
        position: position,
        university: university,
      },
      { new: true }
    );

    if (!updatedWelfare) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User details updated successfully",
      user: updatedWelfare,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error while updating user details" });
  }
};

const handleNewShedule = async (req, res) => {
  const {
    university,
    faculty,
    department,
    lecturername,
    subject,
    date,
    time,
    zoomlink,
  } = req.body;
  if (!university || !subject || !date || !time)
    return res
      .status(400)
      .json({ message: "Please fill out all required fields" });

  try {
    const newSchedule = await Shedule.create({
      university: university,
      faculty: faculty,
      department: department,
      subject: subject,
      lecturername: lecturername,
      time: time,
      date: date,
      zoomlink: zoomlink,
    });

    console.log("New schedule created:", newSchedule);

    res.status(200).json({ success: "New schedule created" });
  } catch (error) {
    console.error("Error creating schedule:", error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the schedule" });
  }
};

const getSchedule = async (req, res) => {
  try {
    const scheduledLectures = await Shedule.find();
    res.status(200).json(scheduledLectures);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch scheduled lectures" });
  }
};
const deleteLecture = async (req, res) => {
  const { index } = req.params; // Extract the index from the request parameters

  try {
    // Get the lecture by index
    const lecture = await Shedule.findByIdAndDelete(index);

    if (!lecture) {
      return res
        .status(404)
        .json({ success: false, message: "Lecture not found" });
    }

    res.json({ success: true, message: "Lecture deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
const updatedLecture = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedLecture = req.body;
    const result = await Shedule.findByIdAndUpdate(id, updatedLecture, {
      new: true,
    });

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Lecture not found" });
    }

    res.status(200).json({
      success: true,
      message: "Lecture updated successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
const getReviews = async (req, res) => {
  try {
    const filters = req.body;

    const result = await Review.find(filters);

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch" });
  }
};
const createReview = async (req, res) => {
  const { name, review } = req.body;
  if (!review) return res.status(400).json({ message: "required" });

  try {
    await Review.create({
      name: name,
      review: review,
    });

    res.status(200).json({ success: `new review created` });
  } catch (error) {
    res.status(500).json({ error: `${error.message}` });
  }
};
const handleNewAnnouncement = async (req, res) => {
  const { description, image } = req.body;
  if (!description || !image) {
    return res.status(400).json({ message: "something is required" });
  }

  const duplicateImg = await Announcement.findOne({ image: image }).exec();
  if (duplicateImg) {
    return res.status(409).json({ message: "image is already exist" });
  }

  try {
    await Announcement.create({
      image,
      description,
    });

    res.status(200).json({ success: ` created` });
  } catch (error) {
    res.status(500).json({ error: `${error.message}` });
  }
};
const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find();
    res.status(200).json(announcements);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching announcements", error: error.message });
  }
};
const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const deleteByIndex = await Announcement.findByIdAndDelete(id);

    if (!deleteByIndex) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    res.status(200).json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Failed to delete announcement:", error);
    res.status(500).json({ error: "Failed to delete announcement" });
  }
};

module.exports = {
  handleLogin,
  updateUser,
  handleNewShedule,
  getSchedule,
  deleteLecture,
  updatedLecture,
  getUsers,
  getUserByEmail,
  getUsersByDepartment,
  updateLecturer,
  createReview,
  getReviews,
  deleteAnnouncement,
  getAnnouncements,
  handleNewAnnouncement,
  updateStudentWelfare,
  handleRefreshToken,
};
