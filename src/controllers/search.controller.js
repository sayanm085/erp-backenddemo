import Item from '../model/Item.model.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiResponse} from '../utils/ApiResponse.js'


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
        // Skip text search and just use regex search which doesn't require text index
        const items = await Item.find({ 
            name: { $regex: query, $options: 'i' } 
        })
        .select('name barcode weight gstPercentage imageUrl')
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
        
        // Create a version with highlighted text using regex
        // This is similar to how Amazon highlights matching portions
        const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
        const highlightedName = itemObj.name.replace(regex, '<strong>$1</strong>');
        
        return {
            ...itemObj,
            highlightedName
        };
    });
}


function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}