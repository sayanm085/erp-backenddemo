/**
 * Current Date and Time (UTC): 2025-06-27 06:36:12
 * Current User's Login: sayanm085
 */

import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const itemSaleSchema = new mongoose.Schema(
  {
    saleReference: {
      type: String,
      required: [true, "Sale reference is required"],
      unique: true,
      trim: true
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: [true, "Item reference is required"]
    },
    customer: {
      name: {
        type: String,
        trim: true
      },
      phone: {
        type: String,
        trim: true
      },
      email: {
        type: String,
        trim: true
      }
    },
    quantitySold: {
      type: Number,
      required: [true, "Quantity sold is required"],
      min: 1
    },
    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"]
    },
    gstAmount: {
      type: Number,
      default: 0
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"]
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "bank_transfer", "credit"],
      default: "cash"
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "pending", "partial", "failed"],
      default: "paid"
    },
    saleDate: {
      type: Date,
      default: Date.now
    },
    salesPerson: {
      type: String,
      default: "admin"
    },
    isReturn: {
      type: Boolean,
      default: false
    },
    returnReason: {
      type: String
    },
    notes: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Create compound index for better query performance
itemSaleSchema.index({ saleDate: -1, paymentStatus: 1 });
itemSaleSchema.index({ item: 1 });

// Add pagination plugin
itemSaleSchema.plugin(mongoosePaginate);

const ItemSale = mongoose.model("ItemSale", itemSaleSchema);
export default ItemSale;