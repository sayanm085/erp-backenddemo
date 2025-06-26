import { Router } from "express";
import {
    addItem,
    getAllItems,
    getItemById,
    updateItem,
    deleteItem
} from "../controllers/Item&Sells.controllers.js";


const router = Router();

// Route to add a new item
router.route("/additem").post(addItem);
router.route("/getallitems").get(getAllItems);
router.route("/getitem/:id").get(getItemById);
router.route("/updateitem/:id").put(updateItem);
router.route("/deleteitem/:id").delete(deleteItem);

export default router;