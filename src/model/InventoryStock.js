import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const inventoryStockSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: [true, "Item reference is required"],
      index: true
    },
    currentQuantity: {
      type: Number,
      required: [true, "Current quantity is required"],
      default: 0
    },
    minimumStockLevel: {
      type: Number,
      default: 10
    },
    location: {
      type: String,
      default: "Main Warehouse",
      trim: true
    },
    costPrice: {
      type: Number,
      required: [true, "Cost price is required"]
    },
    batchNumber: {
      type: String,
      trim: true
    },
    expiryDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ["available", "low", "out_of_stock", "damaged"],
      default: "available"
    },
    lastUpdatedBy: {
      type: String,
      default: "admin"
    },
    notes: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Create compound index for faster queries by item and status
inventoryStockSchema.index({ item: 1, status: 1 });

// Add virtual for stock value calculation
inventoryStockSchema.virtual('stockValue').get(function() {
  return this.currentQuantity * this.costPrice;
});

// Add middleware to update status based on quantity
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