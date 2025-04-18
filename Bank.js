const mongoose = require("mongoose");

const BranchSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  address: String,
  busyTimes: [String],
  password: {
    type: String,
    required: true,
    default: 'inqueue11111'
  },
  checkinPassword: {
    type: String,
    default: 'checkin'
  },
  windows: [{
    number: Number,
    dealTypes: [String],
    status: {
      type: String,
      enum: ['active', 'inactive', 'serving'],
      default: 'inactive'
    },
    currentAppointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
    },
    staff: {
      firstName: {
        type: String,
        default: ''
      },
      lastName: {
        type: String,
        default: ''
      }
    },
    password: {
      type: String,
      default: 'window'
    },
    lastLogin: {
      type: Date
    }
  }]
});


const DealSchema = new mongoose.Schema({
  type: { type: String, required: true },
  requireCompanyName: Boolean,
  dealTypes: [
    {
      serviceType: String, // e.g., Cash Deals
      description: String // Details about the deal
    }
  ]
});


const BankSchema = new mongoose.Schema({
  name: String,
  branches: [BranchSchema],
  deals: [DealSchema]
});

const Bank = mongoose.model("Bank", BankSchema);
module.exports = Bank;