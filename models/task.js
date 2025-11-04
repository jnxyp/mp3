const mongoose = require('mongoose');
const taskSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    deadline: { type: Date, required: true },
    completed: { type: Boolean, default: false },
    assignedUser: {
        type: String,
        default: ''
    },
    assignedUserName: { type: String, default: 'unassigned' },
    dateCreated: { type: Date, default: Date.now }
});

// Update assignedUserName when assignedUser changes
taskSchema.pre('save', async function (next) {
  if (this.isModified('assignedUser') && this.assignedUser) {
    try {
      const user = await mongoose.model('User').findById(this.assignedUser);
      this.assignedUserName = user ? user.name : 'unassigned';
    } catch (err) {
      this.assignedUserName = 'unassigned';
    }
  } else if (!this.assignedUser) {
    this.assignedUserName = 'unassigned';
  }
  next();
});


// Export the Mongoose model
module.exports = mongoose.model('Task', taskSchema);
