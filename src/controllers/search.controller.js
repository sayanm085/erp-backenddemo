import Item from '../model/Item.model.js'
import Dealer from '../model/Dealer.js';
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