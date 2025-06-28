/**
 * Current Date and Time (UTC): 2025-06-28 11:28:04
 * Current User's Login: sayanm085
 */

import mongoose from 'mongoose';

const customerDetailsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Customer name is required"],
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    unique: true,
    sparse: true // Allows null/undefined values to not trigger unique constraint
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true, // Allows null/undefined values to not trigger unique constraint
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: "India"
    }
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  // Loyalty program fields
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  loyaltyTier: {
    type: String,
    enum: ["Bronze", "Silver", "Gold", "Platinum"],
    default: "Bronze"
  },
  // Shopping statistics
  totalSpent: {
    type: Number,
    default: 0
  },
  totalVisits: {
    type: Number,
    default: 0
  },
  lastVisitDate: {
    type: Date
  },
  // Preferences and notes
  preferredPaymentMethod: {
    type: String,
    enum: ["cash", "card", "upi"],
    default: "cash"
  },
  notes: {
    type: String
  },
  birthdate: {
    type: Date
  },
  anniversary: {
    type: Date
  },
  // Flags
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster search
customerDetailsSchema.index({ name: 1 });
customerDetailsSchema.index({ phone: 1 });
customerDetailsSchema.index({ email: 1 });

// Method to calculate next loyalty tier
customerDetailsSchema.methods.calculateLoyaltyTier = function() {
  if (this.totalSpent >= 50000) return "Platinum";
  if (this.totalSpent >= 25000) return "Gold";
  if (this.totalSpent >= 10000) return "Silver";
  return "Bronze";
};

// Method to add loyalty points
customerDetailsSchema.methods.addPoints = function(points) {
  this.loyaltyPoints += points;
  return this.loyaltyPoints;
};

// Pre-save hook to update loyalty tier
customerDetailsSchema.pre('save', function(next) {
  if (this.isModified('totalSpent')) {
    this.loyaltyTier = this.calculateLoyaltyTier();
  }
  next();
});

const CustomerDetails = mongoose.model('CustomerDetails', customerDetailsSchema);
export default CustomerDetails;
