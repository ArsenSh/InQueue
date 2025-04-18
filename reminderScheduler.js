const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const Bank = require('../models/Bank');
const { sendAppointmentReminder } = require('./email');

// Storing IDs of appointments that have already been sent reminders
const remindersSent = new Set();

async function checkAndSendReminders() {
    try {
        console.log("======= RUNNING APPOINTMENT REMINDER CHECK =======");
        const now = new Date();

        console.log("Current Time:", now.toISOString());
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const yearShort = String(now.getFullYear()).slice(2);
        const timeSlotPrefix = `${day}/${month}/${yearShort}/`;
        console.log("Time Slot Prefix:", timeSlotPrefix);
        const appointmentsToday = await Appointment.find({
            timeSlot: { $regex: `^${timeSlotPrefix}` }
        });

        console.log(`Found ${appointmentsToday.length} appointments for today`);
        const upcomingAppointments = appointmentsToday.filter(appointment => {
            const appointmentTime = appointment.timeSlot;
            const appointmentId = appointment._id.toString();
            if (remindersSent.has(appointmentId)) {
                console.log(`🔄 Reminder already sent for appointment: ${appointmentId}`);
                return false;
            }
            const timeParts = appointmentTime.split('/');
            if (timeParts.length < 5) {
                console.log(`❌ Invalid time slot format: ${appointmentTime}`);
                return false;
            }
            const appointmentHour = parseInt(timeParts[3]);
            const appointmentMinute = parseInt(timeParts[4]);

            const appointmentDate = new Date(now);
            appointmentDate.setHours(appointmentHour, appointmentMinute, 0, 0);

            const timeDiffMinutes = (appointmentDate - now) / (1000 * 60);

            console.log(`🕒 Appointment: ${appointmentTime}, Time Difference: ${timeDiffMinutes.toFixed(2)} minutes`);

            const isWithinReminderWindow =
                timeDiffMinutes >= 29 &&
                timeDiffMinutes <= 31;
            if (isWithinReminderWindow) {
                console.log(`✅ Appointment MATCHES reminder window: ${appointment.customerName}`);
            }
            return isWithinReminderWindow;
        });

        console.log(`🔔 Found ${upcomingAppointments.length} appointments for reminder`);

        for (const appointment of upcomingAppointments) {
            try {
                const appointmentId = appointment._id.toString();
                console.log(`🔍 Processing reminder for appointment: ${appointmentId}`);

                const bank = await Bank.findById(appointment.bank);

                if (!bank) {
                    console.warn(`❌ Bank not found for appointment ${appointmentId}`);
                    continue;
                }
                const branch = bank.branches.find(b =>
                    b._id.toString() === appointment.branch.toString()
                );
                if (!branch) {
                    console.warn(`❌ Branch not found for appointment ${appointmentId}`);
                    continue;
                }
                const bankName = bank.name || 'Unknown Bank';
                const branchName = branch.name || 'Unknown Branch';
                const branchAddress = branch.address || 'Address not specified';

                console.log(`📅 Sending reminder details:
                    Appointment ID: ${appointmentId}
                    Customer: ${appointment.customerName}
                    Bank: ${bankName}
                    Branch: ${branchName}
                    Time Slot: ${appointment.timeSlot}`);

                await sendAppointmentReminder({
                    ...appointment.toObject(),
                    bankName,
                    branchName,
                    branchAddress,
                    phoneNumber: appointment.phoneNumber,
                    email: appointment.email
                });
                remindersSent.add(appointmentId);
                console.log(`✅ Reminder SENT for appointment: ${appointmentId}`);
            } catch (error) {
                console.error(`❌ Error sending reminder for appointment ${appointment._id}:`, {
                    message: error.message,
                    name: error.name,
                    stack: error.stack
                });
            }
        }

        const appointmentsToRemove = [...remindersSent].filter(id => {
            const appointment = appointmentsToday.find(a => a._id.toString() === id);
            return !appointment || !appointment.timeSlot.startsWith(timeSlotPrefix);
        });
        for (const id of appointmentsToRemove) {
            remindersSent.delete(id);
        }
    } catch (error) {
        console.error("❌ CRITICAL ERROR in appointment reminders:", {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
    }
}


function startReminderScheduler() {
    cron.schedule('* * * * *', checkAndSendReminders);
    console.log("✅ Appointment reminder scheduler started...");
}
module.exports = {
    startReminderScheduler
};