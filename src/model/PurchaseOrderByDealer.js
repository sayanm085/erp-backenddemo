import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

// Item schema (embedded subdocument)
const purchaseItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  gstPercentage: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true
  }
});

// Main Purchase Order schema
const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      required: [true, "PO Number is required"],
      unique: true,
      trim: true,
      index: true
    },
    dealer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealer",
      required: [true, "Dealer reference is required"]
    },
    orderDate: {
      type: Date,
      default: Date.now
    },
    expectedDeliveryDate: {
      type: Date,
      required: [true, "Expected delivery date is required"]
    },
    status: {
      type: String,
      enum: ["pending", "delivered", "partial", "canceled"],
      default: "pending"
    },
    items: [purchaseItemSchema],
    paymentTerms: {
      type: String,
      default: "Net 30"
    },
    financials: {
      subtotal: {
        type: Number,
        required: true
      },
      taxAmount: {
        type: Number,
        default: 0
      },
      discountAmount: {
        type: Number,
        default: 0
      },
      totalAmount: {
        type: Number,
        required: true
      }
    },
    createdBy: {
      type: String,
      default: "admin"
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Virtual for calculating total items
purchaseOrderSchema.virtual("totalItems").get(function() {
  return this.items.length;
});

// Create compound indexes for common queries
purchaseOrderSchema.index({ dealer: 1, orderDate: -1 });
purchaseOrderSchema.index({ status: 1 });

// Add pagination plugin
purchaseOrderSchema.plugin(mongoosePaginate);

const PurchaseOrderByDealer = mongoose.model("PurchaseOrderByDealer", purchaseOrderSchema);
export default PurchaseOrderByDealer;