const parseTimeSlot = (timeSlotString) => {
    try {

        // Format: "DD/MM/YY/HH/MM" (the standard format in the system)
        if (typeof timeSlotString === 'string' && timeSlotString.includes('/')) {
            const [day, month, year, hour, minute] = timeSlotString.split('/');
            const fullYear = 2000 + parseInt(year);
            return new Date(fullYear, month - 1, day, hour, minute);
        }
        if (timeSlotString instanceof Date) {
            return timeSlotString;
        }
        return new Date(timeSlotString);
    } catch (error) {
        console.error('Error parsing time slot:', error);
        return null;
    }
};

const formatTimeSlot = (date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return null;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(2);
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year}/${hour}/${minute}`;
};

const formatTimeForDisplay = (timeSlot) => {
    const date = typeof timeSlot === 'string' ? parseTimeSlot(timeSlot) : timeSlot;

    if (!date || isNaN(date.getTime())) {
        return 'Invalid date';
    }

    return {
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
};

const getTimeSlotForDay = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(2);
    return `${day}/${month}/${year}`;
};

const calculateAvailableTimeSlots = (date, busyTimes, startHour = 9, endHour = 18, intervalMinutes = 5) => {
    const dayPrefix = getTimeSlotForDay(date);
    const busyTimesForDay = busyTimes.filter(time => time.startsWith(dayPrefix));

    const availableSlots = [];
    for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += intervalMinutes) {
            const hourStr = String(hour).padStart(2, '0');
            const minuteStr = String(minute).padStart(2, '0');
            const timeSlot = `${dayPrefix}/${hourStr}/${minuteStr}`;
            if (!busyTimesForDay.includes(timeSlot)) {
                availableSlots.push(timeSlot);
            }
        }
    }
    return availableSlots;
};

module.exports = {
    parseTimeSlot,
    formatTimeSlot,
    formatTimeForDisplay,
    getTimeSlotForDay,
    calculateAvailableTimeSlots
};