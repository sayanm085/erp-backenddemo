import Item from '../model/Item.model.js';
import PurchaseOrderByDealer from '../model/PurchaseOrderByDealer.js';
import InventoryStock from '../model/InventoryStock.js';
import InventoryBatch from '../model/InventoryBatch.js';
import ItemSale from '../model/ItemSale.js';
import Dealer from '../model/Dealer.js';
import CustomerDetails from '../model/CustomerDetails.js';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

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




// Controller for purchasing products by dealer
export const purchaseProductByDealer = asyncHandler(async (req, res) => {
    // Start a MongoDB session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Extract basic purchase order data
        const { 
            dealerId, 
            poNumber, 
            expectedDeliveryDate, 
            paymentTerms = "Net 30", 
            items = [],
            notes 
        } = req.body;

        // Step 1: Validate required fields
        if (!dealerId || !poNumber || !expectedDeliveryDate || !items || items.length === 0) {
            throw new ApiError(400, "Missing required fields for purchase order");
        }

        // Step 2: Verify dealer exists
        const dealer = await Dealer.findById(dealerId).session(session);
        if (!dealer) {
            throw new ApiError(404, "Dealer not found");
        }

        // Step 3: Process each item in the purchase order
        const processedItems = [];
        let subtotal = 0;
        let taxAmount = 0;

        for (const itemData of items) {
            // Extract item details
            const { 
                itemId, 
                name, 
                barcode, 
                weight, 
                gstPercentage = 0,
                quantity, 
                unitPrice,
                salePrice,
                expiryDate
            } = itemData;

            // Validate required item fields
            if (!quantity || quantity <= 0 || !unitPrice || unitPrice <= 0) {
                throw new ApiError(400, "Each item must have valid quantity and unit price");
            }

            let item;
            
            // Step 3a: If itemId provided, verify item exists
            if (itemId) {
                item = await Item.findById(itemId).session(session);
                if (!item) {
                    throw new ApiError(404, `Item with ID ${itemId} not found`);
                }
            } 
            // Step 3b: If no itemId but name and barcode provided, create new item
            else if (name && barcode && weight) {
                // Check if barcode already exists to avoid duplicates
                const existingItem = await Item.findOne({ barcode }).session(session);
                
                if (existingItem) {
                    item = existingItem;
                } else {
                    // Create new item
                    item = new Item({
                        name,
                        barcode,
                        weight,
                        gstPercentage,
                        createdBy: req.user?.username || "admin"
                    });
                    
                    await item.save({ session });
                }
            } else {
                throw new ApiError(400, "Item details required (itemId or complete item data)");
            }

            // Step 4: Calculate item total
            const itemTotal = quantity * unitPrice;
            const itemGstAmount = (itemTotal * (item.gstPercentage || gstPercentage)) / 100;
            
            // Add to totals
            subtotal += itemTotal;
            taxAmount += itemGstAmount;

            // Add to processed items
            processedItems.push({
                item: item._id,
                quantity,
                unitPrice,
                gstPercentage: item.gstPercentage || gstPercentage,
                totalPrice: itemTotal + itemGstAmount
            });

            // Step 5: Smart inventory management with barcode logic
            
            // First, find inventory with the original/default barcode
            const originalInventory = await InventoryStock.findOne({ 
                item: item._id,
                barcode: item.barcode // This is the default/original barcode
            }).session(session);
            
            // Find any inventory with matching cost and sale price
            const matchingPriceInventory = await InventoryStock.findOne({
                item: item._id,
                currentCostPrice: unitPrice,
                currentSalePrice: salePrice || (unitPrice * 1.2)
            }).session(session);
            
            let inventoryStock;
            let isNewInventoryRecord = false;
            let finalBarcode;
            
            // Case 1: No inventory exists yet - create first one with original barcode
            if (!originalInventory) {
                finalBarcode = item.barcode; // Use original barcode
                inventoryStock = new InventoryStock({
                    item: item._id,
                    barcode: finalBarcode,
                    currentQuantity: 0,
                    currentCostPrice: unitPrice,
                    currentSalePrice: salePrice || (unitPrice * 1.2),
                    averageCostPrice: unitPrice,
                    minimumStockLevel: 10,
                    lastUpdatedBy: req.user?.username || "admin"
                });
                isNewInventoryRecord = true;
                console.log(`Created first inventory record with original barcode ${finalBarcode}`);
            }
            // Case 2: Original inventory exists but is out of stock AND no existing inventory with matching price
            else if (originalInventory.currentQuantity <= 0 && !matchingPriceInventory) {
                // Reuse the original barcode since it's out of stock
                finalBarcode = originalInventory.barcode;
                inventoryStock = originalInventory;
                inventoryStock.currentCostPrice = unitPrice;
                inventoryStock.currentSalePrice = salePrice || (unitPrice * 1.2);
                inventoryStock.averageCostPrice = unitPrice; // Reset average cost
                
                console.log(`Reusing original barcode ${finalBarcode} as it's out of stock`);
            }
            // Case 3: Matching price inventory exists - use it
            else if (matchingPriceInventory) {
                finalBarcode = matchingPriceInventory.barcode;
                inventoryStock = matchingPriceInventory;
                console.log(`Using existing inventory with matching price, barcode: ${finalBarcode}`);
            }
            // Case 4: Original inventory exists with stock AND price is different - create child barcode
            else if (originalInventory.currentQuantity > 0 && 
                     (originalInventory.currentCostPrice !== unitPrice || 
                      originalInventory.currentSalePrice !== salePrice)) {
                
                // Generate child barcode
                const timestamp = Date.now().toString().slice(-6);
                finalBarcode = `${item.barcode}-${timestamp}`;
                
                // Create new inventory with child barcode
                inventoryStock = new InventoryStock({
                    item: item._id,
                    barcode: finalBarcode,
                    currentQuantity: 0,
                    currentCostPrice: unitPrice,
                    currentSalePrice: salePrice || (unitPrice * 1.2),
                    averageCostPrice: unitPrice,
                    minimumStockLevel: 10,
                    lastUpdatedBy: req.user?.username || "admin"
                });
                isNewInventoryRecord = true;
                console.log(`Created child barcode ${finalBarcode} due to price difference while original stock exists`);
            }
            // Case 5: Original inventory exists with stock AND price is the same - use it
            else {
                finalBarcode = originalInventory.barcode;
                inventoryStock = originalInventory;
                console.log(`Using original barcode ${finalBarcode} with same price`);
            }
            
            // Calculate previous quantity before update
            const previousQuantity = inventoryStock.currentQuantity;
            
            // Update inventory stock with new quantity
            inventoryStock.currentQuantity += quantity;
            
            // Update average cost if it's not a new inventory
            if (!isNewInventoryRecord && inventoryStock.currentQuantity > quantity) {
                const previousTotal = previousQuantity * inventoryStock.averageCostPrice;
                const newTotal = quantity * unitPrice;
                inventoryStock.averageCostPrice = (previousTotal + newTotal) / inventoryStock.currentQuantity;
            }
            
            await inventoryStock.save({ session });
            
            // Step 6: Create InventoryBatch record for purchase history
            // Generate a unique batch number
            const timestamp = Date.now();
            const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            const itemPrefix = item.name.substring(0, 3).toUpperCase().replace(/\s+/g, '');
            const batchNumber = `${itemPrefix}-${timestamp.toString().slice(-6)}-${randomPart}`;
            
            // Create batch record to track this purchase event
            const newBatch = new InventoryBatch({
                item: item._id,
                inventoryStock: inventoryStock._id, // Reference to the inventory stock
                barcode: finalBarcode, // The barcode used
                remainingQuantity: quantity,
                originalQuantity: quantity,
                costPrice: unitPrice,
                salePrice: salePrice || (unitPrice * 1.2),
                purchaseDate: new Date(),
                purchaseReference: poNumber,
                batchNumber,
                expiryDate: expiryDate || null,
                isActive: true,
                createdBy: req.user?.username || "admin"
            });
            
            await newBatch.save({ session });
            console.log(`Created batch record ${batchNumber} for tracking purchase history`);
        }

        // Step 7: Create the purchase order
        const totalAmount = subtotal + taxAmount;
        
        const purchaseOrder = new PurchaseOrderByDealer({
            poNumber,
            dealer: dealerId,
            orderDate: new Date(),
            expectedDeliveryDate: new Date(expectedDeliveryDate),
            status: 'pending',
            items: processedItems,
            paymentTerms,
            financials: {
                subtotal,
                taxAmount,
                discountAmount: 0,
                totalAmount
            },
            notes,
            createdBy: req.user?.username || "admin"
        });
        
        await purchaseOrder.save({ session });
        
        // Commit transaction
        await session.commitTransaction();
        
        // Return success response
        return res.status(201).json(
            new ApiResponse(
                201,
                {
                    purchaseOrder: {
                        _id: purchaseOrder._id,
                        poNumber: purchaseOrder.poNumber,
                        dealerName: dealer.name,
                        totalAmount: purchaseOrder.financials.totalAmount,
                        itemCount: purchaseOrder.items.length
                    }
                },
                "Purchase order created successfully"
            )
        );
        
    } catch (error) {
        // If anything fails, abort transaction
        await session.abortTransaction();
        
        // Handle specific error types
        if (error instanceof ApiError) {
            throw error;
        }
        
        // Log error for debugging
        console.error("Purchase order creation failed:", error);
        
        // Return a generic error
        throw new ApiError(500, "Failed to create purchase order. Please try again.");
    } finally {
        // End session
        session.endSession();
    }
});

// This controller retrieves all purchase orders for a specific dealer
export const getPurchaseOrderById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid purchase order ID");
    }
    
    const purchaseOrder = await PurchaseOrderByDealer.findById(id)
        .populate('dealer', 'name contactPerson phone')
        .populate('items.item', 'name barcode');
    
    if (!purchaseOrder) {
        throw new ApiError(404, "Purchase order not found");
    }
    
    return res.status(200).json(
        new ApiResponse(
            200,
            { purchaseOrder },
            "Purchase order retrieved successfully"
        )
    );
});

// Controller to get all purchase orders by dealer
export const getItemInventory = asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
        throw new ApiError(400, "Invalid item ID");
    }
    
    // Get current inventory state
    const inventory = await InventoryStock.findOne({ item: itemId })
        .populate('item', 'name barcode gstPercentage');
    
    if (!inventory) {
        throw new ApiError(404, "Inventory record not found for this item");
    }
    
    // Get active batches
    const batches = await InventoryBatch.find({
        item: itemId,
        isActive: true,
        remainingQuantity: { $gt: 0 }
    }).sort({ purchaseDate: 1 });
    
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                inventory: {
                    item: inventory.item,
                    currentQuantity: inventory.currentQuantity,
                    averageCostPrice: inventory.averageCostPrice,
                    currentCostPrice: inventory.currentCostPrice,
                    currentSalePrice: inventory.currentSalePrice,
                    status: inventory.status
                },
                batches: batches.map(batch => ({
                    batchNumber: batch.batchNumber,
                    remainingQuantity: batch.remainingQuantity,
                    costPrice: batch.costPrice,
                    purchaseDate: batch.purchaseDate,
                    expiryDate: batch.expiryDate
                }))
            },
            "Item inventory retrieved successfully"
        )
    );
});




// item sells controller

export const createOrder = asyncHandler(async (req, res) => {
  const { items, counterNumber, customerDetails } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Items array is required and cannot be empty");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Handle customer - use existing or create new if not found
    let customerId = null;
    if (customerDetails) {
      if (customerDetails.id) {
        // Use existing by id
        const existingCustomer = await CustomerDetails.findById(customerDetails.id).session(session);
        if (!existingCustomer) {
          throw new ApiError(404, "Customer not found with the provided ID");
        }
        customerId = customerDetails.id;
      } else if (customerDetails.phone) {
        // Use existing by phone, or create new
        let existingCustomer = await CustomerDetails.findOne({ phone: customerDetails.phone }).session(session);
        if (existingCustomer) {
          customerId = existingCustomer._id;
          if (customerDetails.name && !existingCustomer.name) {
            existingCustomer.name = customerDetails.name;
          }
          if (customerDetails.email && !existingCustomer.email) {
            existingCustomer.email = customerDetails.email;
          }
          existingCustomer.totalVisits += 1;
          existingCustomer.lastVisitDate = new Date();
          await existingCustomer.save({ session });
        } else {
          const newCustomer = await CustomerDetails.create([{
            name: customerDetails.name || "Guest",
            phone: customerDetails.phone,
            email: customerDetails.email || null,
            address: customerDetails.address || {},
            registrationDate: new Date(),
            totalVisits: 1,
            lastVisitDate: new Date()
          }], { session });
          customerId = newCustomer[0]._id;
        }
      }
    }

    // Prepare order totals and items
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    const processedItems = [];

    // Validate and prepare all items first, collect matched stock records for later atomic update
    const stockUpdates = [];
    for (const cartItem of items) {
      // Find item by itemId or barcode
      let item;
      if (cartItem.itemId) {
        item = await Item.findById(cartItem.itemId).session(session);
      } else if (cartItem.barcode) {
        item = await Item.findOne({ barcode: cartItem.barcode }).session(session);
        // If not found, look in inventory stock
        if (!item) {
          const inventoryItem = await InventoryStock.findOne({ barcode: cartItem.barcode })
            .populate('item')
            .session(session);
          if (inventoryItem) item = inventoryItem.item;
        }
      }
      if (!item) throw new ApiError(404, `Item not found: ${cartItem.itemId || cartItem.barcode}`);

      // Find the InventoryStock record for the EXACT barcode in the cart
      const stock = await InventoryStock.findOne({ barcode: cartItem.barcode }).session(session);
      if (!stock) {
        throw new ApiError(400, `Inventory stock not found for barcode: ${cartItem.barcode}`);
      }
      if (stock.currentQuantity < cartItem.quantity) {
        throw new ApiError(400, `Insufficient stock for ${item.name} (barcode: ${cartItem.barcode}). Available: ${stock.currentQuantity}`);
      }

      // Calculate item price/tax/discount
      const price = item.salePrice || stock.currentSalePrice || 0;
      const gstPercentage = item.gstPercentage || 0;
      const taxAmount = (price * cartItem.quantity * gstPercentage) / 100;
      const discountPercent = cartItem.applyDiscount ? (item.discountPercent || 0) : 0;
      const discountAmount = (price * cartItem.quantity * discountPercent) / 100;
      const totalItemPrice = (price * cartItem.quantity) - discountAmount;

      subtotal += price * cartItem.quantity;
      totalTax += taxAmount;
      totalDiscount += discountAmount;

      processedItems.push({
        itemId: item._id,
        name: item.name,
        barcode: cartItem.barcode, // always use the sold barcode, not the main item barcode
        quantity: cartItem.quantity,
        price: price,
        gstPercentage: gstPercentage,
        taxAmount: taxAmount,
        discountPercent: discountPercent,
        discountAmount: discountAmount,
        totalPrice: totalItemPrice
      });

      stockUpdates.push({ stock, quantity: cartItem.quantity });
    }

    // Calculate order total
    const total = subtotal + totalTax - totalDiscount;

    // Create new sale order
    const newSale = await ItemSale.create([{
      date: new Date(),
      items: processedItems,
      subtotal: subtotal,
      taxAmount: totalTax,
      discountAmount: totalDiscount,
      total: total,
      status: "in_progress",
      counterNumber: counterNumber || 1,
      createdBy: req.user?._id || null,
      customerId: customerId
    }], { session });

    // Now decrement stock for each sold barcode
    for (const { stock, quantity } of stockUpdates) {
      stock.currentQuantity -= quantity;
      await stock.save({ session });
    }

    await session.commitTransaction();

    return res.status(201).json(
      new ApiResponse(201, newSale[0], "Sale order created successfully")
    );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

/**
 * @description Complete a sale with payment and update inventory
 * @route POST /api/sales/:saleId/complete-transaction
 * @access Private
 */
export const completeTransaction = asyncHandler(async (req, res) => {
  const { saleId } = req.params;
  const { 
    paymentMethod, 
    amountReceived,
    cardDetails,
    upiTransactionId,
    loyaltyPointsUsed = 0,
    additionalDiscount = 0
  } = req.body;
  
  console.log("Complete transaction request:", {
    saleId,
    paymentMethod,
    amountReceived,
    cardDetails,

    upiTransactionId,
    loyaltyPointsUsed,
    additionalDiscount
  });
  // Validate payment method
  const validPaymentMethods = ['cash', 'card', 'upi'];
  if (!validPaymentMethods.includes(paymentMethod)) {
    throw new ApiError(400, "Invalid payment method. Must be cash, card, or upi");
  }
  if (paymentMethod === 'cash' && (!amountReceived || amountReceived <= 0)) {
    throw new ApiError(400, "Amount received is required for cash payments");
  }
  if (paymentMethod === 'card' && !cardDetails) {
    throw new ApiError(400, "Card details are required for card payments");
  }
  if (paymentMethod === 'upi' && !upiTransactionId) {
    throw new ApiError(400, "UPI transaction ID is required for UPI payments");
  }
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const sale = await ItemSale.findById(saleId).session(session);
    if (!sale) throw new ApiError(404, "Sale not found");
    if (sale.status !== 'in_progress') throw new ApiError(400, `This sale is already ${sale.status}`);
    
    // Apply discount
    if (additionalDiscount > 0) {
      sale.additionalDiscount = additionalDiscount;
      sale.total = sale.total - additionalDiscount;
      if (sale.total < 0) sale.total = 0;
    }
    
    // Handle loyalty points
    if (loyaltyPointsUsed > 0 && sale.customerId) {
      const customer = await CustomerDetails.findById(sale.customerId).session(session);
      if (!customer) throw new ApiError(404, "Customer not found");
      if (customer.loyaltyPoints < loyaltyPointsUsed) {
        throw new ApiError(400, `Customer only has ${customer.loyaltyPoints} loyalty points available`);
      }
      const pointsDiscount = loyaltyPointsUsed * 0.25;
      sale.pointsDiscount = pointsDiscount;
      sale.loyaltyPointsUsed = loyaltyPointsUsed;
      sale.total = sale.total - pointsDiscount;
      if (sale.total < 0) sale.total = 0;
      customer.loyaltyPoints -= loyaltyPointsUsed;
      await customer.save({ session });
    }
    
    // Calculate change for cash payments
    let change = 0;
    if (paymentMethod === 'cash') {
      change = parseFloat(amountReceived) - sale.total;
      if (change < 0) throw new ApiError(400, "Insufficient amount received");
    }
    
    // Inventory update: always try barcode first, then item, then itemId
    for (const item of sale.items) {
      let updateResult = null;
      if (item.barcode) {
        updateResult = await InventoryStock.findOneAndUpdate(
          { barcode: item.barcode },
          { $inc: { currentQuantity: -item.quantity } },
          { session }
        );
      }
      if (!updateResult) {
        updateResult = await InventoryStock.findOneAndUpdate(
          { item: item.itemId },
          { $inc: { currentQuantity: -item.quantity } },
          { session }
        );
      }
      if (!updateResult) {
        updateResult = await InventoryStock.findOneAndUpdate(
          { itemId: item.itemId },
          { $inc: { currentQuantity: -item.quantity } },
          { session }
        );
      }
      if (!updateResult) {
        throw new ApiError(500, `Failed to update inventory for item: ${item.name} (barcode: ${item.barcode || ''})`);
      }
    }
    
    // Payment details
    sale.paymentMethod = paymentMethod;
    sale.paymentDetails = {
      amountReceived: paymentMethod === 'cash' ? parseFloat(amountReceived) : sale.total,
      change: paymentMethod === 'cash' ? change : 0,
      cardDetails: paymentMethod === 'card' ? cardDetails : null,
      upiTransactionId: paymentMethod === 'upi' ? upiTransactionId : null
    };
    sale.status = 'completed';
    sale.completedAt = new Date();
    
    // Generate invoice number
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    sale.invoiceNumber = `INV-${year}${month}${day}-${randomNum}`;
    
    await sale.save({ session });
    
    // Loyalty points earn
    if (sale.customerId) {
      const pointsEarned = Math.floor(sale.total / 100); // 1 point for every 100 spent
      await CustomerDetails.findByIdAndUpdate(
        sale.customerId,
        {
          $inc: { totalSpent: sale.total, loyaltyPoints: pointsEarned },
          lastVisitDate: new Date()
        },
        { session }
      );
      sale._doc.pointsEarned = pointsEarned;
    }
    
    await session.commitTransaction();
    return res.status(200).json(
      new ApiResponse(200, sale, "Transaction completed successfully")
    );
  } catch (error) {
    await session.abortTransaction();

    // This ensures backend always sends a message or error property
    if (error instanceof ApiError) {
      return res.status(error.statusCode || 500).json({
        statusCode: error.statusCode,
        error: error.message,
        success: false,
        message: error.message,
      });
    } else {
      return res.status(500).json({
        statusCode: 500,
        error: error.message || "Internal Server Error",
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  } finally {
    session.endSession();
  }
});



















