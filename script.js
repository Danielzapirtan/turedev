class RomanianHolidays {
    constructor() {
        this.baseUrl = 'https://date.nager.at/api/v3';
    }

    // Get all holidays for a year
    async getHolidays(year = new Date().getFullYear()) {
        try {
            const response = await fetch(`${this.baseUrl}/PublicHolidays/${year}/RO`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error fetching holidays:', error);
            return null;
        }
    }

    // Check if a specific date is a holiday
    async isHoliday(date = new Date()) {
        const year = date.getFullYear();
        const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
        
        const holidays = await this.getHolidays(year);
        if (!holidays) return false;

        return holidays.some(holiday => holiday.date === dateString);
    }

    // Get upcoming holidays
    async getUpcomingHolidays(count = 5) {
        const currentYear = new Date().getFullYear();
        const holidays = await this.getHolidays(currentYear);
        
        if (!holidays) return [];

        const today = new Date().toISOString().split('T')[0];
        
        return holidays
            .filter(holiday => holiday.date >= today)
            .slice(0, count);
    }

    // Get holidays for multiple years
    async getHolidaysRange(startYear, endYear) {
        const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
        const promises = years.map(year => this.getHolidays(year));
        
        try {
            const results = await Promise.all(promises);
            return results.flat();
        } catch (error) {
            console.error('Error fetching holiday range:', error);
            return null;
        }
    }
}

const daysInDecember = 31;
// Remove hardcoded holidays and calculate them dynamically
let holidays = [];
const saturdays = [6, 13, 20, 27];
const sundays = [7, 14, 21, 28];
const normalDayshifts = [4, 8, 12, 16, 20, 24, 28];
const normalNightshifts = [1, 5, 9, 13, 17, 21, 25, 29];
const hoursPerWorkedDay = 12;
const hoursPerLeaveDay = 8;
const goalHours = 164;
let totalHours = 0;
let leaveDays = 0;
const calendar = document.querySelector(".calendar");
const totalHoursDisplay = document.getElementById("total-hours");
const leaveDaysDisplay = document.getElementById("leave-days");
let tura = 3;

// Initialize holiday service
const holidayService = new RomanianHolidays();

// Function to get December holidays for a specific year
async function getDecemberHolidays(year = 2025) {
    try {
        const allHolidays = await holidayService.getHolidays(year);
        if (!allHolidays) {
            console.warn('Could not fetch holidays, using fallback');
            return [1, 25, 26]; // Fallback to hardcoded values
        }
        
        // Filter holidays that are in December and extract the day
        const decemberHolidays = allHolidays
            .filter(holiday => {
                const month = parseInt(holiday.date.split('-')[1]);
                return month === 12;
            })
            .map(holiday => parseInt(holiday.date.split('-')[2]));
        
        console.log('December holidays:', decemberHolidays);
        return decemberHolidays;
    } catch (error) {
        console.error('Error getting December holidays:', error);
        return [1, 25, 26]; // Fallback to hardcoded values
    }
}

async function updateHolidays() {
    holidays = await getDecemberHolidays(2025);
}

function updateStats() {
  totalHoursDisplay.textContent = totalHours;
  leaveDaysDisplay.textContent = leaveDays;
  document.getElementById("shift").innerHTML = `tura ${tura}`;
}

async function render() {
  // Update holidays before rendering
  await updateHolidays();
  
  calendar.innerHTML = ``;
  totalHours = 0;
  for (let day = 1; day <= daysInDecember; day++) {
    const dayElement = document.createElement("div");
    dayElement.classList.add("day");
    dayElement.textContent = day;
    if (
      holidays.includes(day) ||
      saturdays.includes(day) ||
      sundays.includes(day)
    ) {
      dayElement.classList.add("holiday");
    }
    if ((day + 7 - tura) % 4 < 2) {
      dayElement.classList.add("workday");
      totalHours += hoursPerWorkedDay;
    }
    dayElement.addEventListener("click", () =>
      toggleDayStatus(dayElement, day)
    );
    calendar.appendChild(dayElement);
  }
  updateStats();
}

document.getElementById("switch-shift").addEventListener("click", () => {
  tura++;
  if (tura === 5) tura = 1;
  render();
});

// Initialize and render
render();

function toggleDayStatus(dayElement, day) {
  if ((day + 7 - tura) % 4 < 2) {
    if (dayElement.classList.contains("holiday")) {
      if (dayElement.classList.contains("workday")) {
        dayElement.classList.remove("workday");
        dayElement.classList.add("leave");
        totalHours -= hoursPerWorkedDay;
        leaveDays += 1;
      } else if (dayElement.classList.contains("leave")) {
        dayElement.classList.remove("leave");
        dayElement.classList.add("workday");
        totalHours += hoursPerWorkedDay;
        leaveDays -= 1;
      }
    } else {
      if (dayElement.classList.contains("workday")) {
        dayElement.classList.remove("workday");
        dayElement.classList.add("leave");
        totalHours -= 4;
        leaveDays += 1;
      } else if (dayElement.classList.contains("leave")) {
        dayElement.classList.remove("leave");
        dayElement.classList.add("workday");
        totalHours += 4;
        leaveDays -= 1;
      }
    }
  } else {
    if (dayElement.classList.contains("holiday")) {
      if (dayElement.classList.contains("leave")) {
        dayElement.classList.remove("leave");
        leaveDays -= 1;
      } else {
        dayElement.classList.add("leave");
        leaveDays += 1;
      }
    } else {
      if (dayElement.classList.contains("leave")) {
        dayElement.classList.remove("leave");
        totalHours -= 8;
        leaveDays -= 1;
      } else {
        dayElement.classList.add("leave");
        totalHours += 8;
        leaveDays += 1;
      }
    }
  }
  updateStats();
}