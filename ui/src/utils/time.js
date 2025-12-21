export const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const getCurrentDayName = () => {
    const today = new Date();
    return daysOfWeek[today.getDay()];
};

export const getPreviousDayName = (dayName) => {
    const index = daysOfWeek.indexOf(dayName);
    const prevIndex = (index - 1 + 7) % 7;
    return daysOfWeek[prevIndex];
};

export const parseTime = (timeStr) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

export const isVenueOpen = (openingHours) => {
    if (!openingHours) return false;

    // Handle stringified JSON if necessary
    let hoursMap = openingHours;
    if (typeof openingHours === 'string') {
        try {
            hoursMap = JSON.parse(openingHours);
        } catch (e) {
            console.error("Failed to parse opening hours", e);
            return false;
        }
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentDay = getCurrentDayName();
    const prevDay = getPreviousDayName(currentDay);

    // Check today's schedule
    const todayRange = hoursMap[currentDay];
    if (todayRange) {
        const [startStr, endStr] = todayRange.split('-');
        const start = parseTime(startStr);
        const end = parseTime(endStr);

        if (start !== null && end !== null) {
            if (start < end) {
                // Normal hours (e.g. 09:00 - 17:00)
                if (currentMinutes >= start && currentMinutes <= end) {
                    return true;
                }
            } else {
                // Overnight (e.g. 14:00 - 04:00)
                // Open if after start time (e.g. 23:00)
                if (currentMinutes >= start) {
                    return true;
                }
            }
        }
    }

    // Check previous day's schedule (if it spills over to today)
    const prevRange = hoursMap[prevDay];
    if (prevRange) {
        const [startStr, endStr] = prevRange.split('-');
        const start = parseTime(startStr);
        const end = parseTime(endStr);

        if (start !== null && end !== null) {
            if (start > end) {
                // Previous day was overnight (e.g. 14:00 - 04:00)
                // Open if before end time (e.g. 02:00)
                if (currentMinutes <= end) {
                    return true;
                }
            }
        }
    }

    return false;
};
