import { Router } from "express";
import { getSearchSuggestions,getDealerSearchSuggestions} from "../controllers/search.controller.js";


const router = Router();

// Public routes
router.route("/suggestions").get(getSearchSuggestions);
router.route("/dealer-suggestions").get(getDealerSearchSuggestions);


export default router;