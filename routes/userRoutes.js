import express from "express";
import {
  createUser,
  loginUser,
  logoutCurrentUser,
  getAllUsers,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  deleteUserById,
  getUserById,
  updateUserById,
  updateUserToAdmin,
} from "../controllers/userController.js";

import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.route("/").post(createUser).get(getAllUsers);

router.post("/auth", loginUser);
router.post("/logout", logoutCurrentUser);

router
  .route("/profile/:id")
  // .get(authenticate, getCurrentUserProfile)
  .get(getCurrentUserProfile)
  // .put(authenticate, updateCurrentUserProfile);
  .put(updateCurrentUserProfile);
// ADMIN ROUTES 👇
router
  .route("/:id")
  .delete(deleteUserById)
  .get(getUserById)
  .put(updateUserById);
router.put("/:id/make-admin", updateUserToAdmin);

export default router;
