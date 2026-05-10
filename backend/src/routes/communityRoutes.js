import { Router } from "express";
import {
  createPost,
  getPost,
  likePost,
  listPosts,
} from "../controllers/communityController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", listPosts);
router.get("/:postId", getPost);
router.post("/", requireAuth, createPost);
router.patch("/:postId/like", likePost);

export default router;
