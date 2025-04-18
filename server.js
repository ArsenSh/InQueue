/**
 * Bank Appointment API - Main Server
 *
 * This server handles bank branch appointment bookings, providing endpoints for:
 * - Retrieving bank and branch information
 * - Checking available appointment times
 * - Booking appointments
 * - Managing appointments (viewing, delaying, canceling)
 */

// ================= DEPENDENCIES =================
require("dotenv").config(); // Load environment variables
const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

// ================= CUSTOM MODULES =================
const Bank = require("./models/Bank");
const Appointment = require("./models/Appointment");
const { sendAppointmentConfirmation } = require('./utils/email');
const { startReminderScheduler } = require('./utils/reminderScheduler');
const { sendWindowSmsNotification } = require('./utils/sms');
const bankRoutes = require('./routes/bankRoutes');




console.log(crypto.randomBytes(32).toString('base64'));

// ================= APP CONFIGURATION =================
const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Verifing required environment variables
if (!MONGO_URI) {
    console.error("Error: MONGO_URI is not defined in .env file");
    process.exit(1);
}

// Seting default frontend URL if not provided
if (!process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL = 'http://localhost:8080';
    console.log("FRONTEND_URL not set in .env, using default:", process.env.FRONTEND_URL);
}




// ================= MIDDLEWARE =================
// Security headers with Helmet
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }  // This enables cross-origin sharing
}));

// Rate limiting to prevent abuse
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // Limit each IP to 100 requests per window
    message: "Too many requests, please try again later",
    standardHeaders: true,
    skip: (req, res) => {
        // List the routes I want to exclude from rate limiting
        const bypassRoutes = [
            '/api/branch-dashboard',
            '/api/branch-reports',
            '/api/branch-settings',
            '/api/window/:windowNumber',
            '/api/checkin'
        ];

        return bypassRoutes.includes(req.path);
    }
}));

// Enhanced CORS configuration for frontend communication
app.use(cors({
    origin: [
        'http://localhost:8080',
        'http://127.0.0.1:8080'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin'
    ],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Handling preflight requests
app.options('*', cors());

// Parsing JSON request bodies with size limit
app.use(express.json({ limit: '10kb' }));

// Adding CORS headers to all responses
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:8080');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '28800'); // 8 hours
    next();
});









// ================= STATIC FILES =================
// Serving static files from the public directory
app.use('/logos', express.static(path.join(__dirname, 'public', 'logos')));

// Specific route for bank logos with CORS headers
app.use('/logos', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
});








// ================= ROUTES =================
// API Routes
app.use('/api/banks', bankRoutes);

// Welcome route
app.get("/", (req, res) => {
    res.send("Welcome to the Bank Appointment API!");
});

/**
 * Getting a list of all banks with their branches
 * GET /api/banks
 */
app.get("/api/banks", async (req, res) => {
    try {
        console.log("Fetching banks from MongoDB...");
        const banks = await Bank.find({}).lean();
        res.json(banks);
    } catch (error) {
        console.error("Error fetching banks:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
});

/**
 * Geting a specific bank by ID
 * GET /api/banks/:bankId
 */
app.get('/api/banks/:bankId', async (req, res) => {
    try {
        const bank = await Bank.findById(req.params.bankId);
        if (!bank) return res.status(404).json({ error: 'Bank not found' });
        res.json(bank);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Getting a specific bank branch by ID
 * GET /api/getBank/:branch_id
 */
app.get("/api/getBank/:branch_id", async (req, res) => {
    try {
        const { branch_id: branchId } = req.params;

        // Finding bank with projection using positional operator
        const bank = await Bank.findOne(
            { "branches.id": branchId },
            {
                name: 1,          // Include bank name
                "branches.$": 1   // Include only matching branch
            }
        );

        if (!bank) {
            return res.status(404).json({ message: "Bank not found" });
        }

        // Extracting the specific branch
        const branch = bank.branches[0];

        res.json({
            bankName: bank.name,
            branch: branch
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * Getting bank and branch names by IDs
 * GET /api/banks/:bankId/branches/:branchId
 */
app.get('/api/banks/:bankId/branches/:branchId', async (req, res) => {
    try {
        const { bankId, branchId } = req.params;

        const bank = await Bank.findOne({ _id: bankId });
        if (!bank) {
            return res.status(404).json({ error: 'Bank not found' });
        }

        const branch = bank.branches.id(branchId);
        if (!branch) {
            return res.status(404).json({ error: 'Branch not found' });
        }

        res.json({
            bankName: bank.name,
            branchName: branch.name,
            branchAddress: branch.address
        });
    } catch (error) {
        console.error('Error fetching bank details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Getting entity types supported by a bank (Individual, Legal Entity)
 * GET /api/banks/:bankId/entityTypes
 */
app.get('/api/banks/:bankId/entityTypes', async (req, res) => {
    try {
        const bank = await Bank.findById(req.params.bankId).select('deals.type');
        if (!bank) return res.status(404).json({ error: 'Bank not found' });

        // Getting unique entity types from deals
        const entityTypes = [...new Set(bank.deals.map(deal => deal.type))];

        res.json(entityTypes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Getting all deals for a bank
 * GET /api/banks/:bankId/deals
 */
app.get('/api/banks/:bankId/deals', async (req, res) => {
    try {
        const bank = await Bank.findById(req.params.bankId)
            .select('name deals')
            .lean();

        if (!bank || !bank.deals) {
            return res.status(404).json({ error: 'No deals found for this bank' });
        }

        // Transforming data for easier frontend processing
        const transformedDeals = bank.deals.map(deal => ({
            type: deal.type,
            requireCompanyName: deal.requireCompanyName || false,
            dealTypes: deal.dealTypes.map(dt => ({
                ...dt,
                _id: dt._id || new mongoose.Types.ObjectId()
            }))
        }));

        res.json(transformedDeals);
    } catch (error) {
        console.error('Error fetching deals:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

/**
 * Function to get busy times for a branch from MongoDB
 * // @param {string} branchId - The ID of the branch
 * // @returns {Array} - Array of busy time slots
 */
async function getBusyTimesFromDatabase(branchId) {
    try {
        const appointments = await Appointment.find({ branchId: branchId });
        return appointments.map(appointment => appointment.timeSlot);
    } catch (error) {
        console.error('Error fetching busy times:', error);
        throw error;
    }
}

/**
 * Getting busy times for a specific branch
 * GET /api/getBusyTimes/:branchId
 */
app.get('/api/getBusyTimes/:branchId', async (req, res) => {
    const branchId = req.params.branchId;

    try {
        const busyTimes = await getBusyTimesFromDatabase(branchId);
        res.json({ busyTimes });
    } catch (error) {
        console.error('Error fetching busy times:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * Calculating available time slots for a branch on a specific date
 *
 * // @param {string} bankId - Bank ID
 * // @param {string} branchId - Branch ID
 * // @param {string} date - Date in DD/MM/YY format
 * // @returns {Array} - Available time slots
 */
const getAvailableTimes = async (bankId, branchId, date) => {
    const bank = await Bank.findById(bankId);
    if (!bank) {
        throw new Error("Bank not found");
    }

    const branch = bank.branches.find(b => b.id === branchId);
    if (!branch) {
        throw new Error("Branch not found");
    }

    let selectedDateObj;

    if (date.includes('%2F')) {
        const decodedDate = decodeURIComponent(date);
        const [day, month, yearShort] = decodedDate.split('/');
        const fullYear = 2000 + parseInt(yearShort);
        selectedDateObj = new Date(fullYear, month - 1, day);
    } else if (date.includes('/')) {
        const [day, month, yearShort] = date.split('/');
        const fullYear = 2000 + parseInt(yearShort);
        selectedDateObj = new Date(fullYear, month - 1, day);
    } else {
        selectedDateObj = new Date(date);
    }

    if (isNaN(selectedDateObj.getTime())) {
        throw new Error("Invalid date format");
    }

    // Formating the date as DD/MM/YY for filtering
    const dayFormatted = String(selectedDateObj.getDate()).padStart(2, '0');
    const monthFormatted = String(selectedDateObj.getMonth() + 1).padStart(2, '0');
    const yearFormatted = String(selectedDateObj.getFullYear()).slice(2);
    const formattedDate = `${dayFormatted}/${monthFormatted}/${yearFormatted}`;

    // Extracting busy times for that date
    const busyTimesForDate = branch.busyTimes.filter(time => time.startsWith(formattedDate));

    // Generating 5-minute interval slots
    const allTimes = [];
    for (let hour = 9; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += 5) {
            const timeSlot = `${formattedDate}/${String(hour).padStart(2, '0')}/${String(minute).padStart(2, '0')}`;
            if (!busyTimesForDate.includes(timeSlot)) {
                allTimes.push(timeSlot);
            }
        }
    }

    return allTimes;
};



const authMiddleware = (req, res, next) => {
    console.log('Auth headers:', req.headers.authorization ? 'Present' : 'Missing');
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        console.log('Token missing in request');
        return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    try {
        console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verified successfully, branchId:', decoded.branchId);
        req.branch = decoded;
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        res.status(401).json({ error: 'Invalid token: ' + error.message });
    }
};

// Protect dashboard routes
app.get('/api/branch-dashboard', authMiddleware, async (req, res) => {
    try {
        const { bankId, branchId } = req.branch;

        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));

        const bank = await Bank.findOne(
            { _id: bankId, "branches.id": branchId },
            { name: 1, "branches.$": 1 }
        ).lean();

        const branch = bank.branches[0];

        const stats = await Appointment.aggregate([
            {
                $match: {
                    branch: new mongoose.Types.ObjectId(branch._id),
                    timeSlot: {
                        $gte: startOfDay,
                        $lte: endOfDay
                    }
                }
            },
            {
                $facet: {
                    total: [{ $count: "count" }],
                    completed: [{ $match: { status: "completed" } }, { $count: "count" }],
                    waiting: [
                        {
                            $match: {
                                status: { $in: ["waiting", "checked-in"] }
                            }
                        },
                        { $count: "count" }
                    ],
                    inProgress: [{ $match: { status: "in-progress" } }, { $count: "count" }],
                    noShows: [{ $match: { status: "no-show" } }, { $count: "count" }]
                }
            },
            {
                $project: {
                    todayTotal: { $arrayElemAt: ["$total.count", 0] },
                    served: { $arrayElemAt: ["$completed.count", 0] },
                    waiting: { $arrayElemAt: ["$waiting.count", 0] },
                    inProgress: { $arrayElemAt: ["$inProgress.count", 0] },
                    noShows: { $arrayElemAt: ["$noShows.count", 0] }
                }
            }
        ]);

        const currentQueue = await Appointment.find({
            branch: branch._id,
            status: { $in: ["waiting", "checked-in", "in-progress"] },
            timeSlot: { $lte: new Date() }
        })
            .sort({ timeSlot: 1 })
            .limit(50)
            .lean();

        const upcomingAppointments = await Appointment.find({
            branch: branch._id,
            status: "scheduled",
            timeSlot: { $gt: new Date() }
        })
            .sort({ timeSlot: 1 })
            .limit(20)
            .lean();

        const recentActivity = await Appointment.find({
            branch: branch._id,
            $or: [
                { status: "completed" },
                { status: "no-show" }
            ],
            updatedAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) }
        })
            .sort({ updatedAt: -1 })
            .limit(10)
            .lean();

        res.json({
            stats: stats[0] || {
                todayTotal: 0,
                served: 0,
                waiting: 0,
                inProgress: 0,
                noShows: 0
            },
            currentQueue: currentQueue.map(a => ({
                ...a,
                time: formatTime(a.timeSlot),
                date: formatDate(a.timeSlot)
            })),
            upcomingAppointments: upcomingAppointments.map(a => ({
                ...a,
                time: formatTime(a.timeSlot),
                date: formatDate(a.timeSlot)
            })),
            recentActivity,
            branchInfo: {
                name: branch.name,
                address: branch.address,
                bankName: bank.name
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to load dashboard data' });
    }
});


function formatTime(date) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-GB');
}


/**
 * Getting available times for a branch on a specific date
 * GET /api/available-times/:bankId/:branchId/:date
 */
app.get("/api/available-times/:bankId/:branchId/:date", async (req, res) => {
    console.log("Received request:", req.params);
    const { bankId, branchId, date } = req.params;
    try {
        const availableTimes = await getAvailableTimes(bankId, branchId, date);
        res.json({ availableTimes });
    } catch (error) {
        console.error("Error fetching available times:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
});

/**
 * Changing branch password
 * POST /api/banks/branch-password-update
 */
app.post('/api/banks/branch-password-update', authMiddleware, async (req, res) => {
    try {
        const { branchId, currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        const bank = await Bank.findOne({ "branches.id": branchId });
        if (!bank) return res.status(404).json({ error: 'Branch not found' });

        const branch = bank.branches.find(b => b.id === branchId);
        if (!branch) return res.status(404).json({ error: 'Branch not found in bank' });

        if (branch.password !== currentPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        branch.password = newPassword;
        await bank.save();

        res.json({ message: 'Branch password updated successfully' });
    } catch (error) {
        console.error('Error updating branch password:', error);
        res.status(500).json({ error: 'Failed to update branch password' });
    }
});

/**
 * Booking a new appointment
 * POST /api/appointments/book
 */
app.post("/api/appointments/book", async (req, res) => {
    const { branchId, time, userInfo, serviceType, service, entityType } = req.body;

    const generatePassword = () => {
        return crypto.randomInt(1000, 9999).toString();
    };

    try {
        console.log("Booking appointment for branch:", branchId);
        console.log("Time to be booked:", time);
        console.log("User Info:", userInfo);
        console.log("Entity Type:", entityType);
        console.log("Service Type:", serviceType);
        console.log("Service Details:", service);

        if (!userInfo || !userInfo.name || !userInfo.phone || !userInfo.email || !serviceType) {
            return res.status(400).json({ error: "Incomplete appointment details" });
        }

        const bank = await Bank.findOne({ "branches.id": branchId });
        if (!bank) return res.status(404).json({ error: "Branch not found" });

        const branch = bank.branches.find(b => b.id === branchId);
        if (!branch) return res.status(404).json({ error: "Branch not found in bank" });

        const validEntityTypes = bank.deals.map(deal => deal.type);
        if (!entityType || !validEntityTypes.includes(entityType)) {
            return res.status(400).json({
                error: "Invalid entity type",
                validTypes: validEntityTypes
            });
        }

        if (entityType === 'Legal Entity' && (!userInfo.companyName || userInfo.companyName.trim() === '')) {
            return res.status(400).json({ error: "Company name is required for Legal Entity" });
        }
        if (!/^[A-Za-z\s]{2,50}$/.test(userInfo.name)) {
            return res.status(400).json({ error: "Invalid name format (only letters, 2-50 characters)" });
        }
        if (!/^\+?[0-9]{10,15}$/.test(userInfo.phone)) {
            return res.status(400).json({ error: "Invalid phone number format (must be 10-15 digits, optional '+')" });
        }
        if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(userInfo.email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }
        if (typeof serviceType !== "string" || serviceType.trim() === "") {
            return res.status(400).json({ error: "Service Type must be a non-empty string" });
        }

        const branchObjectId = new mongoose.Types.ObjectId(branch._id);

        branch.busyTimes.push(time);
        await bank.save();

        try {
            const password = generatePassword();

            const newAppointment = new Appointment({
                bank: bank._id,
                branch: branchObjectId,
                customerName: userInfo.name,
                phoneNumber: userInfo.phone,
                email: userInfo.email,
                timeSlot: time,
                entityType, // Now directly in schema
                companyName: userInfo.companyName || null,
                service: service || {
                    type: serviceType,
                    description: serviceType
                },
                password: password
            });

            await newAppointment.save();

            try {
                await sendAppointmentConfirmation({
                    ...newAppointment.toObject(),
                    bankName: bank.name,
                    branchName: branch.name,
                    branchAddress: branch.address || 'Not specified'
                });

                res.json({
                    message: "Appointment booked successfully! Confirmation email sent.",
                    appointment: newAppointment,
                    password: password
                });
            } catch (emailError) {
                console.error("Error sending confirmation email:", emailError);

                res.json({
                    message: "Appointment booked successfully, but confirmation email could not be sent.",
                    appointment: newAppointment,
                    password: password
                });
            }

        } catch (mongooseError) {
            if (mongooseError.name === "ValidationError") {
                const errors = Object.values(mongooseError.errors).map(e => e.message);
                return res.status(400).json({ error: "Validation failed", details: errors });
            }
            throw mongooseError;
        }

    } catch (error) {
        console.error("Error booking appointment:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
});

/**
 * Getting appointment details by ID
 * GET /api/appointments/:id
 */
app.get('/api/appointments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        res.json(appointment);
    } catch (error) {
        console.error('Error fetching appointment:', error);
        res.status(500).json({
            error: 'Server error',
            details: error.message
        });
    }
});

/**
 * Delaying/rescheduling an appointment
 * PUT /api/appointments/:id/delay
 * Requires bearer token authentication with appointment password
 */
app.put('/api/appointments/:id/delay', async (req, res) => {
    try {
        const { id } = req.params;
        const { newTimeSlot, delayMinutes } = req.body;
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing authorization token' });
        }

        const token = authHeader.split(' ')[1].trim().toUpperCase();

        if (!newTimeSlot) {
            return res.status(400).json({ error: 'New time slot is required' });
        }
        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        if (appointment.password !== token) {
            return res.status(403).json({ error: 'Invalid activation code' });
        }

        const oldTimeSlot = appointment.timeSlot;
        appointment.timeSlot = newTimeSlot;
        await appointment.save();

        const bank = await Bank.findOne({ "branches._id": appointment.branch });
        if (bank) {
            const branch = bank.branches.id(appointment.branch);
            if (branch) {
                branch.busyTimes = branch.busyTimes.filter(t => t !== oldTimeSlot);
                branch.busyTimes.push(newTimeSlot);
                await bank.save();
            }
        }

        res.json({
            message: 'Appointment time updated successfully',
            delayMinutes,
            newTimeSlot
        });
    } catch (error) {
        console.error('Error updating appointment time:', error);
        res.status(500).json({
            error: 'Server error',
            details: error.message
        });
    }
});

/**
 * Canceling an appointment
 * DELETE /api/appointments/:id
 * Requires bearer token authentication with appointment password
 */
app.delete('/api/appointments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing authorization token' });
        }

        const token = authHeader.split(' ')[1].trim().toUpperCase();
        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        if (appointment.password !== token) {
            return res.status(403).json({ error: 'Invalid activation code' });
        }

        const bank = await Bank.findOne({ "branches._id": appointment.branch });
        const branch = bank.branches.id(appointment.branch);
        branch.busyTimes = branch.busyTimes.filter(t => t !== appointment.timeSlot);
        await bank.save();
        await Appointment.findByIdAndDelete(id);
        res.json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        console.error('Deletion error:', error);
        res.status(500).json({
            error: 'Server error',
            ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
    }
});

/**
 * Manually triggering reminder emails (used for testing)
 * GET /trigger-reminders
 * Used for testing or manual reminder sending
 */
app.get('/force-reminder/:id', async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).send('Appointment not found');
        }

        const bank = await Bank.findById(appointment.bank);
        const branch = bank.branches.id(appointment.branch);

        const testData = {
            ...appointment.toObject(),
            bankName: bank.name,
            branchName: branch.name,
            branchAddress: branch.address || 'Not specified',
            formattedDate: appointment.timeSlot.split('/').slice(0, 3).join('/'),
            formattedTime: `${appointment.timeSlot.split('/')[3]}:${appointment.timeSlot.split('/')[4]}`,
            serviceDescription: appointment.service.description || appointment.service.type
        };
        const { sendAppointmentReminder } = require('./utils/email');
        await sendAppointmentReminder(testData);
        res.send('Forced reminder email sent!');
    } catch (error) {
        console.error('Error sending test reminder:', error);
        res.status(500).send(`Error: ${error.message}`);
    }
});




app.get('/api/branch-dashboard/appointments', authMiddleware, async (req, res) => {
    try {
        const { branchId } = req.branch;
        const today = new Date();
        const thirtyDaysLater = new Date(today);
        thirtyDaysLater.setDate(today.getDate() + 30);
        const appointments = await Appointment.find({
            branchId: branchId,
            timeSlot: {
                $gte: today,
                $lte: thirtyDaysLater
            }
        }).sort({ timeSlot: 1 });
        res.json(appointments);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ error: 'Failed to load appointment data' });
    }
});


app.get('/api/branch/:branchId/reports', authMiddleware, async (req, res) => {
    try {
        const { branchId } = req.params;
        const { timeRange = 'today', date } = req.query;

        console.log(`Reports request for branch ${branchId}, timeRange: ${timeRange}, custom date: ${date || 'none'}`);

        const bank = await Bank.findOne({ "branches.id": branchId });
        if (!bank) return res.status(404).json({ error: 'Branch not found' });

        const branch = bank.branches.find(b => b.id === branchId);
        if (!branch) return res.status(404).json({ error: 'Branch not found' });

        const now = new Date();
        let start = new Date(now);
        let end = new Date(now);

        switch(timeRange) {
            case 'today':
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'yesterday':
                start.setDate(start.getDate() - 1);
                start.setHours(0, 0, 0, 0);
                end.setDate(end.getDate() - 1);
                end.setHours(23, 59, 59, 999);
                break;
            case 'week':
                start.setDate(start.getDate() - 7);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'month':
                start.setMonth(start.getMonth() - 1);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'custom':
                if (date) {
                    const [year, month, day] = date.split('-').map(Number);
                    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                        start = new Date(year, month - 1, day, 0, 0, 0, 0);
                        end = new Date(year, month - 1, day, 23, 59, 59, 999);
                    } else {
                        console.error(`Invalid date format received: ${date}`);
                        return res.status(400).json({ error: 'Invalid date format' });
                    }
                } else {
                    console.error('Custom timeRange specified but no date provided');
                    return res.status(400).json({ error: 'Date is required for custom time range' });
                }
                break;
        }

        const appointments = await findAppointmentsInDateRange(branch._id, start, end);
        console.log(`Found ${appointments.length} appointments in date range`);

        const datePatterns = [];
        const currentDate = new Date(start.getTime());
        while (currentDate <= end) {
            const day = String(currentDate.getDate()).padStart(2, '0');
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const year = String(currentDate.getFullYear()).slice(-2);
            datePatterns.push(`${day}/${month}/${year}`);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        const completedAppointments = appointments.filter(a => a.status === "completed");

        let totalWaitTime = 0;
        let totalServiceTime = 0;

        completedAppointments.forEach(app => {
            if (app.waitDuration && typeof app.waitDuration === 'number') {
                totalWaitTime += app.waitDuration;
            }
            if (app.serviceDuration && typeof app.serviceDuration === 'number') {
                totalServiceTime += app.serviceDuration;
            }
        });

        const avgWaitTime = completedAppointments.length > 0 ?
            Math.round(totalWaitTime / completedAppointments.length) : 0;
        const avgServiceTime = completedAppointments.length > 0 ?
            Math.round(totalServiceTime / completedAppointments.length) : 0;
        const completionRate = appointments.length > 0 ?
            Math.round((completedAppointments.length / appointments.length) * 100) : 0;
        const hourCounts = Array(10).fill(0); // 9am to 6pm

        appointments.forEach(app => {
            let hour;
            if (typeof app.timeSlot === 'string' && app.timeSlot.includes('/')) {
                const parts = app.timeSlot.split('/');
                if (parts.length >= 4) {
                    hour = parseInt(parts[3]);
                }
            } else if (app.timeSlot instanceof Date) {
                hour = app.timeSlot.getHours();
            }
            if (hour !== undefined && hour >= 9 && hour < 19) {
                hourCounts[hour - 9]++;
            }
        });

        const queueTraffic = {
            labels: Array.from({ length: 10 }, (_, i) => `${i + 9}:00`),
            datasets: [{
                label: 'Clients in Queue',
                data: hourCounts,
                borderColor: '#42b983',
                backgroundColor: 'rgba(66, 185, 131, 0.1)',
                fill: false
            }]
        };

        const serviceTypes = {};
        appointments.forEach(app => {
            const serviceType = app.service?.type || 'Unknown';
            if (!serviceTypes[serviceType]) {
                serviceTypes[serviceType] = 0;
            }
            serviceTypes[serviceType]++;
        });

        const serviceLabels = Object.keys(serviceTypes);
        const serviceData = Object.values(serviceTypes);
        const serviceColors = serviceLabels.map((_, i) => {
            const colors = [
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 99, 132, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)',
                'rgba(255, 159, 64, 0.7)'
            ];
            return colors[i % colors.length];
        });

        const serviceDistribution = {
            labels: serviceLabels.length > 0 ? serviceLabels : ['No Data'],
            datasets: [{
                data: serviceData.length > 0 ? serviceData : [1],
                backgroundColor: serviceColors
            }]
        };

        const windowStats = {};

        appointments.forEach(app => {
            if (app.windowNumber) {
                if (!windowStats[app.windowNumber]) {
                    windowStats[app.windowNumber] = {
                        clients: 0,
                        completed: 0,
                        serviceTimes: [],
                        waitTimes: []
                    };
                }

                windowStats[app.windowNumber].clients++;

                if (app.status === 'completed') {
                    windowStats[app.windowNumber].completed++;
                    if (app.serviceDuration) {
                        windowStats[app.windowNumber].serviceTimes.push(app.serviceDuration);
                    }
                    if (app.waitDuration) {
                        windowStats[app.windowNumber].waitTimes.push(app.waitDuration);
                    }
                }
            }
        });

        const windowsTable = branch.windows ? branch.windows.map(window => {
            const stats = windowStats[window.number] || {
                clients: 0, completed: 0, serviceTimes: [], waitTimes: []
            };
            const avgWindowServiceTime = stats.serviceTimes.length > 0 ?
                Math.round(stats.serviceTimes.reduce((sum, t) => sum + t, 0) / stats.serviceTimes.length) : 0;
            const avgWindowWaitTime = stats.waitTimes.length > 0 ?
                Math.round(stats.waitTimes.reduce((sum, t) => sum + t, 0) / stats.waitTimes.length) : 0;
            const windowCompletionRate = stats.clients > 0 ?
                Math.round((stats.completed / stats.clients) * 100) : 0;

            return {
                number: window.number,
                staff: window.staff ?
                    `${window.staff.firstName || ''} ${window.staff.lastName || ''}`.trim() || 'Unassigned' :
                    'Unassigned',
                clientsServed: stats.clients,
                avgServiceTime: avgWindowServiceTime,
                avgWaitTime: avgWindowWaitTime,
                completionRate: windowCompletionRate
            };
        }) : [];

        res.json({
            summary: {
                totalClients: appointments.length,
                avgWaitTime,
                avgServiceTime,
                completionRate,
                clientsTrend: 0,
                waitTimeTrend: 0,
                serviceTimeTrend: 0,
                completionTrend: 0
            },
            windowsTable,
            queueTraffic,
            serviceDistribution
        });
    } catch (error) {
        console.error('Reports error:', error);
        res.status(500).json({ error: 'Failed to load reports' });
    }
});

async function findAppointmentsInDateRange(branchId, startDate, endDate) {
    try {
        const allAppointments = await Appointment.find({ branch: branchId }).lean();

        return allAppointments.filter(appointment => {
            let appointmentDate;

            if (appointment.timeSlot instanceof Date) {
                appointmentDate = appointment.timeSlot;
            }
            else if (typeof appointment.timeSlot === 'string' && appointment.timeSlot.includes('/')) {
                try {
                    const parts = appointment.timeSlot.split('/');
                    if (parts.length >= 3) {
                        const day = parseInt(parts[0]);
                        const month = parseInt(parts[1]) - 1;
                        const year = parseInt(parts[2]) < 100 ? 2000 + parseInt(parts[2]) : parseInt(parts[2]);
                        const hour = parts.length >= 4 ? parseInt(parts[3]) : 0;
                        const minute = parts.length >= 5 ? parseInt(parts[4]) : 0;

                        appointmentDate = new Date(year, month, day, hour, minute);
                    }
                } catch (e) {
                    console.error(`Error parsing appointment date: ${appointment.timeSlot}`, e);
                    return false;
                }
            }

            if (!appointmentDate) {
                return false;
            }
            const apptDate = new Date(appointmentDate);
            apptDate.setHours(12, 0, 0, 0);
            const startDay = new Date(startDate);
            startDay.setHours(0, 0, 0, 0);
            const endDay = new Date(endDate);
            endDay.setHours(23, 59, 59, 999);
            const isInRange = apptDate >= startDay && apptDate <= endDay;

            return isInRange;
        });
    } catch (error) {
        console.error('Error finding appointments in date range:', error);
        throw error;
    }
}


app.get('/api/branch/:branchId/windows/:windowNumber', authMiddleware, async (req, res) => {
    try {
        const { branchId, windowNumber } = req.params;
        const bank = await Bank.findOne({ "branches.id": branchId });
        if (!bank) return res.status(404).json({ error: 'Bank not found' });
        const branch = bank.branches.find(b => b.id === branchId);
        if (!branch) return res.status(404).json({ error: 'Branch not found' });
        const window = branch.windows.find(w =>
            w.number === parseInt(windowNumber, 10) // Force numeric comparison
        );
        if (!window) return res.status(404).json({ error: 'Window not found' });
        res.json(window);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


/**
 * Updating window properties
 * PUT /api/branch/:branchId/windows/:windowNumber
 */
app.put('/api/branch/:branchId/windows/:windowNumber', authMiddleware, async (req, res) => {
    try {
        const { branchId, windowNumber } = req.params;
        const { status, dealTypes, currentAppointment, staff } = req.body;
        const bank = await Bank.findOne({ "branches.id": branchId });
        if (!bank) return res.status(404).json({ error: 'Branch not found' });
        const branch = bank.branches.find(b => b.id === branchId);
        if (!branch) return res.status(404).json({ error: 'Branch not found' });

        if (!branch.windows) {
            branch.windows = [];
        }

        const windowIndex = branch.windows.findIndex(w => w.number === Number(windowNumber));
        if (windowIndex === -1) {
            return res.status(404).json({ error: 'Window not found' });
        }
        if (status) branch.windows[windowIndex].status = status;
        if (dealTypes) branch.windows[windowIndex].dealTypes = dealTypes;
        if (currentAppointment !== undefined) {
            branch.windows[windowIndex].currentAppointment = currentAppointment;
        }
        if (staff) {
            branch.windows[windowIndex].staff = {
                firstName: staff.firstName || branch.windows[windowIndex].staff?.firstName || '',
                lastName: staff.lastName || branch.windows[windowIndex].staff?.lastName || ''
            };
        }
        await bank.save();
        res.json(branch.windows[windowIndex]);
    } catch (error) {
        console.error('Error updating window:', error);
        res.status(500).json({ error: 'Failed to update window' });
    }
});


app.get('/api/branch/:branchId/metrics', authMiddleware, async (req, res) => {
    try {
        const { branchId } = req.params;
        const { period } = req.query; // day, week, month
        const now = new Date();
        let startDate = new Date(now);
        switch(period) {
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            default: // day
                startDate.setHours(0, 0, 0, 0);
                break;
        }

        const appointments = await Appointment.find({
            branchId: branchId,
            timeSlot: { $gte: startDate, $lte: now },
            status: { $in: ['completed', 'no-show', 'in-progress', 'waiting'] }
        });

        const metrics = {
            totalAppointments: appointments.length,
            completed: appointments.filter(a => a.status === 'completed').length,
            noShow: appointments.filter(a => a.status === 'no-show').length,
            inProgress: appointments.filter(a => a.status === 'in-progress').length,
            waiting: appointments.filter(a => a.status === 'waiting').length,
            averageWaitTime: 0
        };
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Getting appointments for next 30 days
 * GET /api/branch-dashboard/appointments/:date?
 */
app.get('/api/branch-dashboard/appointments/:date?', authMiddleware, async (req, res) => {
    try {
        const { branchId } = req.branch;
        let targetDate;
        if (req.params.date) {
            const [year, month, day] = req.params.date.split('-').map(Number);
            targetDate = new Date(year, month - 1, day);
        } else {
            targetDate = new Date();
        }
        // Formating the date as 'DD/MM/YY' for string matching
        const day = String(targetDate.getDate()).padStart(2, '0');
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const yearShort = String(targetDate.getFullYear()).slice(-2);
        const datePrefix = `${day}/${month}/${yearShort}`;

        // Finding branch to get branch ObjectId
        const bank = await Bank.findOne({ "branches.id": branchId });
        if (!bank) return res.status(404).json({ error: 'Branch not found' });
        const branch = bank.branches.find(b => b.id === branchId);
        if (!branch) return res.status(404).json({ error: 'Branch not found' });

        const appointments = await Appointment.find({
            branch: branch._id,
            timeSlot: { $regex: `^${datePrefix}` }  // Matching timeSlots starting with today's date
        })
            .sort({ timeSlot: 1 })
            .lean();

        const formattedAppointments = appointments.map(appointment => {
            // Parsing time from the timeSlot string (DD/MM/YY/HH/MM)
            let formattedTime = 'N/A';
            if (typeof appointment.timeSlot === 'string' && appointment.timeSlot.includes('/')) {
                const parts = appointment.timeSlot.split('/');
                if (parts.length >= 5) {
                    formattedTime = `${parts[3]}:${parts[4]}`;
                }
            }
            return {
                ...appointment,
                formattedTime,
                formattedDate: `${day}/${month}/${yearShort}`
            };
        });
        res.json(formattedAppointments);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ error: 'Failed to load appointment data' });
    }
});


/**
 * Appointment status
 * PUT /api/appointments/:id/status
 */
app.put('/api/appointments/:id/status', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, serviceDuration, windowNumber, waitDuration } = req.body;
        const now = new Date();

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        if (windowNumber !== undefined) {
            appointment.windowNumber = windowNumber;
        }
        if (serviceDuration !== undefined) {
            appointment.serviceDuration = serviceDuration;
        }
        if (waitDuration !== undefined) {
            appointment.waitDuration = waitDuration;
        }
        if (status) {
            switch(status) {
                case 'in-progress':
                    appointment.serviceStartTime = now;
                    if (appointment.checkinTime) {
                        appointment.waitDuration = Math.round(
                            (now - appointment.checkinTime) / 60000
                        );
                        console.log(`Wait time calculated: ${appointment.waitDuration} minutes`);
                    } else {
                        console.log('No check-in time recorded, wait time remains null');
                    }
                    break;

                case 'completed':
                    appointment.completionTime = now;
                    if (appointment.serviceStartTime) {
                        appointment.serviceDuration = Math.round(
                            (now - appointment.serviceStartTime) / 60000
                        );
                        console.log(`Service duration calculated: ${appointment.serviceDuration} minutes`);
                    } else if (serviceDuration) {
                        // Use provided value if no start time recorded
                        appointment.serviceDuration = serviceDuration;
                        console.log(`Service duration from client: ${serviceDuration} minutes`);
                    }
                    break;
            }
            appointment.status = status;
        }
        await appointment.save();
        res.json({
            message: 'Appointment updated',
            appointment
        });
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ error: 'Failed to update appointment' });
    }
});



/**
 * Getting windows for a branch
 * GET /api/branch/:branchId/windows
 */
app.get('/api/branch/:branchId/windows', authMiddleware, async (req, res) => {
    try {
        const { branchId } = req.params;
        const bank = await Bank.findOne({ "branches.id": branchId });
        if (!bank) return res.status(404).json({ error: 'Branch not found' });
        const branch = bank.branches.find(b => b.id === branchId);
        if (!branch) return res.status(404).json({ error: 'Branch not found' });
        res.json(branch.windows || []);
    } catch (error) {
        console.error('Error fetching windows:', error);
        res.status(500).json({ error: 'Failed to fetch windows' });
    }
});

/**
 * Adding a window to branch
 * POST /api/branch/:branchId/windows
 */
app.post('/api/branch/:branchId/windows', authMiddleware, async (req, res) => {
    try {
        const { branchId } = req.params;
        const { windowNumber, dealTypes, staff } = req.body;
        if (!windowNumber) {
            return res.status(400).json({ error: 'Window number is required' });
        }
        const bank = await Bank.findOne({ "branches.id": branchId });
        if (!bank) return res.status(404).json({ error: 'Branch not found' });
        const branch = bank.branches.find(b => b.id === branchId);
        if (!branch) return res.status(404).json({ error: 'Branch not found' });

        if (!branch.windows) {
            branch.windows = [];
        }

        if (branch.windows.some(w => w.number === windowNumber)) {
            return res.status(400).json({ error: 'Window number already exists' });
        }

        branch.windows.push({
            number: windowNumber,
            dealTypes: dealTypes || [],
            status: 'inactive',
            currentAppointment: null,
            staff: staff || { firstName: '', lastName: '' }
        });

        await bank.save();
        res.status(201).json(branch.windows);
    } catch (error) {
        console.error('Error adding window:', error);
        res.status(500).json({ error: 'Failed to add window' });
    }
});



app.put('/api/branch/:branchId/windows/:windowNumber/assign-staff', authMiddleware, async (req, res) => {
    try {
        const { branchId, windowNumber } = req.params;
        const { firstName, lastName } = req.body;

        if (!firstName || !lastName) {
            return res.status(400).json({ error: 'First and last name are required' });
        }
        const bank = await Bank.findOne({ "branches.id": branchId });
        if (!bank) return res.status(404).json({ error: 'Branch not found' });
        const branch = bank.branches.find(b => b.id === branchId);
        if (!branch) return res.status(404).json({ error: 'Branch not found' });
        const windowIndex = branch.windows.findIndex(w => w.number === Number(windowNumber));
        if (windowIndex === -1) {
            return res.status(404).json({ error: 'Window not found' });
        }
        branch.windows[windowIndex].staff = { firstName, lastName };
        await bank.save();
        res.json(branch.windows[windowIndex]);
    } catch (error) {
        console.error('Error assigning staff:', error);
        res.status(500).json({ error: 'Failed to assign staff' });
    }
});

/**
 * Deleting a window
 * DELETE /api/branch/:branchId/windows/:windowNumber
 */
app.delete('/api/branch/:branchId/windows/:windowNumber', authMiddleware, async (req, res) => {
    try {
        const { branchId, windowNumber } = req.params;
        const bank = await Bank.findOne({ "branches.id": branchId });
        if (!bank) return res.status(404).json({ error: 'Branch not found' });
        const branch = bank.branches.find(b => b.id === branchId);
        if (!branch) return res.status(404).json({ error: 'Branch not found' });
        if (!branch.windows || branch.windows.length === 0) {
            return res.status(404).json({ error: 'No windows found' });
        }
        const windowIndex = branch.windows.findIndex(w => w.number === Number(windowNumber));
        if (windowIndex === -1) {
            return res.status(404).json({ error: 'Window not found' });
        }
        if (branch.windows[windowIndex].status === 'serving') {
            return res.status(400).json({ error: 'Cannot delete a window that is currently serving' });
        }

        branch.windows.splice(windowIndex, 1);
        await bank.save();
        res.json({ message: 'Window deleted successfully' });
    } catch (error) {
        console.error('Error deleting window:', error);
        res.status(500).json({ error: 'Failed to delete window' });
    }
});

/**
 * Getting metrics for branch (today, week, month)
 * GET /api/branch/:branchId/metrics
 * Query param: period (today, week, month)
 */
app.get('/api/branch/:branchId/metrics', authMiddleware, async (req, res) => {
    try {
        const { branchId } = req.params;
        const { period = 'today' } = req.query;
        const bank = await Bank.findOne({ "branches.id": branchId });
        if (!bank) return res.status(404).json({ error: 'Branch not found' });
        const branch = bank.branches.find(b => b.id === branchId);
        if (!branch) return res.status(404).json({ error: 'Branch not found' });
        const now = new Date();
        let startDate = new Date(now);

        switch(period) {
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            default: // today
                startDate.setHours(0, 0, 0, 0);
                break;
        }

        const appointments = await Appointment.find({
            branch: branch._id,
            timeSlot: { $gte: startDate, $lte: now }
        });

        const completedAppointments = appointments.filter(a => a.status === 'completed');
        const noShowAppointments = appointments.filter(a => a.status === 'no-show');
        const inProgressAppointments = appointments.filter(a => a.status === 'in-progress');
        const waitingAppointments = appointments.filter(a => a.status === 'waiting' || a.status === 'checked-in');

        const appointmentsByDate = {};
        appointments.forEach(appointment => {
            const date = formatDate(appointment.timeSlot);
            if (!appointmentsByDate[date]) {
                appointmentsByDate[date] = {
                    total: 0,
                    completed: 0,
                    noShow: 0
                };
            }
            appointmentsByDate[date].total++;
            if (appointment.status === 'completed') {
                appointmentsByDate[date].completed++;
            } else if (appointment.status === 'no-show') {
                appointmentsByDate[date].noShow++;
            }
        });
        // Converting to array for frontend charts
        const chartData = Object.keys(appointmentsByDate).map(date => ({
            date,
            total: appointmentsByDate[date].total,
            completed: appointmentsByDate[date].completed,
            noShow: appointmentsByDate[date].noShow
        }));
        res.json({
            metrics: {
                totalAppointments: appointments.length,
                completed: completedAppointments.length,
                noShow: noShowAppointments.length,
                inProgress: inProgressAppointments.length,
                waiting: waitingAppointments.length
            },
            chartData
        });
    } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});



/**
 * Notifying client to proceed to a specific window
 * POST /api/appointments/:id/notify
 */
app.post('/api/appointments/:id/notify', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { message, windowNumber, notificationType = 'both' } = req.body;
        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        const bank = await Bank.findById(appointment.bank);
        const branch = bank.branches.id(appointment.branch);

        const notificationData = {
            appointmentId: appointment._id,
            customerName: appointment.customerName,
            customerEmail: appointment.email,
            customerPhone: appointment.phoneNumber,
            bankName: bank.name,
            branchName: branch.name,
            windowNumber: windowNumber,
            message: message || `Please proceed to Window ${windowNumber} for your service.`,
            appointmentType: appointment.service.type,
            appointmentTime: appointment.timeSlot
        };

        const results = {
            email: { sent: false },
            sms: { sent: false }
        };

        if (notificationType === 'email' || notificationType === 'both') {
            const { sendWindowNotification } = require('./utils/email');
            const emailResult = await sendWindowNotification(notificationData);
            results.email = emailResult;
        }

        if (notificationType === 'sms' || notificationType === 'both') {
            const smsResult = await sendWindowSmsNotification(notificationData);
            results.sms = smsResult;
        }

        if ((results.email.success || notificationType === 'sms') ||
            (results.sms.success || notificationType === 'email')) {
            appointment.notificationSent = true;
            appointment.notificationTime = new Date();
            await appointment.save();
            res.json({
                message: 'Notification sent successfully',
                results
            });
        } else {
            res.status(500).json({
                error: 'Failed to send notifications',
                results
            });
        }
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

/**
 * Client check-in endpoint
 * POST /api/branch/:branchId/checkin
 */
app.post('/api/branch/:branchId/checkin', authMiddleware, async (req, res) => {
    try {
        const { branchId } = req.params;
        const { code, appointmentId } = req.body;

        let appointment;

        if (appointmentId) {
            appointment = await Appointment.findById(appointmentId);
        }
        else if (code) {
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const year = String(today.getFullYear()).slice(-2);
            const datePrefix = `^${day}/${month}/${year}`;
            appointment = await Appointment.findOne({
                password: code,
                timeSlot: { $regex: datePrefix }
            });
            if (!appointment) {
                appointment = await Appointment.findOne({
                    password: code
                });
                if (appointment) {
                    const [aDay, aMonth, aYear, aHour, aMinute] = appointment.timeSlot.split('/');
                    const appointmentDate = new Date(
                        2000 + parseInt(aYear),
                        parseInt(aMonth) - 1,
                        parseInt(aDay),
                        parseInt(aHour),
                        parseInt(aMinute)
                    );
                    if (appointmentDate < today) {
                        appointment = null;
                    }
                }
            }
        } else {
            return res.status(400).json({ error: 'Appointment ID or code is required' });
        }

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        const invalidStatuses = ['completed', 'no-show'];
        if (invalidStatuses.includes(appointment.status)) {
            return res.status(400).json({
                error: `Cannot check in. Appointment is already marked as ${appointment.status}.`
            });
        }
        appointment.status = 'checked-in';
        appointment.checkinTime = new Date();
        await appointment.save();
        res.json({
            message: 'Check-in successful',
            appointment
        });
    } catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({ error: 'Failed to process check-in' });
    }
});

app.get('/api/appointment-by-code/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const appointment = await Appointment.findOne({ password: code });
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        res.json({ appointment });
    } catch (error) {
        console.error('Error finding appointment by code:', error);
        res.status(500).json({ error: 'Failed to find appointment' });
    }
});

/**
 * Getting check-ins for a branch on a specific date
 * GET /api/branch/:branchId/checkins/:date
 */
app.get('/api/branch/:branchId/checkins/:date', authMiddleware, async (req, res) => {
    try {
        const { branchId, date } = req.params;
        const targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        }
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        const bank = await Bank.findOne({ "branches.id": branchId });
        if (!bank) return res.status(404).json({ error: 'Branch not found' });
        const branch = bank.branches.find(b => b.id === branchId);
        if (!branch) return res.status(404).json({ error: 'Branch not found' });
        const checkins = await Appointment.find({
            branch: branch._id,
            checkinTime: { $gte: startOfDay, $lte: endOfDay }
        }).sort({ checkinTime: -1 }).lean();
        const totalCheckins = checkins.length;
        res.json({
            totalCheckins,
            checkins
        });
    } catch (error) {
        console.error('Error fetching check-ins:', error);
        res.status(500).json({ error: 'Failed to fetch check-ins' });
    }
});

/**
 * Changing window password
 * POST /api/banks/window-password-update
 */
app.post('/api/banks/window-password-update', authMiddleware, async (req, res) => {
    try {
        const { branchId, windowNumber, windowBranchId, currentPassword, newPassword } = req.body;
        if (!windowNumber || !currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Window number, current password, and new password are required' });
        }
        const bank = await Bank.findOne({ "branches.id": branchId });
        if (!bank) return res.status(404).json({ error: 'Branch not found' });
        const branch = bank.branches.find(b => b.id === branchId);
        if (!branch) return res.status(404).json({ error: 'Branch not found in bank' });
        const windowIndex = branch.windows.findIndex(w => w.number === parseInt(windowNumber));
        if (windowIndex === -1) {
            return res.status(404).json({ error: 'Window not found' });
        }
        const window = branch.windows[windowIndex];
        if (window.password !== currentPassword) {
            return res.status(401).json({ error: 'Current window password is incorrect' });
        }

        window.password = newPassword;

        await bank.save();
        res.json({ message: `Window ${windowNumber} password updated successfully` });
    } catch (error) {
        console.error('Error updating window password:', error);
        res.status(500).json({ error: 'Failed to update window password' });
    }
});

/**
 * Changing check-in password
 * POST /api/banks/checkin-password-update
 */
app.post('/api/banks/checkin-password-update', authMiddleware, async (req, res) => {
    try {
        const { branchId, currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }
        const bank = await Bank.findOne({ "branches.id": branchId });
        if (!bank) return res.status(404).json({ error: 'Branch not found' });
        const branch = bank.branches.find(b => b.id === branchId);
        if (!branch) return res.status(404).json({ error: 'Branch not found in bank' });

        if (branch.checkinPassword !== currentPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        branch.checkinPassword = newPassword;
        await bank.save();
        res.json({ message: 'Check-in password updated successfully' });
    } catch (error) {
        console.error('Error updating check-in password:', error);
        res.status(500).json({ error: 'Failed to update check-in password' });
    }
});




// ================= ERROR HANDLING =================
app.use((err, req, res, next) => {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
});






// ================= SERVER INITIALIZATION =================
mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected");
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
        startReminderScheduler();
    })
    .catch((err) => console.error("MongoDB connection error:", err));




// ================= ADDITIONAL SECURITY CONSIDERATIONS =================
/*
 * Security enhancements already implemented:
 * - Helmet: Adds security headers to protect against common web vulnerabilities
 * - Rate limiting: Prevents abuse by limiting requests per IP
 * - Request size limiting: Protects against large payload attacks
 * - CORS configuration: Restricts cross-origin requests
 *
 * Additional security considerations:
 * - Content Security Policy: Further restrict with helmet's CSP options
 * - HTTPS enforcement in production
 * - Authentication middleware for sensitive routes
 * - Input validation/sanitization (using libraries like express-validator)
 * - Implement proper logging and monitoring
 */