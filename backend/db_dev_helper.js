/*
This script is used to insert some initial data into the MongoDB database.
*/
import 'dotenv/config'
import mongoose from "mongoose";
import Question from "./models/Question.js";
import { connectDb } from "./config/db.js";
import User from './models/User.js';

await connectDb();

const questions = [
  {
    text: "(1) Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    options: [
      "A. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      "B. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      "C. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      "D. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
    ],
    correctAnswer: "A. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    imageUrl: "",
    isActive: true
  },
  {
    text: "(2) Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    options: [
      "A. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      "B. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      "C. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      "D. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    ],
    correctAnswer: "C. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    imageUrl: "",
    isActive: true
  },
  {
    text: "(3) Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    options: [
      "A. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      "B. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      "C. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      "D. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    ],
    correctAnswer: "C. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    imageUrl: "",
    isActive: true
  },
  {
    text: "(4) Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    options: [
      "A. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      "B. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      "C. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      "D. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    ],
    correctAnswer: "B. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    imageUrl: "",
    isActive: true
  },
  {
    text: "(5) Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    options: [
      "A. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      "B. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      "C. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      "D. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    ],
    correctAnswer: "D. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    imageUrl: "",
    isActive: true
  },
]

await Promise.all(questions.map(question => new Question(question).save()));

const user = new User({
  username: "testuser",
  email: "a@a.a",
  // password is 123
  passwordHash: "$2b$12$HrUlr1y24VERvxg/2VIUNuEKq8B19n/nK5E9asMJOF64HKJ9gh1my",
  role: "player"
});
await user.save();

mongoose.connection.close()