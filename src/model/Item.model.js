import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const weightSchema = new mongoose.Schema({
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'gm', 'litre', 'ml', 'pcs']
  }
});

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      index: true // Add index for faster search
    },
    barcode: {
      type: String,
      required: [true, "Barcode is required"],
      unique: true,
      trim: true
    },
    weight: {
      type: weightSchema,
      required: true
    },
    gstPercentage: {
      type: Number,
      required: [true, "GST percentage is required"],
      default: 0
    },
    imageUrl: {
      type: String,
      default: "https://via.placeholder.com/150"
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

// Add text index for better search performance
itemSchema.index({ name: 'text' });

// Add pagination plugin
itemSchema.plugin(mongoosePaginate);

const Item = mongoose.model("Item", itemSchema);
export default Item;