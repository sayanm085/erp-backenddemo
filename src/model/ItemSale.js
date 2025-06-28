/**
 * Current Date and Time (UTC): 2025-06-28 11:36:52
 * Current User's Login: sayanm085
 */

import mongoose from 'mongoose';

const itemSaleSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerDetails',
    default: null
  },
  items: [
    {
      itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
      },
      name: {
        type: String,
        required: true
      },
      barcode: {
        type: String
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      price: {
        type: Number,
        required: true
      },
      gstPercentage: {
        type: Number,
        default: 0
      },
      taxAmount: {
        type: Number,
        default: 0
      },
      discountPercent: {
        type: Number,
        default: 0
      },
      discountAmount: {
        type: Number,
        default: 0
      },
      totalPrice: {
        type: Number,
        required: true
      }
    }
  ],
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
  additionalDiscount: {
    type: Number,
    default: 0
  },
  pointsDiscount: {
    type: Number,
    default: 0
  },
  loyaltyPointsUsed: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'cancelled'],
    default: 'in_progress'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'pending'],
    default: 'pending'
  },
  paymentDetails: {
    amountReceived: {
      type: Number
    },
    change: {
      type: Number,
      default: 0
    },
    cardDetails: {
      type: Object,
      default: null
    },
    upiTransactionId: {
      type: String,
      default: null
    }
  },
  counterNumber: {
    type: Number,
    required: true
  },
  invoiceNumber: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Add indexes for performance
itemSaleSchema.index({ date: -1 });
itemSaleSchema.index({ status: 1 });
itemSaleSchema.index({ customerId: 1 });
itemSaleSchema.index({ "items.itemId": 1 });

export default mongoose.model('ItemSale', itemSaleSchema);