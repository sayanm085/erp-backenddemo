/**
 * Current Date and Time (UTC): 2025-06-26 19:04:49
 * Current User's Login: sayanm085
 */

import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
const { Schema } = mongoose;

// Define the Dealer schema for grocery supplier tracking
const dealerSchema = new Schema({
  // Basic information
  name: {
    type: String,
    required: [true, 'Dealer name is required'],
    trim: true,
    index: true // Add index directly here
  },
  contactPerson: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    index: true // Add index directly here
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        // Allow empty email or valid email
        return v === '' || /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address`
    }
  },
  
  // Address information
  address: String,
  city: {
    type: String,
    trim: true,
    index: true // Add index directly here
  },
  state: {
    type: String,
    trim: true,
    index: true // Add index directly here
  },
  pincode: {
    type: String,
    trim: true
  },
  
  // Business details
  gstNumber: {
    type: String,
    trim: true,
    uppercase: true,
    index: true // Add index directly here
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
    index: true // Important for filtering active dealers
  },
  
  // Optional metadata
  notes: String,
  
  // Dealer product information
  supplyCategories: {
    type: [String],
    index: true // Add index directly here
  },
  
  // Last order details
  lastOrderDate: {
    type: Date,
    index: true // Add index for sorting by recent orders
  },
  lastOrderAmount: Number,
  
  // Payment history
  outstandingAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Add pagination plugin
dealerSchema.plugin(mongoosePaginate);

// Add compound index for city and state (for location-based searches)
dealerSchema.index({ city: 1, state: 1 });

// Add compound index for search functionality
dealerSchema.index({ 
  name: 'text', 
  contactPerson: 'text',
  city: 'text',
  state: 'text'
});

// Add a static method to find dealers by search query
dealerSchema.statics.findBySearchTerm = function(term, limit = 10) {
  const regex = new RegExp(term, 'i');
  
  return this.find({
    isActive: true,
    $or: [
      { name: regex },
      { contactPerson: regex },
      { phone: regex },
      { gstNumber: regex }
    ]
  })
  .select('name contactPerson phone gstNumber city state supplyCategories')
  .limit(limit);
};

// Add a static method to get dealer suggestions
dealerSchema.statics.getSuggestions = function(query, limit = 10) {
  if (!query) {
    return this.find({ isActive: true })
      .sort({ name: 1 })
      .limit(limit)
      .select('name contactPerson phone gstNumber city state supplyCategories');
  }
  
  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  
  return this.find({
    isActive: true,
    $or: [
      { name: regex },
      { contactPerson: regex }
    ]
  })
  .select('name contactPerson phone gstNumber city state supplyCategories')
  .sort({ name: 1 })
  .limit(limit);
};

// Method to get active dealers with pagination
dealerSchema.statics.getActiveDealers = function(page = 1, limit = 20) {
  return this.paginate(
    { isActive: true },
    { page, limit, sort: { name: 1 } }
  );
};

// Compile the model
const Dealer = mongoose.model('Dealer', dealerSchema);

// Export the model
export default Dealer;