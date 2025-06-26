import { Router } from "express";
import { getSearchSuggestions } from "../controllers/search.controller.js";


const router = Router();

// Public routes
router.route("/suggestions").get(getSearchSuggestions);

export default router;