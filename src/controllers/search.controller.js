import Item from '../model/Item.model.js'
import Dealer from '../model/Dealer.js';
import InventoryStock from '../model/InventoryStock.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiResponse} from '../utils/ApiResponse.js'



// Get search suggestions for items
// This endpoint returns item names that match the search query
export const getSearchSuggestions = asyncHandler(async (req, res) => {
    const query = req.query.q || "";
    const limit = parseInt(req.query.limit) || 10;
    
    // Return empty array for queries less than 1 character
    if (query.length < 1) {
        return res.status(200).json(
            new ApiResponse(200, { suggestions: [] }, "No suggestions")
        );
    }
    
    try {
        // Search by name OR barcode using a $or query
        const items = await Item.find({ 
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { barcode: { $regex: `^${escapeRegExp(query)}`, $options: 'i' } } // Starts with the query for barcode
            ]
        })
        .select('name barcode weight gstPercentage imageUrl currentQuantity costPrice salePrice')
        .limit(limit);
        
        const suggestions = processResults(items, query);
        
        return res.status(200).json(
            new ApiResponse(200, { 
                suggestions,
                query
            }, "Suggestions fetched successfully")
        );
    } catch (error) {
        console.error("Search error:", error);
        return res.status(500).json(
            new ApiResponse(500, null, "Error fetching search suggestions")
        );
    }
});

function processResults(items, query) {
    return items.map(item => {
        // Handle both mongoose documents and plain objects
        const itemObj = item.toObject ? item.toObject() : item;
        
        // Create a version with highlighted text
        const nameRegex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
        const barcodeRegex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
        
        // Check if the match is in the name or barcode
        const isNameMatch = nameRegex.test(itemObj.name);
        const isBarcodeMatch = barcodeRegex.test(itemObj.barcode);
        
        // Highlight the matching part in the name or show plain name
        const highlightedName = isNameMatch 
            ? itemObj.name.replace(nameRegex, '<strong>$1</strong>') 
            : itemObj.name;
            
        // Highlight the matching part in barcode
        const highlightedBarcode = isBarcodeMatch
            ? itemObj.barcode.replace(barcodeRegex, '<strong>$1</strong>')
            : itemObj.barcode;
        
        return {
            ...itemObj,
            highlightedName,
            highlightedBarcode,
            matchType: isNameMatch ? 'name' : (isBarcodeMatch ? 'barcode' : 'other')
        };
    });
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


// Get search suggestions for dealers// This endpoint returns dealer names and contact info that match the search query
// This is useful for quickly finding dealers by name, contact person, phone, or email
export const getDealerSearchSuggestions = asyncHandler(async (req, res) => {
    const query = req.query.q || "";
    const limit = parseInt(req.query.limit) || 10;
    
    // Return empty array for queries less than 1 character
    if (query.length < 1) {
        return res.status(200).json(
            new ApiResponse(200, { suggestions: [] }, "No suggestions")
        );
    }
    
    try {
        // Use regex search on multiple dealer fields
        const dealers = await Dealer.find({ 
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { contactPerson: { $regex: query, $options: 'i' } },
                { phone: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ],
            isActive: true // Only return active dealers
        })
        .select('name contactPerson phone email gstNumber city state')
        .limit(limit);
        
        const suggestions = processDealerResults(dealers, query);
        
        return res.status(200).json(
            new ApiResponse(200, { 
                suggestions,
                query
            }, "Dealer suggestions fetched successfully")
        );
    } catch (error) {
        console.error("Dealer search error:", error);
        return res.status(500).json(
            new ApiResponse(500, null, "Error fetching dealer suggestions")
        );
    }
});


function processDealerResults(dealers, query) {
    return dealers.map(dealer => {
        // Handle both mongoose documents and plain objects
        const dealerObj = dealer.toObject ? dealer.toObject() : dealer;
        
        // Create versions with highlighted text using regex
        const regex = new RegExp(`(${DealerescapeRegExp(query)})`, 'gi');
        
        // Highlight matches in name
        const highlightedName = dealerObj.name.replace(regex, '<strong>$1</strong>');
        
        // Highlight matches in contactPerson if it exists
        const highlightedContactPerson = dealerObj.contactPerson ? 
            dealerObj.contactPerson.replace(regex, '<strong>$1</strong>') : '';
            
        // Create a location display
        const locationDisplay = [dealerObj.city, dealerObj.state]
            .filter(Boolean)
            .join(', ');
        
        return {
            ...dealerObj,
            highlightedName,
            highlightedContactPerson,
            locationDisplay
        };
    });
}


function DealerescapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}




/**
 * Get search suggestions for inventory items
 * @route GET /api/inventory/search-suggestions
 * @access Private
 */
export const getInventorySearchSuggestions = asyncHandler(async (req, res) => {
    const query = req.query.q || "";
    const limit = parseInt(req.query.limit) || 10;

    if (query.length < 2) {
        return res.status(200).json(
            new ApiResponse(200, { suggestions: [] }, "No suggestions")
        );
    }

    try {
        // 1. Find by barcode
        let inventoryItems = await InventoryStock.find({
            barcode: { $regex: query, $options: 'i' }
        })
        .populate('item', 'name category brand description gstPercentage discountPercent')
        .select('barcode currentQuantity currentSalePrice status')
        .limit(limit);

        const foundByBarcode = inventoryItems.length > 0;

        // 2. Find by item fields if not enough
        if (inventoryItems.length < limit) {
            const remainingLimit = limit - inventoryItems.length;

            const matchingItems = await Item.find({
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { category: { $regex: query, $options: 'i' } },
                    { brand: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ]
            })
            .select('_id')
            .limit(remainingLimit);

            const itemIds = matchingItems.map(item => item._id);

            if (itemIds.length > 0) {
                const itemBasedResults = await InventoryStock.find({
                    item: { $in: itemIds },
                    ...(foundByBarcode
                        ? { barcode: { $nin: inventoryItems.map(item => item.barcode) } }
                        : {})
                })
                .populate('item', 'name category brand description gstPercentage discountPercent')
                .select('barcode currentQuantity currentSalePrice status')
                .limit(remainingLimit);

                inventoryItems = [...inventoryItems, ...itemBasedResults];
            }
        }

        // Filter out any records where item didn't populate
        const filteredItems = inventoryItems.filter(item => item.item);

        // === Build your required structure ===
        const suggestions = filteredItems.map(inventoryItem => ({
            _id: inventoryItem._id,
            itemId: inventoryItem.item._id,
            name: inventoryItem.item.name,
            barcode: inventoryItem.barcode,
            price: inventoryItem.currentSalePrice,
            quantity: inventoryItem.currentQuantity,
            status: inventoryItem.status,
            category: inventoryItem.item.category,
            brand: inventoryItem.item.brand,
            description: inventoryItem.item.description,
            gstPercentage: inventoryItem.item.gstPercentage || 0,
            discountPercent: inventoryItem.item.discountPercent || 0
        }));

        return res.status(200).json(
            new ApiResponse(200, { suggestions, query }, "Inventory suggestions fetched successfully")
        );
    } catch (error) {
        console.error("Inventory search error:", error);
        return res.status(500).json(
            new ApiResponse(500, null, "Error fetching inventory suggestions")
        );
    }
});

/**
 * Process inventory results to add highlighting and format for display
 */
function processInventoryResults(inventoryItems, query) {
    return inventoryItems.map(inventory => {
        // Handle both mongoose documents and plain objects
        const inventoryObj = inventory.toObject ? inventory.toObject() : inventory;
        const item = inventoryObj.item;
        
        if (!item) return null; // Skip if no related item (shouldn't happen with our filter)
        
        // Create versions with highlighted text using regex
        const regex = new RegExp(`(${escapeInventoryRegExp(query)})`, 'gi');
        
        // Highlight matches in name
        const highlightedName = item.name.replace(regex, '<strong>$1</strong>');
        
        // Highlight matches in barcode if it matches
        const highlightedBarcode = inventoryObj.barcode.replace(regex, '<strong>$1</strong>');
        
        // Highlight matches in category and brand if they exist
        const highlightedCategory = item.category ? 
            item.category.replace(regex, '<strong>$1</strong>') : '';
            
        const highlightedBrand = item.brand ? 
            item.brand.replace(regex, '<strong>$1</strong>') : '';
        
        // Create secondary information display (combine relevant attributes)
        const secondaryInfo = [
            item.brand,
            item.category,
            `₹${inventoryObj.currentSalePrice?.toFixed(2)}`
        ].filter(Boolean).join(' • ');
        
        // Create formatted stock status
        let stockStatus = "In Stock";
        let stockStatusClass = "text-green-600";
        
        if (inventoryObj.status === "low") {
            stockStatus = "Low Stock";
            stockStatusClass = "text-amber-500";
        } else if (inventoryObj.status === "out_of_stock") {
            stockStatus = "Out of Stock";
            stockStatusClass = "text-red-600";
        }
        
        return {
            _id: inventoryObj._id,
            itemId: item._id,
            name: item.name,
            barcode: inventoryObj.barcode,
            price: inventoryObj.currentSalePrice,
            quantity: inventoryObj.currentQuantity,
            status: inventoryObj.status,
            category: item.category,
            brand: item.brand,
            
            // Formatted fields for display
            highlightedName,
            highlightedBarcode,
            highlightedCategory,
            highlightedBrand,
            secondaryInfo,
            stockStatus,
            stockStatusClass
        };
    }).filter(Boolean); // Remove any null items
}

/**
 * Escape special characters in a string for use in a regular expression
 */
function escapeInventoryRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get comprehensive search results for inventory items
 * @route GET /api/search/inventory
 * @access Private
 */


export const searchInventory = asyncHandler(async (req, res) => {
        const barcode = req.params.barcode;
    
    if (!barcode) {
        return res.status(400).json(
            new ApiResponse(400, null, "Barcode is required")
        );
    }
    
    try {
        // Look for exact match in InventoryStock
        const inventoryItem = await InventoryStock.findOne({
            barcode: barcode // Exact match, not regex
        })
        .populate('item', 'name category brand description salePrice gstPercentage discountPercent')
        .select('barcode currentQuantity currentSalePrice status');
        
        // If found, return the product details
        if (inventoryItem && inventoryItem.item) {
            // Format response
            const itemDetails = {
                _id: inventoryItem._id,
                itemId: inventoryItem.item._id,
                name: inventoryItem.item.name,
                barcode: inventoryItem.barcode,
                price: inventoryItem.currentSalePrice,
                quantity: inventoryItem.currentQuantity,
                status: inventoryItem.status,
                category: inventoryItem.item.category,
                brand: inventoryItem.item.brand,
                description: inventoryItem.item.description,
                gstPercentage: inventoryItem.item.gstPercentage || 0,
                discountPercent: inventoryItem.item.discountPercent || 0
            };
            
            return res.status(200).json(
                new ApiResponse(200, itemDetails, "Product found")
            );
        }
        
        // If not found in main barcode, check for child barcodes if your system supports them
        // This is a placeholder for child barcode lookup - implement according to your data model
        
        // If not found anywhere, return not found
        return res.status(404).json(
            new ApiResponse(404, null, "Product not found with barcode: " + barcode)
        );
    } catch (error) {
        console.error("Barcode search error:", error);
        return res.status(500).json(
            new ApiResponse(500, null, "Error searching for product")
        );
    }
});



