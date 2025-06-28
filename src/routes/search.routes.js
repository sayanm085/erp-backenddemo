import { Router } from "express";
import { getSearchSuggestions,getDealerSearchSuggestions,getInventorySearchSuggestions,searchInventory} from "../controllers/search.controller.js";


const router = Router();

// Public routes
router.route("/suggestions").get(getSearchSuggestions);
router.route("/dealer-suggestions").get(getDealerSearchSuggestions);
router.route("/inventory-suggestions").get(getInventorySearchSuggestions);
router.route("/inventory/:barcode").get(searchInventory);


export default router;