import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

// Collection to track inventory purchase history
const inventoryBatchSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: [true, "Item reference is required"],
      index: true
    },
    inventoryStock: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryStock",
      required: [true, "Inventory stock reference is required"]
    },
    // The barcode used for this batch
    barcode: {
      type: String,
      required: [true, "Barcode is required"],
      trim: true
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
    // Sale price at the time of this batch
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
    // Batch/lot number
    batchNumber: {
      type: String,
      required: [true, "Batch number is required"],
      unique: true,
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
inventoryBatchSchema.index({ batchNumber: 1 }, { unique: true });

// Add pagination plugin
inventoryBatchSchema.plugin(mongoosePaginate);

const InventoryBatch = mongoose.model("InventoryBatch", inventoryBatchSchema);
export default InventoryBatch;