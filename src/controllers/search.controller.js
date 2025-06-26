import Item from '../model/Item.model.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiResponse} from '../utils/ApiResponse.js'

/**
 * Get search suggestions as user types
 * @route GET /api/search/suggestions
 * @access Public
 */
export const getSearchSuggestions = asyncHandler(async (req, res) => {
    const query = req.query.q || "";
    const limit = parseInt(req.query.limit) || 10;
    
    // Return empty array for queries less than 1 character
    if (query.length < 1) {
        return res.status(200).json(
            new ApiResponse(200, { suggestions: [] }, "No suggestions")
        );
    }
    
    // Options for mongoose-paginate-v2
    const options = {
        limit,
        sort: { score: { $meta: "textScore" } },
        select: 'name barcode weight gstPercentage imageUrl'
    };
    
    // Two-pronged search approach:
    // 1. First try with text index for better relevance
    // 2. If not enough results, use regex for partial matching
    
    // Text search first (better relevance but requires whole words)
    const textSearchOptions = {
        ...options,
        // Use MongoDB's text search capabilities
        score: { $meta: "textScore" }
    };
    
    // Regular expression search (better for partial words)
    const regexSearchOptions = {
        ...options
    };
    
    try {
        // Try text search first (more relevant, but requires complete words)
        const textResults = await Item.paginate(
            { $text: { $search: query } }, 
            textSearchOptions
        );
        
        // If we have enough results from text search, use those
        if (textResults.docs.length >= 3) {
            const suggestions = processResults(textResults.docs, query);
            
            return res.status(200).json(
                new ApiResponse(200, { 
                    suggestions,
                    query
                }, "Suggestions fetched successfully")
            );
        }
        
        // Otherwise fall back to regex search for partial matches
        const regexResults = await Item.paginate(
            { name: { $regex: query, $options: 'i' } }, 
            regexSearchOptions
        );
        
        const suggestions = processResults(regexResults.docs, query);
        
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

/**
 * Process search results to highlight matching portions
 * @param {Array} items - Array of items from database
 * @param {String} query - Search query
 * @returns {Array} - Processed items with highlighted names
 */
function processResults(items, query) {
    return items.map(item => {
        const itemObj = item.toObject();
        
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

/**
 * Escape special regex characters in user input
 * @param {String} string - String to escape
 * @returns {String} - Escaped string
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}