import { Router } from "express";
import {
  login,
  logout,
  me,
  register,
  updateProfile,
  uploadPhoto,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.put("/profile", requireAuth, updateProfile);
router.post("/upload-photo", requireAuth, upload.single("photo"), uploadPhoto);

export default router;
