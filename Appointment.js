const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
    bank: { type: mongoose.Schema.Types.ObjectId, ref: "Bank", required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },

    entityType: {
        type: String,
        required: true
    },
    service: {
        type: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        }
    },
    companyName: {
        type: String,
        // Only required if entityType is Legal Entity
        validate: {
            validator: function(v) {
                return this.entityType !== 'Legal Entity' || (v && v.length > 0);
            },
            message: 'Company name is required for Legal Entity'
        }
    },
    customerName: {
        type: String,
        required: true,
        match: /^[A-Za-z\s]{2,50}$/,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: true,
        match: /^\+?[0-9]{10,15}$/
    },
    email: {
        type: String,
        required: true,
        match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
    },
    timeSlot: { type: String, required: true },
    password: {
        type: String,
        required: true,
        validate: {
            validator: (v) => /^\d{4}$/.test(v),
            message: 'Password must be a 4-digit number'
        }
    },
    serviceDuration: { type: Number, default: null  }, // In minutes
    waitDuration: { type: Number, default: null  },    // In minutes
    windowNumber: { type: Number, default: null  },

    status: {
        type: String,
        enum: ['scheduled', 'waiting', 'checked-in', 'in-progress', 'completed', 'no-show', 'cancelled'],
        default: 'scheduled'
    },
    checkinTime: { type: Date },
    notificationSent: { type: Boolean, default: false },
    notificationTime: { type: Date }

}, {
    collection: "appointments",
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model("Appointment", appointmentSchema);