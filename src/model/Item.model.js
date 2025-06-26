import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema({
  // Basic item information
  name: { 
    type: String, 
    required: [true, "Item name is required"], 
    trim: true 
  },
  
  // Barcode (optional but unique if provided)
  barcode: { 
    type: String, 
    unique: true, 
    sparse: true,
    trim: true
  },
  
  // Weight/Volume information
  weight: { 
    value: { 
      type: Number, 
      required: [true, "Weight/volume value is required"] 
    },
    unit: { 
      type: String, 
      required: [true, "Weight/volume unit is required"],
      enum: ["kg", "gm", "litre", "ml", "pcs"],
      default: "kg" 
    }
  },
  
  // GST percentage
  gstPercentage: { 
    type: Number, 
    required: [true, "GST percentage is required"],
    min: 0,
    max: 28 // Maximum GST slab in India
  },
  
  // Item image (URL)
  imageUrl: { 
    type: String,
    default: "/images/default-item.png" // Default image path
  },
  
  // Metadata (created/updated)
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  createdBy: { 
    type: String,
    required: true
  }
});

// Update timestamp before saving
ItemSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  next();
});

// Create model (with hot reload safety for Next.js)
const Item = mongoose.models.Item || mongoose.model("Item", ItemSchema);

export default Item;