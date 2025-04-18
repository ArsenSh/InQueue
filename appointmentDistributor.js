/**
 * Utility for distributing appointments among windows
 * This ensures consistent distribution logic across components
 */

/**
 * Distributes appointments among windows using a round-robin approach
 * //@param {Array} appointments - List of appointments to distribute
 * //@param {Array} windows - List of windows to distribute appointments to
 * //@returns {Object} - Map of window numbers to assigned appointments
 */

export function distributeAppointments(appointments, windows) {
    const windowAssignments = {};

    // Collects all active windows
    const activeWindows = windows.filter(window =>
        window.status === 'active' || window.status === 'serving'
    );

    // Initializes assignments for all windows (even if they end up empty)
    activeWindows.forEach(window => {
        windowAssignments[window.number] = [];
    });
    if (activeWindows.length === 0) {
        console.log("No active windows found");
        return windowAssignments;
    }
    // Group windows by deal types they can handle
    const windowsByType = {};

    activeWindows.forEach(window => {
        window.dealTypes.forEach(dealType => {
            if (!windowsByType[dealType]) {
                windowsByType[dealType] = [];
            }
            windowsByType[dealType].push(window);
        });
    });

    // Groups appointments by deal type
    const appointmentsByType = {};

    appointments.forEach(appointment => {
        const dealType = appointment.service?.type;
        if (!dealType) return;

        if (!appointmentsByType[dealType]) {
            appointmentsByType[dealType] = [];
        }
        appointmentsByType[dealType].push(appointment);
    });

    // For each deal type, distribute appointments evenly across windows
    for (const dealType in appointmentsByType) {
        const typeAppointments = appointmentsByType[dealType];
        const availableWindows = windowsByType[dealType] || [];

        if (availableWindows.length === 0) {
            console.log(`No windows available for deal type: ${dealType}`);
            continue;
        }

        // Sorts appointments by time
        typeAppointments.sort((a, b) => {
            const timeA = getAppointmentTimestamp(a);
            const timeB = getAppointmentTimestamp(b);
            return timeA - timeB;
        });

        // Distributes appointments using round-robin
        typeAppointments.forEach((appointment, index) => {
            const windowIndex = index % availableWindows.length;
            const targetWindow = availableWindows[windowIndex];

            // Stores this appointment in the window's assignments
            windowAssignments[targetWindow.number].push(appointment);
        });
    }

    return windowAssignments;
}

/**
 * Helper function to get a numeric timestamp from an appointment's time
 * //@param {Object} appointment - The appointment object
 * //@returns {number} - Timestamp in milliseconds
 */
function getAppointmentTimestamp(appointment) {
    if (!appointment.timeSlot) return 0;

    // Handles "DD/MM/YY/HH/MM" format
    if (typeof appointment.timeSlot === 'string' && appointment.timeSlot.includes('/')) {
        const [day, month, yearShort, hour, minute] = appointment.timeSlot.split('/');
        const date = new Date(2000 + parseInt(yearShort), month - 1, day, hour, minute);
        return date.getTime();
    }
    // Handles ISO date strings
    return new Date(appointment.timeSlot).getTime();
}

/**
 * Gets appointments assigned to a specific window
 * //@param {Array} appointments - All appointments
 * //@param {Array} windows - All windows
 * //@param {number} windowNumber - The window number to get assignments for
 * //@returns {Array} - Appointments assigned to the specified window
 */
export function getWindowAppointments(appointments, windows, windowNumber) {
    const distributions = distributeAppointments(appointments, windows);
    return distributions[windowNumber] || [];
}