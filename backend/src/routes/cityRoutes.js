import { Router } from "express";
import { featuredCities, listCities } from "../controllers/cityController.js";

const router = Router();

router.get("/", listCities);
router.get("/featured", featuredCities);

export default router;
