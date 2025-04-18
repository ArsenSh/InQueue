const express = require("express");
const router = express.Router();
const validator = require('validator');
const rateLimit = require('express-rate-limit');
const { sendContactFormEmail } = require('../utils/email');
const jwt = require('jsonwebtoken');
const Bank = require("../models/Bank");



const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limiting each IP to 3 contact requests per window
  message: 'Too many contact attempts, please try again later'
});





router.post('/branch-login', async (req, res) => {
  console.log('Login Request Received:', req.body);

  try {
    const { branchId, password } = req.body;
    const isCheckinLogin = branchId.endsWith('CheckIn');

    const windowNumberMatch = branchId.match(/^(.+?)(\d+)$/);
    const isWindowStaffLogin = !isCheckinLogin && windowNumberMatch !== null;

    let actualBranchId, windowNumber;

    if (isCheckinLogin) {
      actualBranchId = branchId.replace('CheckIn', '');
      console.log('Detected check-in login attempt:', {
        original: branchId,
        branchId: actualBranchId
      });
    } else if (isWindowStaffLogin) {
      actualBranchId = windowNumberMatch[1]; // The branch ID part
      windowNumber = parseInt(windowNumberMatch[2]); // The window number part

      if (isNaN(windowNumber)) {
        return res.status(400).json({ error: 'Invalid window number format' });
      }
      console.log('Detected window staff login attempt:', {
        original: branchId,
        branchId: actualBranchId,
        windowNumber: windowNumber
      });
    } else {
      actualBranchId = branchId;
    }

    const bank = await Bank.findOne({ "branches.id": actualBranchId });
    if (!bank) {
      console.log('Bank not found for branch ID:', actualBranchId);
      return res.status(404).json({ error: 'Branch not found' });
    }

    const branch = bank.branches.find(b => b.id === actualBranchId);
    if (!branch) {
      console.log('Branch not found in bank:', actualBranchId);
      return res.status(404).json({ error: 'Branch not found in bank' });
    }

    if (isCheckinLogin) {
      const checkinPassword = branch.checkinPassword || 'checkin';
      console.log('Check-in password check:', {
        passwordMatch: password === checkinPassword
      });
      if (password !== checkinPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign(
          {
            bankId: bank._id,
            branchId: branch.id,
            role: 'checkin_staff'
          },
          process.env.JWT_SECRET,
          { expiresIn: '8h' }
      );

      res.json({
        token,
        bankId: bank._id,
        branchId: branch.id,
        branchName: branch.name,
        bankName: bank.name,
        role: 'checkin_staff'
      });
    } else if (isWindowStaffLogin) {
      const window = branch.windows.find(w => w.number === windowNumber);
      if (!window) {
        console.log('Window not found:', { branchId: actualBranchId, windowNumber });
        return res.status(404).json({ error: 'Window not found' });
      }
      const windowPassword = window.password || 'window';
      console.log('Window password check:', {
        windowNumber,
        passwordMatch: password === windowPassword,
        staffName: window.staff ? `${window.staff.firstName} ${window.staff.lastName}` : 'Unassigned'
      });
      if (password !== windowPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const staffName = window.staff ?
          `${window.staff.firstName || ''} ${window.staff.lastName || ''}`.trim() :
          'Window Staff';
      window.lastLogin = new Date();
      await bank.save();
      const token = jwt.sign(
          {
            bankId: bank._id,
            branchId: branch.id,
            windowNumber: window.number,
            role: 'window_staff',
            staffName: staffName
          },
          process.env.JWT_SECRET,
          { expiresIn: '8h' }
      );

      res.json({
        token,
        bankId: bank._id,
        branchId: branch.id,
        branchName: branch.name,
        bankName: bank.name,
        windowNumber: window.number,
        staffName: staffName,
        role: 'window_staff'
      });
    } else {
      console.log('Password check:', {
        inputPassword: password,
        passwordMatch: password === branch.password
      });
      if (password !== branch.password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign(
          {
            bankId: bank._id,
            branchId: branch.id,
            branchName: branch.name,
            role: 'branch_admin'
          },
          process.env.JWT_SECRET,
          { expiresIn: '8h' }
      );

      res.json({
        token,
        bankId: bank._id,
        branchId: branch.id,
        branchName: branch.name,
        bankName: bank.name,
        role: 'branch_admin'
      });
    }

    console.log('Login successful for:',
        isCheckinLogin ? `Check-in staff (Branch: ${actualBranchId})` :
            isWindowStaffLogin ? `Window staff (Branch: ${actualBranchId}, Window: ${windowNumber})` :
                `Branch admin (${actualBranchId})`);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Server error',
      details: error.message
    });
  }
});

// Changing branch password route
router.post('/change-password', async (req, res) => {
  try {
    const { branchId, currentPassword, newPassword } = req.body;

    // Finding bank containing the branch
    const bank = await Bank.findOne({ "branches.id": branchId });
    if (!bank) return res.status(404).json({ error: 'Branch not found' });
    const branch = bank.branches.find(b => b.id === branchId);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    if (branch.password !== currentPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    branch.password = newPassword;
    await bank.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/contact', contactLimiter, async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Request body required' });
    }
    const { fullName, email, phone, message, honeypot } = req.body;
    if (honeypot) return res.status(200).json({ message: 'Submission successful' });
    const required = { fullName, email, message };
    for (const [field, value] of Object.entries(required)) {
      if (!value || !value.trim()) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }
    if (!validator.isLength(fullName, { min: 2, max: 50 })) {
      return res.status(400).json({ error: 'Name must be 2-50 characters' });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (phone && !validator.isMobilePhone(phone)) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }
    if (!validator.isLength(message, { max: 1000 })) {
      return res.status(400).json({ error: 'Message too long (max 1000 chars)' });
    }
    const emailResult = await sendContactFormEmail({
      fullName,
      email,
      phone,
      message
    });
    if (!emailResult.success) {
      throw new Error(emailResult.error || 'Failed to send email');
    }
    res.status(200).json({ message: 'Submission successful' });
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Getting branch details by ID
router.get("/getBank/:id", async (req, res) => {
  try {
    const branch = await Bank.findById(req.params.id);
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    res.json(branch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Getting busy times for a branch
router.get('/getBusyTimes/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    const branch = isObjectId
        ? await Branch.findById(identifier)
        : await Branch.findOne({ name: identifier });

    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    const busyTimes = await Appointments.find({
      branchId: branch._id,
      date: { $gte: new Date() }
    }).select('time');
    res.json({ busyTimes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/appointments/book", async (req, res) => {
  const { branchId, time } = req.body;
  if (!branchId || !time) return res.status(400).json({ message: "Missing fields" });

  try {
    const bank = await Bank.findOne({ "branches.branchId": branchId });
    if (!bank) return res.status(404).json({ message: "Branch not found" });
    const branch = bank.branches.find(b => b.branchId === branchId);
    if (branch.busyTimes.includes(time)) {
      return res.status(400).json({ message: "Time slot already booked" });
    }
    branch.busyTimes.push(time);
    await bank.save();
    res.json({ message: "Appointment booked successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Setting an appointment (Add busy time)
// POST endpoint to book an appointment
router.post("/setOrder", async (req, res) => {
  const { branchId, time } = req.body;
  if (!branchId || !time) return res.status(400).json({ message: "Missing fields" });

  try {
    const bank = await Bank.findOne({ "branches.branchId": branchId });
    if (!bank) return res.status(404).json({ message: "Branch not found" });

    const branch = bank.branches.find(b => b.branchId === branchId);
    const [day, month, year, hour, minute] = time.split("/"); // Assuming the time is in "DD/MM/YY/HH/MM" format
    const dateTimeString = `${day}/${month}/${year}/${hour}/${minute}`; // Format the time string
    if (branch.busyTimes.includes(dateTimeString)) {
      return res.status(400).json({ message: "Time slot already booked" });
    }
    branch.busyTimes.push(dateTimeString);
    await bank.save();

    res.json({ message: "Appointment booked successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;