import Item from '../model/Item.model.js'
import PurchaseOrderByDealer from '../model/PurchaseOrderByDealer.js'
import InventoryStock from '../model/InventoryStock.js'
import InventoryBatch from '../model/InventoryBatch.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiResponse} from '../utils/ApiResponse.js'


export const addItem = asyncHandler(async (req, res) => {
    // Extract item details from request body
    const {
        name,
        barcode,
        weight: { value, unit } = {}, // Destructuring with default empty object
        gstPercentage,
        imageUrl
    } = req.body;

    // Validation checks
    if (!name || name.trim() === "") {
        throw new ApiError(400, "Item name is required");
    }

    if (!value || !unit) {
        throw new ApiError(400, "Weight/volume value and unit are required");
    }

    if (!gstPercentage && gstPercentage !== 0) {
        throw new ApiError(400, "GST percentage is required");
    }

    // Check if barcode already exists (if provided)
    if (barcode) {
        const existingItem = await Item.findOne({ barcode });
        if (existingItem) {
            throw new ApiError(409, "Item with this barcode already exists");
        }
    }

    // Create new item
    const newItem = await Item.create({
        name,
        barcode,
        weight: {
            value,
            unit
        },
        gstPercentage,
        imageUrl: imageUrl || "/images/default-item.png",
        createdBy: req.user?.username || "sayanm085", // Use authenticated user or default
        createdAt: new Date(),
        updatedAt: new Date()
    });

    // Return success response with created item
    return res.status(201).json(
        new ApiResponse(
            201,
            newItem,
            "Item added successfully"
        )
    );
});



export const getAllItems = asyncHandler(async (req, res) => {
    // Implement pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Optional search filter
    const searchQuery = req.query.search 
        ? { name: { $regex: req.query.search, $options: 'i' } }
        : {};

    // Get items with pagination
    const items = await Item.find(searchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    // Get total count for pagination info
    const totalItems = await Item.countDocuments(searchQuery);

    return res.status(200).json(
        new ApiResponse(
            200, 
            {
                items,
                pagination: {
                    total: totalItems,
                    page,
                    limit,
                    pages: Math.ceil(totalItems / limit)
                }
            },
            "Items fetched successfully"
        )
    );
});


export const getItemById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const item = await Item.findById(id);
    
    if (!item) {
        throw new ApiError(404, "Item not found");
    }
    
    return res.status(200).json(
        new ApiResponse(200, item, "Item fetched successfully")
    );
});


export const updateItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Check if item exists
    const existingItem = await Item.findById(id);
    if (!existingItem) {
        throw new ApiError(404, "Item not found");
    }
    
    // Check if barcode is already in use by another item
    if (req.body.barcode && req.body.barcode !== existingItem.barcode) {
        const barcodeExists = await Item.findOne({ 
            barcode: req.body.barcode,
            _id: { $ne: id } // Exclude current item
        });
        
        if (barcodeExists) {
            throw new ApiError(409, "Barcode already in use by another item");
        }
    }
    
    // Update the item
    const updatedItem = await Item.findByIdAndUpdate(
        id,
        {
            ...req.body,
            updatedAt: new Date(),
            updatedBy: req.user?.username || "sayanm085"
        },
        { new: true, runValidators: true }
    );
    
    return res.status(200).json(
        new ApiResponse(200, updatedItem, "Item updated successfully")
    );
});


export const deleteItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const item = await Item.findByIdAndDelete(id);
    
    if (!item) {
        throw new ApiError(404, "Item not found");
    }
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Item deleted successfully")
    );
});




















