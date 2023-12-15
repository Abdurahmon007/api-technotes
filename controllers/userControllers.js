const User = require("../models/User");
const Note = require("../models/Note");
const bcryt = require("bcrypt");
const { StatusCodes } = require("http-status-codes");

// @desc    Get all users
// @route   GET /
// @access Private
const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password").lean();
  if (!users?.length) {
    console.log(users);
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "Not found Users" });
  }
  res.status(StatusCodes.OK).json(users);
};

// @desc    Create New User
// @route   Post /
// @access Private
const createNewUser = async (req, res) => {
  const { username, password, roles } = req.body;

  // Confirm data;
  if (!username || !password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "All fields are required" });
  }

  // Check for duplicate
  const duplicate = await User.findOne({ username: username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();
  if (duplicate) {
    return res
      .status(StatusCodes.CONFLICT)
      .json({ message: "duplicate username" });
  }

  // Hash password
  const hashedPwd = await bcryt.hash(password, 10); // salt rounds
  const userObject =
    !Array.isArray(roles) || !roles.length
      ? { username, password: hashedPwd }
      : { username, password: hashedPwd, roles };

  // Create and store new user
  const user = await User.create(userObject);
  if (user) {
    res
      .status(StatusCodes.CREATED)
      .json({ message: `New user ${username} created` });
  } else {
    res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Invalid user received" });
  }
};

// @desc    Update a User
// @route   Patch /
// @access Private
const updateUser = async (req, res) => {
  const { id, username, password, roles, active } = req.body;
  // Confirm data
  if (
    !id ||
    !username ||
    !Array.isArray(roles) ||
    typeof active !== "boolean"
  ) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "All fields are required" });
  }
  const user = await User.findById(id).exec();
  console.log({ id, username, password, roles, active });
  if (!user) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: `User not found` });
  }

  // check for duplicate
  const duplicate = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (duplicate && duplicate._id.toString() !== id) {
    return res
      .status(StatusCodes.CONFLICT)
      .json({ message: "Duplicate values not allowed" });
  }

  user.username = username;
  user.roles = roles;
  user.active = active;

  if (password) {
    user.password = await bcryt.hash(password, 10);
  }

  const updatedUser = await user.save();
  res.status(StatusCodes.OK).json({ message: `username ${username} updated` });
};

// @desc    Delete a User
// @route   Delete /
// @access Private
const deleteUser = async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "User ID is Required" });
  }

  const note = await Note.findOne({ user: id }).lean().exec();
  if (note) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "User has assigned notes" });
  }

  const user = await User.findById(id).exec();
  if (!user) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "user not found" });
  }

  const result = await User.deleteOne({ _id: id });
  const reply = `Username ${user.username} with ID ${user._id} deleted`;
  res.status(StatusCodes.OK).json(reply);
};

module.exports = {
  getAllUsers,
  createNewUser,
  updateUser,
  deleteUser,
};
