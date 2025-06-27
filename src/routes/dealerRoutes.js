import express from "express";
import {
  getAllDealers,
  getDealerById,
  createDealer,
  updateDealer,
  deleteDealer,
  get,
} from "../controllers/dealerController.js";


const router = express.Router();

// Base routes
router.route("/create").post(createDealer);
router.route("/").get(getAllDealers);
router
  .route("/:id")
  .get(getDealerById)
  .put(updateDealer)
  .delete(deleteDealer);

// Export the router
router.route("/:id").get(getDealerById);     // THIS RUNS FIRST\


export default router;
