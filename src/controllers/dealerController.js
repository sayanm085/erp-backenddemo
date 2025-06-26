import Dealer from '../model/Dealer.js';
import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiResponse} from '../utils/ApiResponse.js'

// Get all dealers
export const getAllDealers = async (req, res) => {
  try {
    const dealers = await Dealer.find({ isActive: true });
    res.status(200).json({
      success: true,
      count: dealers.length,
      data: dealers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dealers'
    });
  }
};

// Create new dealer
export const createDealer = async (req, res) => {
  try {
    const dealer = await Dealer.create(req.body);
    res.status(201).json({
      success: true,
      data: dealer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get dealer by ID
export const getDealerById = async (req, res) => {
  try {
    const dealer = await Dealer.findById(req.params.id);
    
    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: 'Dealer not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: dealer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dealer'
    });
  }
};

// Update dealer
export const updateDealer = async (req, res) => {
  try {
    const dealer = await Dealer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: 'Dealer not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: dealer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete dealer (soft delete by marking inactive)
export const deleteDealer = async (req, res) => {
  try {
    const dealer = await Dealer.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: 'Dealer not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete dealer'
    });
  }
};

export const getSearchSuggestions = (req, res) => {
  console.log("Suggestions endpoint called");
  
  res.json({
    success: true,
    data: ["Test suggestion"],
    message: "Route is working correctly"
  });
};
