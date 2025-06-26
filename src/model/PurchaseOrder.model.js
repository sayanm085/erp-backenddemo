import mongoose from "mongoose";

const GSTBreakupSchema = new mongoose.Schema({
  cgst: { type: Number, default: 0 }, // Central GST
  sgst: { type: Number, default: 0 }, // State GST
  igst: { type: Number, default: 0 }, // Integrated GST (if inter-state)
  totalGST: { type: Number, default: 0 }
}, { _id: false });

const PurchaseOrderItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    itemName: { type: String, required: true },
    hsn: { type: String },
    quantity: { type: Number, required: true },
    unit: { type: String, default: "pcs" },
    rate: { type: Number, required: true },
    discount: { type: Number, default: 0 }, // per item
    gstRate: { type: Number, required: true }, // %
    amount: { type: Number, required: true }, // (quantity * rate) - discount
    gstBreakup: GSTBreakupSchema,
  },
  { _id: false }
);

const PurchaseOrderSchema = new mongoose.Schema({
  poNumber: { type: String, required: true, unique: true }, // PO-2025-0001
  vendor: {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    name: { type: String, required: true },
    gstin: { type: String },
    address: { type: String },
    state: { type: String }
  },
  orderDate: { type: Date, required: true, default: Date.now },
  expectedDelivery: { type: Date },
  invoiceNumber: { type: String },
  invoiceDate: { type: Date },

  items: [PurchaseOrderItemSchema],

  subTotal: { type: Number, required: true }, // total before GST
  gstTotal: { type: Number, required: true },
  cgstTotal: { type: Number, default: 0 },
  sgstTotal: { type: Number, default: 0 },
  igstTotal: { type: Number, default: 0 },
  total: { type: Number, required: true }, // total after GST

  paymentStatus: { type: String, enum: ["Pending", "Partially Paid", "Paid"], default: "Pending" },
  paymentMode: { type: String, enum: ["Cash", "Bank", "UPI", "Credit"], default: "Cash" },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, default: function() { return this.total - this.paidAmount; } },

  status: { type: String, enum: ["Draft", "Ordered", "Received", "Cancelled", "Closed"], default: "Draft" },
  remarks: { type: String },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

PurchaseOrderSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  next();
});

const PurchaseOrder = mongoose.models.PurchaseOrder || mongoose.model("PurchaseOrder", PurchaseOrderSchema);
export default PurchaseOrder;