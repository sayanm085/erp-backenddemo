import { Router } from "express";
import {
    purchaseProductByDealer,
    getPurchaseOrderById,
    getAllItemInventory ,
    createOrder,
    completeTransaction,
    getAllPurchaseOrders
} from "../controllers/Item&Sells.controllers.js";

const router = Router();
// Route to purchase product by dealer

router.route("/purchaseproduct").post(purchaseProductByDealer);
// Route to get purchase order details by ID
router.route("/purchase/:id").get(getPurchaseOrderById);
// Route to get item inventory
router.route("/getAllItemInventory").get(getAllItemInventory);
// Route to get all purchase orders
router.route("/purchase-orders").get(getAllPurchaseOrders);

// Route to create a new order
// Sales routes - updated to match our controller implementation
router.route("/create-order").post(createOrder);
router.route("/:saleId/complete-transaction").post(completeTransaction);

export default router;