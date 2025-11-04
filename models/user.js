// Load required packages
const mongoose = require('mongoose');

// Define our user schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    pendingTasks: [String],
    dateCreated: { type: Date, default: Date.now }
});

userSchema.post('save', async function (doc) {
  await mongoose.model('Task').updateMany(
    { assignedUser: doc._id },
    { assignedUserName: doc.name }
  );
});

// Export the Mongoose model
module.exports = mongoose.model('User', userSchema);
