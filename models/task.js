const mongoose = require('mongoose');
const taskSchema = new mongoose.Schema({
    name: String,
    description: String,
    deadline: Date,
    completed: { type: Boolean, default: false },
    assignedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    assignedUserName: { type: String, default: 'unassigned' },
    dateCreated: { type: Date, default: Date.now }
});

taskSchema.pre('save', async function (next) {
  if (this.isModified('assignedUser')) {
    if (this.assignedUser) {
      const user = await mongoose.model('User').findById(this.assignedUser);
      this.assignedUserName = user ? user.name : 'unassigned';
    } else {
      this.assignedUserName = 'unassigned';
    }
  }
  next();
});


// Export the Mongoose model
module.exports = mongoose.model('Task', taskSchema);
