const User = require("../models/User");
const Note = require("../models/Note");
const { StatusCodes } = require("http-status-codes");

// @desc    Get all notes
// @route   GET /
// @access Private
const getAllNotes = async (req, res) => {
  const notes = await Note.find().lean();
  if (!notes?.length) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "No notes found" });
  }
  // Add username to each note before sending the response
  // See Promise.all with map() here: https://youtu.be/4lqJBBEpjRE
  // You could also do this with a for...of loop
  const notesWithUser = await Promise.all(
    notes.map(async (note) => {
      const user = await User.findById(note.user).lean().exec();
      return { ...note, username: user.username };
    })
  );
  res.status(StatusCodes.OK).json(notesWithUser);
};

// @desc    Create New Note
// @route   Post /
// @access Private
const createNewNote = async (req, res) => {
  const { user, title, text } = req.body;
  // Confirm data;
  if (!user || !title || !text) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "All fields are required" });
  }

  // Check for duplicate
  const duplicate = await Note.findOne({ title: title })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();
  if (duplicate) {
    return res
      .status(StatusCodes.CONFLICT)
      .json({ message: "duplicate note title" });
  }

  // Create and store new user
  const note = await Note.create({ user, title, text });

  if (note) {
    res
      .status(StatusCodes.CREATED)
      .json({ message: `New note ${title} created` });
  } else {
    res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Invalid note received" });
  }
};

// @desc    Update a note
// @route   Patch /
// @access Private
const updateNote = async (req, res) => {
  const { id, user, title, text, completed } = req.body;
  // Confirm data
  if (!user || !title || !text) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "All fields are required" });
  }
  const note = await Note.findById(id).exec();

  if (!note) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: `Note not found` });
  }

  // check for duplicate
  const duplicate = await Note.findOne({ title })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (duplicate && duplicate._id.toString() !== id) {
    return res
      .status(StatusCodes.CONFLICT)
      .json({ message: "Duplicate values not allowed" });
  }

  note.user = user;
  note.title = title;
  note.text = text;
  note.completed = completed;

  const updatedUser = await note.save();
  res.status(StatusCodes.OK).json({ message: `${title} updated` });
};

// @desc    Delete a User
// @route   Delete /
// @access Private
const deleteNote = async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Note ID is Required" });
  }
  const note = await Note.findById(id).exec();
  if (!note) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "note not found" });
  }

  const result = await Note.deleteOne({ _id: id });
  const reply = `Note ${note.title} with ID ${note._id} deleted`;
  res.status(StatusCodes.OK).json(reply);
};

module.exports = {
  getAllNotes,
  createNewNote,
  updateNote,
  deleteNote,
};
