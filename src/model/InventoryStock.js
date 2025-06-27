import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

// Primary collection for current stock state
const inventoryStockSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: [true, "Item reference is required"],
      index: true
    },
    barcode: {
      type: String,
      required: [true, "Barcode is required"],
      unique: true,
      trim: true
    },
    // Total current quantity across all batches
    currentQuantity: {
      type: Number,
      required: [true, "Current quantity is required"],
      default: 0
    },
    // Latest cost price
    currentCostPrice: {
      type: Number,
      required: [true, "Current cost price is required"]
    },
    // Latest sale price
    currentSalePrice: {
      type: Number,
      required: [true, "Current sale price is required"]
    },
    // Average cost price across all available batches (weighted average)
    averageCostPrice: {
      type: Number,
      required: [true, "Average cost price is required"]
    },
    minimumStockLevel: {
      type: Number,
      default: 10
    },
    status: {
      type: String,
      enum: ["available", "low", "out_of_stock", "damaged"],
      default: "available"
    },
    lastUpdatedBy: {
      type: String,
      default: "admin"
    }
  },
  {
    timestamps: true
  }
);

// Status update middleware
inventoryStockSchema.pre('save', function(next) {
  if (this.currentQuantity <= 0) {
    this.status = "out_of_stock";
  } else if (this.currentQuantity < this.minimumStockLevel) {
    this.status = "low";
  } else {
    this.status = "available";
  }
  next();
});

// Add pagination plugin
inventoryStockSchema.plugin(mongoosePaginate);

const InventoryStock = mongoose.model("InventoryStock", inventoryStockSchema);
export default InventoryStock;