const Task =  require("../models/Task");
const User = require("../models/User");



// @desc  Get all users (Admin Only)
// @route Get /api/users/
// @access Private( Admin) 

const getUsers = async (req, res) => {

        try {
            const users = await User.find().select('-password'); // exclude password
            res.json(users);
        } catch (error) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    };
    



// @desc  Get user by ID
// @route Get /api/users/:id
// @access Private
const getUserById = async(req, res) => {
    try {
         const user = await User.findById(res.params.id).select("-password"); // res.params should be req.params
         if(!user) return res.status(404).json({ message: "User not found"})
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message});
    }
};




module.exports = { getUsers, getUserById, }