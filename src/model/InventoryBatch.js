/**
 * Current Date and Time (UTC): 2025-06-27 07:22:15
 * Current User's Login: sayanm085
 */

import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

// Collection to track inventory batches at different price points
const inventoryBatchSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: [true, "Item reference is required"],
      index: true
    },
    // Remaining quantity in this batch
    remainingQuantity: {
      type: Number,
      required: [true, "Remaining quantity is required"],
      min: 0
    },
    // Original quantity in this batch
    originalQuantity: {
      type: Number,
      required: [true, "Original quantity is required"],
      min: 1
    },
    // Cost price for this specific batch
    costPrice: {
      type: Number,
      required: [true, "Cost price is required"]
    },
    // Sale price when this batch was added
    salePrice: {
      type: Number,
      required: [true, "Sale price is required"]
    },
    // Purchase date of this batch
    purchaseDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    // Reference to purchase order or document
    purchaseReference: {
      type: String,
      trim: true
    },
    // Is this batch active (has remaining stock)
    isActive: {
      type: Boolean,
      default: true
    },
    // Expiry date if applicable
    expiryDate: {
      type: Date
    },
    // Batch/lot number
    batchNumber: {
      type: String,
      trim: true
    },
    createdBy: {
      type: String,
      default: "admin"
    }
  },
  {
    timestamps: true
  }
);

// Create compound index for common queries
inventoryBatchSchema.index({ item: 1, isActive: 1 });
inventoryBatchSchema.index({ item: 1, purchaseDate: -1 });

// Add pagination plugin
inventoryBatchSchema.plugin(mongoosePaginate);

const InventoryBatch = mongoose.model("InventoryBatch", inventoryBatchSchema);
export default InventoryBatch;