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
const refYear = 2017;
const minYear = refYear + 1;
const maxYear = 2037;

// Planner 2026 variables
let plannerYear = currentYear;
let plannerMonth = 0; // January
let plannerLeaveDays = [];
let plannerWorkedDays = 0;
let plannerTotalHours = 0;

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

      // If switching to planner 2026, update it
      if (tabId === 'planner2026') {
        updatePlanner2026();
      }
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

let plannerShift = getTuraFromUrl(); // Default shift
document.getElementById("shift-planner").textContent = plannerShift;

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

  // Load planner 2026 data
  const storedPlannerMonth = localStorage.getItem('plannerMonth');
  const storedPlannerShift = localStorage.getItem('plannerShift');
  const storedPlannerLeaveDays = localStorage.getItem('plannerLeaveDays');

  if (storedPlannerMonth) plannerMonth = parseInt(storedPlannerMonth);
  if (storedPlannerShift) plannerShift = parseInt(storedPlannerShift);
  if (storedPlannerLeaveDays) plannerLeaveDays = JSON.parse(storedPlannerLeaveDays);
}

function saveToLocalStorage() {
  localStorage.setItem('selectedYear', selectedYear);
  localStorage.setItem('selectedMonth', selectedMonth);
  localStorage.setItem('leaveDays', JSON.stringify(leaveDays));

  // Save planner 2026 data
  localStorage.setItem('plannerMonth', plannerMonth);
  localStorage.setItem('plannerShift', plannerShift);
  localStorage.setItem('plannerLeaveDays', JSON.stringify(plannerLeaveDays));
}

function initializeControls() {
  handleUrlParams();
  loadFromLocalStorage();
  createYearButtons();
  populateMonthSelect();

  // Initialize planner 2026 controls
  document.getElementById('prev-year').addEventListener('click', () => {
    plannerYear = plannerYear - 1;
    if (plannerYear < minYear)
      plannerYear = minYear;
    updatePlanner2026();
  });

  document.getElementById('next-year').addEventListener('click', () => {
    plannerYear = plannerYear + 1;
    if (plannerYear > maxYear)
      plannerYear = maxYear;
    updatePlanner2026();
  });

  // Initialize planner 2026 controls
  document.getElementById('prev-month').addEventListener('click', () => {
    plannerMonth = (plannerMonth - 1 + 12) % 12;
    updatePlanner2026();
  });

  document.getElementById('next-month').addEventListener('click', () => {
    plannerMonth = (plannerMonth + 1) % 12;
    updatePlanner2026();
  });

  // Initialize optimize button
  document.getElementById('optimize-leave').addEventListener('click', optimizeLeaveDays);

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
  const date0 = new Date(refYear, 0, 1);
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
      html += `<td class="unclickable"></td>`;
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
let totalHours = 0;
const tura = getTuraFromUrl();
let leaveDaysPlanner = 0;
let decemberHolidays = [1, 25, 26];

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
  decemberHolidays = await getDecemberHolidays(2025);
  return decemberHolidays;
}

function updateStats() {
  const totalHoursDisplay = document.getElementById("total-hours");
  const leaveDaysDisplay = document.getElementById("leave-days");

  totalHoursDisplay.textContent = totalHours;
  leaveDaysDisplay.textContent = leaveDaysPlanner;
}

async function renderPlanner() {
  const calendar = document.querySelector(".planner-calendar");

  // Update holidays before rendering
  await updateHolidays();

  calendar.innerHTML = ``;
  totalHours = 0;
  leaveDaysPlanner = 0;

  for (let day = 1; day <= daysInDecember; day++) {
    const dayElement = document.createElement("div");
    dayElement.classList.add("combined-day");
    dayElement.textContent = day;

    // Determine initial day type
    const isHoliday = decemberHolidays.includes(day) || saturdays.includes(day) || sundays.includes(day);
    const isWorkDay = ((day + 7 - plannerShift) % 4 < 2);

    if (isHoliday) {
      dayElement.classList.add("holiday");
    }
    if (isWorkDay) {
      dayElement.classList.add("workday");
      totalHours += hoursPerWorkedDay;
    } else {
      dayElement.classList.add("day-off");
    }

    dayElement.addEventListener("click", () => toggleDayStatus(dayElement, day));
    calendar.appendChild(dayElement);
  }
  updateStats();
}

function toggleDayStatus(dayElement, day) {
  const isHoliday = decemberHolidays.includes(day) || saturdays.includes(day) || sundays.includes(day);
  const isWorkDay = ((day + 7 - plannerShift) % 4 < 2);
  if (isWorkDay) {
    if (dayElement.classList.contains("holiday")) {
      if (dayElement.classList.contains("workday")) {
        dayElement.classList.remove("workday");
        dayElement.classList.add("leave");
        totalHours -= hoursPerWorkedDay;
      } else if (dayElement.classList.contains("leave")) {
        dayElement.classList.remove("leave");
        dayElement.classList.add("workday");
        totalHours += hoursPerWorkedDay;
      }
    } else {
      if (dayElement.classList.contains("workday")) {
        dayElement.classList.remove("workday");
        dayElement.classList.add("leave");
        totalHours -= 4;
        leaveDaysPlanner += 1;
      } else if (dayElement.classList.contains("leave")) {
        dayElement.classList.remove("leave");
        dayElement.classList.add("workday");
        totalHours += 4;
        leaveDaysPlanner -= 1;
      }
    }
  } else {
    if (dayElement.classList.contains("holiday")) {
      if (dayElement.classList.contains("leave")) {
        dayElement.classList.remove("leave");
      } else {
        dayElement.classList.add("leave");
      }
    } else {
      if (dayElement.classList.contains("leave")) {
        dayElement.classList.remove("leave");
        totalHours -= 8;
        leaveDaysPlanner -= 1;
      } else {
        dayElement.classList.add("leave");
        totalHours += 8;
        leaveDaysPlanner += 1;
      }
    }
  }

  updateStats();
}

// Planner 2026 functionality
async function updatePlanner2026() {
  const calendar = document.getElementById("planner-2026-calendar");
  const monthDisplay = document.getElementById("current-month");
  const yearDisplay = document.getElementById("current-year");
  const shiftDisplay = document.getElementById("shift-planner");
  const workedDaysDisplay = document.getElementById("worked-days");
  const leaveDaysDisplay = document.getElementById("leave-days-2026");
  const totalHoursDisplay = document.getElementById("total-hours-2026");

  // Update display
  monthDisplay.textContent = `${monthNamesRo[plannerMonth]}`;
  yearDisplay.textContent = `${plannerYear}`;
  plannerShift = getTuraFromUrl();
  if (plannerShift % 2 === 0) {
    plannerShift = 6 - plannerShift;
  }
  shiftDisplay.textContent = plannerShift;

  // Get holidays for the current month
  const holidays = await getHolidaysForMonth(plannerYear, plannerMonth);

  // Calculate days in month
  const daysInMonth = new Date(plannerYear, plannerMonth + 1, 0).getDate();
  const firstDay = (new Date(plannerYear, plannerMonth, 1).getDay() + 6) % 7;

  let targetHours = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    if (!holidays.includes(day) && (new Date(plannerYear, plannerMonth, day).getDay() % 6) != 0)
      targetHours += 8;
  }
  document.getElementById("target-hours-2026").textContent = targetHours;
  // Reset stats
  plannerWorkedDays = 0;
  plannerTotalHours = 0;
  let currentLeaveDays = 0;

  // Clear calendar
  calendar.innerHTML = '';

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    const emptyDay = document.createElement("div");
    emptyDay.classList.add("combined-day");
    emptyDay.classList.add("unclickable");
    calendar.appendChild(emptyDay);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = document.createElement("div");
    dayElement.classList.add("combined-day");

    // Add day number
    const dayNumber = document.createElement("div");
    dayNumber.classList.add("day-number");
    dayNumber.textContent = day;
    dayElement.appendChild(dayNumber);

    // Calculate shift
    const date0 = new Date(refYear, 0, 1);
    const currentDate = new Date(plannerYear, plannerMonth, day);
    const daysDiff = Math.ceil((currentDate - date0) / 86400000);
    let shift2 = plannerShift;
    if (shift2 % 2 === 0)
      shift2 = 6 - shift2;
    const shift = (daysDiff + shift2) % 4;

    // Add shift info
    const shiftInfo = document.createElement("div");
    shiftInfo.classList.add("day-shift");

    let shiftText = '';
    let isWorkDay = false;

    if (shift === 0 || shift === 1) {
      shiftText = 'Repaus';
      dayElement.classList.add("day-off");
    } else if (shift === 2) {
      shiftText = 'Zi';
      dayElement.classList.add("workday");
      isWorkDay = true;
    } else if (shift === 3) {
      shiftText = 'Noapte';
      dayElement.classList.add("workday");
      isWorkDay = true;
    }

    shiftInfo.textContent = shiftText;
    dayElement.appendChild(shiftInfo);

    // Check if holiday
    const isHoliday = holidays.includes(day) || 
      currentDate.getDay() === 0 || // Sunday
      currentDate.getDay() === 6;   // Saturday

    if (isHoliday) {
      dayElement.classList.add("holiday");
    }

    // Check if leave day
    const dateKey = `${plannerYear}-${plannerMonth}-${day}`;
    const isLeaveDay = plannerLeaveDays.includes(dateKey);

    if (isLeaveDay) {
      dayElement.classList.add("leave");
      if (!isHoliday) {
        currentLeaveDays++;
      }

      // Calculate hours for leave day
      if (!isHoliday && !isWorkDay) {
        plannerTotalHours += 8; // 8 hours for leave on holiday/day off
      } else if (!isHoliday && isWorkDay) {
        plannerTotalHours += 8; // 4 hours for leave on work day
      }
    } else if (isWorkDay) {
      plannerWorkedDays++;
      plannerTotalHours += 12; // 12 hours for work day
    }

    // Add click event
    dayElement.addEventListener('click', () => togglePlannerDay(plannerYear, plannerMonth, day));

    calendar.appendChild(dayElement);
  }

  // Update stats
  workedDaysDisplay.textContent = plannerWorkedDays;
  leaveDaysDisplay.textContent = currentLeaveDays;
  totalHoursDisplay.textContent = plannerTotalHours;

  // Save to localStorage
  saveToLocalStorage();
}

async function getHolidaysForMonth(year, month) {
  try {
    const allHolidays = await holidayService.getHolidays(year);
    if (!allHolidays) {
      console.warn('Could not fetch holidays, using fallback');
      // Return fallback holidays for each month
      return getFallbackHolidays(year, month);
    }

    // Filter holidays that are in the specified month and extract the day
    const monthHolidays = allHolidays
      .filter(holiday => {
        const holidayMonth = parseInt(holiday.date.split('-')[1]);
        return holidayMonth === month + 1; // API uses 1-based months
      })
      .map(holiday => parseInt(holiday.date.split('-')[2]));

    return monthHolidays;
  } catch (error) {
    console.error('Error getting holidays for month:', error);
    return getFallbackHolidays(year, month);
  }
}

function getFallbackHolidays(year, month) {
  // Fallback holidays for Romania
  const holidays = {
    0: [1, 2, 24], // January: 1, 2 (Revelion), 24 (Unirea Principatelor Române)
    3: [], // April: Easter is dynamic, will be handled separately
    4: [1], // May: 1 (Ziua Muncii)
    5: [1], // June: 1 (Ziua Copilului)
    7: [15], // August: 15 (Adormirea Maicii Domnului)
    10: [1, 30], // November: 1 (Ziua Națională), 30 (Sf. Andrei)
    11: [1, 25, 26] // December: 1 (Ziua Națională), 25, 26 (Crăciun)
  };

  // Add Easter for April if applicable
  if (month === 3) {
    const easter = getEasterDate(year);
    if (easter.getMonth() === 3) {
      holidays[3].push(easter.getDate());
      holidays[3].push(easter.getDate() + 1); // Easter Monday
    }
  }

  // Add Easter for May if applicable (when Easter is in late April)
  if (month === 4) {
    const easter = getEasterDate(year);
    if (easter.getMonth() === 3 && easter.getDate() > 25) {
      holidays[4].push(easter.getDate() + 1); // Easter Monday
    }
  }

  return holidays[month] || [];
}

function togglePlannerDay(year, month, day) {
  const dateKey = `${year}-${month}-${day}`;
  const index = plannerLeaveDays.indexOf(dateKey);

  if (index === -1) {
    plannerLeaveDays.push(dateKey);
  } else {
    plannerLeaveDays.splice(index, 1);
  }

  updatePlanner2026();
}

// Schedule optimization algorithm from schedule-2026.js
async function optimizeLeaveDays() {
  const resultElement = document.getElementById('optimization-result');
  resultElement.textContent = 'Se calculează...';
  resultElement.className = 'optimization-result calculating';

  try {
    const year = plannerYear;
    const month = plannerMonth;
    
    // Get holidays for the current month
    const holidays = await getHolidaysForMonth(year, month);
    
    // Add weekends to holidays
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (date.getDay() === 0 || date.getDay() === 6) { // Sunday or Saturday
        if (!holidays.includes(day)) {
          holidays.push(day);
        }
      }
    }
    
    holidays.sort((a, b) => a - b);
    
    // Calculate target hours
    let targetHours = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      if (!holidays.includes(day) && (new Date(year, month, day).getDay() % 6) !== 0) {
        targetHours += 8;
      }
    }
    
    const refDate = new Date(refYear, 0, 0);
    let best = [-Infinity, -Infinity];
    let bestChoice = [-1, -1];
    
    // Try all possible leave periods
    for (let startDay = 1; startDay <= daysInMonth - 1; startDay++) {
      for (let endDay = startDay + 1; endDay <= daysInMonth; endDay++) {
        let score = [0, 0];
        const leaves = [];

        // Create leave period
        for (let day = startDay; day <= endDay; day++) {
          leaves.push(day);
        }

        score[1] = leaves.length;
        let countHours = 0;

        // Calculate hours for this configuration
        for (let day = 1; day <= daysInMonth; day++) {
          const date1 = new Date(year, month, day);
          const ecart = Math.round((date1 - refDate) / 86400000);
          
          // Check if it's a work day and not on leave
          if (((ecart % 4) < 2) && !leaves.includes(day)) {
            countHours += 12;
          } else if (!holidays.includes(day) && leaves.includes(day)) {
            // Leave day on regular day
            countHours += 8;
          }
          // Holidays and weekends don't contribute to hours
        }

        // Only consider configurations that match target hours
        if (countHours === targetHours) {
          // Calculate score: count work days that fall on holidays
          for (let day = 1; day <= daysInMonth; day++) {
            const date1 = new Date(year, month, day);
            const ecart = Math.round((date1 - refDate) / 86400000);
            
            // If it's a holiday, a work day, and not on leave
            if (holidays.includes(day) && ((ecart % 4) < 2) && !leaves.includes(day)) {
              score[0] += 1;
            }
          }
        }

        // Update best choice
        if (score[0] > best[0] || (score[0] === best[0] && score[1] > best[1])) {
          best[0] = score[0];
          best[1] = score[1];
          bestChoice[0] = startDay;
          bestChoice[1] = endDay;
        }
      }
    }

    // Apply the best leave period
    if (bestChoice[0] !== -1 && bestChoice[1] !== -1) {
      // Clear existing leave days for this month
      plannerLeaveDays = plannerLeaveDays.filter(day => {
        const [y, m, d] = day.split('-').map(Number);
        return !(y === year && m === month);
      });

      // Add new leave days
      for (let day = bestChoice[0]; day <= bestChoice[1]; day++) {
        const dateKey = `${year}-${month}-${day}`;
        plannerLeaveDays.push(dateKey);
      }

      // Update the planner
      updatePlanner2026();

      resultElement.textContent = `Concediu optimizat: zilele ${bestChoice[0]}-${bestChoice[1]} ${monthNamesRo[month]}`;
      resultElement.className = 'optimization-result success';
    } else {
      resultElement.textContent = 'Nu s-a găsit o soluție optimă';
      resultElement.className = 'optimization-result error';
    }
  } catch (error) {
    console.error('Error optimizing leave days:', error);
    resultElement.textContent = 'Eroare la optimizare';
    resultElement.className = 'optimization-result error';
  }
}

// Initialize both apps
window.addEventListener('load', function() {
  initializeControls();
  updateCalendar();
  renderPlanner();
  updatePlanner2026();
});

document.addEventListener('visibilitychange', function() {
  if (!document.hidden) updateUserInfo();
});

if ("serviceWorker" in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register("sw.js");
  });
}
