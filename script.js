// Holiday service class
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

// Global variables
const monthNamesRo = ["ianuarie","februarie","martie","aprilie","mai","iunie","iulie","august","septembrie","octombrie","noiembrie","decembrie"];
let currentYear = new Date().getFullYear();
let selectedYear = currentYear;
let selectedMonth = new Date().getMonth();
let leaveDays = [];

// Initialize holiday service
const holidayService = new RomanianHolidays();

// Tab functionality
document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
});

function handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('user')) localStorage.setItem('user', urlParams.get('user'));
    if (urlParams.has('tura')) localStorage.setItem('tura', urlParams.get('tura'));
    updateUserInfo();
}

function updateUserInfo() {
    const storedUser = localStorage.getItem('user');
    const storedTura = localStorage.getItem('tura');
    const userInfoElement = document.getElementById('userInfo');
    if (storedUser || storedTura) {
        let info = 'Configurare: ';
        if (storedUser) info += `Utilizator: ${storedUser} `;
        if (storedTura) info += `Tură: ${storedTura}`;
        userInfoElement.textContent = info;
        userInfoElement.style.display = 'block';
    } else {
        userInfoElement.textContent = 'Eroare!';
        userInfoElement.style.display = 'block';
    }
}

function getTuraFromUrl() {
    let tura = 2;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("tura")) {
        tura = parseInt(urlParams.get("tura"));
    } else if (urlParams.has("user")) {
        const users = ["ljc1q", "xxtoo", "fras0", "l3hb4"];
        const idx = users.indexOf(urlParams.get("user"));
        if (idx >= 0) tura = idx + 1;
    } else {
        const storedTura = localStorage.getItem('tura');
        const storedUser = localStorage.getItem('user');
        if (storedTura) {
            tura = parseInt(storedTura);
        } else if (storedUser) {
            const users = ["ljc1q", "xxtoo", "fras0", "l3hb4"];
            const idx = users.indexOf(storedUser);
            if (idx >= 0) tura = idx + 1;
        }
    }
    if (tura % 2 === 0) tura = 6 - tura;
    return tura;
}

function isPWA() {
    return window.navigator.standalone === true || 
           window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches;
}

function createYearButtons() {
    const yearButtonsContainer = document.getElementById('yearButtons');
    yearButtonsContainer.innerHTML = '';
    for (let year = currentYear - 3; year <= currentYear + 2; year++) {
        const button = document.createElement('button');
        button.className = 'year-btn';
        if (year === selectedYear) button.classList.add('active');
        button.textContent = year;
        button.onclick = function () {
            selectedYear = year;
            saveToLocalStorage();
            updateYearButtons();
            document.getElementById("holidayResult").innerHTML = ``;
            updateCalendar();
        };
        yearButtonsContainer.appendChild(button);
    }
}

function updateYearButtons() {
    const buttons = document.querySelectorAll('.year-btn');
    buttons.forEach(button => {
        if (parseInt(button.textContent) === selectedYear)
            button.classList.add('active');
        else
            button.classList.remove('active');
    });
}

function populateMonthSelect() {
    const monthSelect = document.getElementById('monthSelect');
    monthSelect.innerHTML = '';
    for (let month = 0; month < 12; month++) {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = monthNamesRo[month];
        if (month === selectedMonth) option.selected = true;
        monthSelect.appendChild(option);
    }
    monthSelect.addEventListener('change', function () {
        selectedMonth = parseInt(monthSelect.value);
        saveToLocalStorage();
        document.getElementById("holidayResult").innerHTML = ``;
        updateCalendar();
    });
}

function loadFromLocalStorage() {
    const storedYear = localStorage.getItem('selectedYear');
    const storedMonth = localStorage.getItem('selectedMonth');
    const storedLeaveDays = localStorage.getItem('leaveDays');
    
    if (storedYear) selectedYear = parseInt(storedYear);
    if (storedMonth) selectedMonth = parseInt(storedMonth);
    if (storedLeaveDays) leaveDays = JSON.parse(storedLeaveDays);
}

function saveToLocalStorage() {
    localStorage.setItem('selectedYear', selectedYear);
    localStorage.setItem('selectedMonth', selectedMonth);
    localStorage.setItem('leaveDays', JSON.stringify(leaveDays));
}

function initializeControls() {
    handleUrlParams();
    loadFromLocalStorage();
    createYearButtons();
    populateMonthSelect();
    if (!isPWA()) {
        const urlParams = new URLSearchParams(window.location.search);
        const storedUser = localStorage.getItem('user');
        const storedTura = localStorage.getItem('tura');
        let urlChanged = false;
        if (storedUser && !urlParams.has('user')) { urlParams.set('user', storedUser); urlChanged = true; }
        if (storedTura && !urlParams.has('tura')) { urlParams.set('tura', storedTura); urlChanged = true; }
        if (urlChanged) {
            const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
            window.history.replaceState({}, '', newUrl);
        }
    }
}

function toggleLeaveDay(year, month, day) {
    const dateKey = `${year}-${month}-${day}`;
    const index = leaveDays.indexOf(dateKey);
    
    if (index === -1) {
        leaveDays.push(dateKey);
    } else {
        leaveDays.splice(index, 1);
    }
    
    saveToLocalStorage();
    updateCalendar();
}

function updateCalendar() {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDay = (new Date(selectedYear, selectedMonth, 1).getDay() + 6) % 7;
    let tura = getTuraFromUrl();
    const date0 = new Date(2017, 0, 1);
    let fakeDayOfYear = Math.ceil((new Date(selectedYear, selectedMonth, 1) - date0) / 86400000);
    
    let html = `<table><tr><th>lun</th><th>mar</th><th>mie</th><th>joi</th><th>vin</th><th>sâm</th><th>dum</th></tr><tr>`;
    let dayCount = 1;
    
    for (let i = 0; i < 42; i++) {
        if (i >= firstDay && dayCount <= daysInMonth) {
            const dateKey = `${selectedYear}-${selectedMonth}-${dayCount}`;
            const isLeaveDay = leaveDays.includes(dateKey);
            
            let dayClass = isLeaveDay ? 'doy4' : `doy${(fakeDayOfYear + tura) % 4}`;
            
            html += `<td class="${dayClass}" data-day="${dayCount}">${dayCount}</td>`;
            fakeDayOfYear++; 
            dayCount++;
        } else {
            html += `<td></td>`;
        }
        
        if (i % 7 === 6 && dayCount <= daysInMonth) html += `</tr><tr>`;
        if (dayCount > daysInMonth && i % 7 === 6) break;
    }
    
    html += `</tr></table>`;
    document.getElementById("calendarContainer").innerHTML = html;
    
    const ldcount = leaveDays.length;
    const currentMonth = `${selectedYear}-${selectedMonth}-`;
    const currentmlc = leaveDays.filter(day => day.startsWith(currentMonth)).length;
    const mlc2 = ldcount ? `(${currentmlc}/${ldcount})`: ``;
    document.getElementById("selectedMonth").innerHTML = `Calendar ${monthNamesRo[selectedMonth]} ${selectedYear} ${mlc2}`;
    
    const dayCells = document.querySelectorAll('#calendarContainer td[data-day]');
    dayCells.forEach(cell => {
        cell.addEventListener('click', function() {
            const day = parseInt(this.getAttribute('data-day'));
            toggleLeaveDay(selectedYear, selectedMonth, day);
        });
    });
}

function getEasterDate(year) {
    const a = year % 4, b = year % 7, c = year % 19;
    const d = (19 * c + 15) % 30;
    const e = (2 * a + 4 * b - d + 34) % 7;
    const month = Math.floor((d + e + 114) / 31);
    const day = ((d + e + 114) % 31) + 1;
    let date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + 13);
    return date;
}

function getDayName(date) {
    const days = ['duminică', 'luni', 'marți', 'miercuri', 'joi', 'vineri', 'sâmbătă'];
    return days[date.getDay()];
}

function findClosestWorkShift(holidayDate, tura) {
    const date0 = new Date(2024, 0, 1);
    let closest = null, minDistance = Infinity;
    for (let offset = -10; offset <= 10; offset++) {
        let d = new Date(holidayDate);
        d.setDate(d.getDate() + offset);
        const daysDiff = Math.ceil((d - date0) / 86400000);
        const shift = (daysDiff + tura) % 4;
        if (shift === 2 || shift === 3) {
            let dist = Math.abs(offset);
            if (dist < minDistance) {
                minDistance = dist;
                closest = {
                    date: d,
                    shift: shift === 2 ? 'de zi' : 'de noapte',
                    dayName: getDayName(d)
                };
            }
        }
    }
    return closest;
}

function checkHoliday(type) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const tura = getTuraFromUrl();
    let date, name = '';
    
    if (type === "lcrt") { 
        date = new Date(); 
    } else if (type === "lless") { 
        date = new Date(selectedYear, selectedMonth - 1, new Date().getDate()); 
    } else if (type === "lgrt") {
        date = new Date(selectedYear, selectedMonth + 1, new Date().getDate());
        if (date.getFullYear() > currentYear + 2) date = new Date(currentYear + 2, 11, new Date().getDate());
    } else if (type === "lurm") { 
        date = new Date(currentYear, new Date().getMonth() + 1, 15); 
    } else if (type === "curm") {
        date = new Date(selectedYear, selectedMonth, 15);
        if (leaveDays) {
            while (true) {
                date = new Date(date.getFullYear(), date.getMonth() + 1, 15);
                if (date.getFullYear() > currentYear + 2) {
                    date = new Date(currentYear - 1, 0, 15);
                }
                if (date.getFullYear() === selectedYear && date.getMonth() === selectedMonth) {
                    break;
                }
                const currentMonth = `${date.getFullYear()}-${date.getMonth()}-`;
                const currentmlc = leaveDays.filter(day => day.startsWith(currentMonth)).length;
                if (currentmlc) break;  
            }
        }
    } else {
        for (let year = currentYear; year <= currentYear + 10; year++) {
            if (type === 'paste') { 
                date = getEasterDate(year); 
                name = 'Paște'; 
            } else if (type === 'craciun') { 
                date = new Date(year, 11, 25); 
                name = 'Crăciun'; 
            } else if (type === 'revelion') { 
                date = new Date(year, 0, 1); 
                name = 'Revelion'; 
            }
            if (date > currentDate) break;
        }
    }
    
    const closest = findClosestWorkShift(date, tura);
    if (closest) {
        const m = monthNamesRo[closest.date.getMonth()];
        const y = closest.date.getFullYear();
        const d = closest.date.getDate();
        const text = `De ${name} ${y} sunt ${closest.shift} ${closest.dayName}, ${d} ${m} ${y}`;
        if (name) {
            document.getElementById('holidayResult').textContent = text;
        } else {
            document.getElementById("holidayResult").innerHTML = ``;
        }
        selectedYear = y;
        selectedMonth = closest.date.getMonth();
    }
    
    saveToLocalStorage();
    updateYearButtons();
    populateMonthSelect();
    updateCalendar();
}

// Planner functionality
const daysInDecember = 31;
const saturdays = [6, 13, 20, 27];
const sundays = [7, 14, 21, 28];
const hoursPerWorkedDay = 12;
const hoursPerLeaveDay = 8;
const goalHours = 164;
let totalHours = 0;
let leaveDaysPlanner = 0;
let turaPlanner = 3;

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
    return await getDecemberHolidays(2025);
}

function updateStats() {
    const totalHoursDisplay = document.getElementById("total-hours");
    const leaveDaysDisplay = document.getElementById("leave-days");
    
    totalHoursDisplay.textContent = totalHours;
    leaveDaysDisplay.textContent = leaveDaysPlanner;
    document.getElementById("shift").innerHTML = `tura ${turaPlanner}`;
}

async function renderPlanner() {
    const calendar = document.querySelector(".planner-calendar");
    
    // Update holidays before rendering
    const holidays = await updateHolidays();
    
    calendar.innerHTML = ``;
    totalHours = 0;
    leaveDaysPlanner = 0;
    
    for (let day = 1; day <= daysInDecember; day++) {
        const dayElement = document.createElement("div");
        dayElement.classList.add("day");
        dayElement.textContent = day;
        
        // Determine initial day type
        const isHoliday = holidays.includes(day) || saturdays.includes(day) || sundays.includes(day);
        const isWorkDay = ((day + 7 - turaPlanner) % 4 < 2);
        
        if (isHoliday) {
            dayElement.classList.add("holiday");
	    dayElement.classList.remove("workday");
	    dayElement.classList.remove("day-off");
        } else if (isWorkDay) {
	    dayElement.classList.add("workday");
            totalHours += hoursPerWorkedDay;
        } else {
            dayElement.classList.add("day-off");
        }
        
        dayElement.addEventListener("click", () => toggleDayStatus(dayElement, day, holidays));
        calendar.appendChild(dayElement);
    }
    updateStats();
}

function toggleDayStatus(dayElement, day, holidays) {
    const isHoliday = holidays.includes(day) || saturdays.includes(day) || sundays.includes(day);
    const isWorkDay = (day + 7 - turaPlanner) % 4 < 2;
  if (isWorkDay) {
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

// Initialize both apps
window.addEventListener('load', function() {
    initializeControls();
    updateCalendar();
    renderPlanner();
    
    // Add event listener for shift switch in planner
    document.getElementById("switch-shift").addEventListener("click", () => {
        turaPlanner++;
        if (turaPlanner === 5) turaPlanner = 1;
        renderPlanner();
    });
});

document.addEventListener('visibilitychange', function() {
    if (!document.hidden) updateUserInfo();
});

if ("serviceWorker" in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register("sw.js");
    });
}
