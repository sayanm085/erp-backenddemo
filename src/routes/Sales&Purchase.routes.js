import { Router } from "express";
import {
    purchaseProductByDealer,
    getPurchaseOrderById,
    getItemInventory 
} from "../controllers/Item&Sells.controllers.js";

const router = Router();
// Route to purchase product by dealer

router.route("/purchaseproduct").post(purchaseProductByDealer);
// Route to get purchase order details by ID
router.route("/purchase/:id").get(getPurchaseOrderById);
// Route to get item inventory
router.route("/inventory").get(getItemInventory);

export default router;