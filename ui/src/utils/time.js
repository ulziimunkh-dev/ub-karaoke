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

export const formatTimeRange = (rangeStr) => {
    if (!rangeStr) return '';
    try {
        const [start, end] = rangeStr.split('-');
        const formatTime = (time) => {
            const [h, m] = time.split(':').map(Number);
            const ampm = h >= 12 ? 'PM' : 'AM';
            // User requested format like 16:00PM (24h + ampm suffix)
            return `${time.trim()}${ampm}`;
        };
        return `${formatTime(start)}-${formatTime(end)}`;
    } catch (e) {
        return rangeStr;
    }
};

export const getOpeningHoursMap = (operatingHours) => {
    if (!operatingHours) return {};
    let hoursMap = {};

    // Handle new Array structure (from database)
    if (Array.isArray(operatingHours)) {
        operatingHours.forEach(h => {
            const open = h.openTime.slice(0, 5);
            const close = h.closeTime.slice(0, 5);
            hoursMap[h.dayOfWeek.charAt(0) + h.dayOfWeek.slice(1).toLowerCase()] = `${open}-${close}`;
        });
    }
    // Handle legacy JSON structure
    else if (typeof operatingHours === 'object') {
        hoursMap = operatingHours;
    }
    // Handle legacy stringified JSON
    else if (typeof operatingHours === 'string') {
        try {
            hoursMap = JSON.parse(operatingHours);
        } catch (e) {
            console.error("Failed to parse opening hours", e);
            return {};
        }
    }
    return hoursMap;
};

export const isVenueOpen = (operatingHours) => {
    const hoursMap = getOpeningHoursMap(operatingHours);
    if (!hoursMap) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentDay = getCurrentDayName();
    const prevDay = getPreviousDayName(currentDay);

    // Check today's schedule
    const todayRange = hoursMap[currentDay] || hoursMap['Daily'] || hoursMap[currentDay.toUpperCase()];
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
    const prevRange = hoursMap[prevDay] || hoursMap['Daily'] || hoursMap[prevDay.toUpperCase()];
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
