const monthNamesRo = ["ianuarie","februarie","martie","aprilie","mai","iunie","iulie","august","septembrie","octombrie","noiembrie","decembrie"];
let currentYear = new Date().getFullYear();
let selectedYear = currentYear;
let selectedMonth = new Date().getMonth();

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
		userInfoElement.style.display = 'none';
	}
}

function getTuraFromUrl() {
	let tura = 4;
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

function createYearButtons() {
	const yearButtonsContainer = document.getElementById('yearButtons');
	yearButtonsContainer.innerHTML = '';
	for (let year = currentYear - 1; year <= currentYear + 2; year++) {
		const button = document.createElement('button');
		button.className = 'year-btn';
		if (year === selectedYear) button.classList.add('active');
		button.textContent = year;
		button.onclick = function () {
			selectedYear = year;
			saveToLocalStorage();
			updateYearButtons();
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
		updateCalendar();
	});
}

function loadFromLocalStorage() {
	const storedYear = localStorage.getItem('selectedYear');
	const storedMonth = localStorage.getItem('selectedMonth');
	if (storedYear) selectedYear = parseInt(storedYear);
	if (storedMonth) selectedMonth = parseInt(storedMonth);
}

function saveToLocalStorage() {
	localStorage.setItem('selectedYear', selectedYear);
	localStorage.setItem('selectedMonth', selectedMonth);
}

function initializeControls() {
	handleUrlParams();
	loadFromLocalStorage();
	createYearButtons();
	populateMonthSelect();
}

function updateCalendar() {
	const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
	const firstDay = (new Date(selectedYear, selectedMonth, 1).getDay() + 6) % 7;
	let tura = getTuraFromUrl();
	const date0 = new Date(2024, 0, 1);
	let fakeDayOfYear = Math.ceil((new Date(selectedYear, selectedMonth, 1) - date0) / 86400000);
	let html = `<table><tr><th>lun</th><th>mar</th><th>mie</th><th>joi</th><th>vin</th><th>sâm</th><th>dum</th></tr><tr>`;
	let dayCount = 1;
	for (let i = 0; i < 42; i++) {
		if (i >= firstDay && dayCount <= daysInMonth) {
			let dt = (fakeDayOfYear + tura) % 4;
			html += `<td class="doy${dt}">${dayCount}</td>`;
			fakeDayOfYear++; dayCount++;
		} else {
			html += `<td></td>`;
		}
		if (i % 7 === 6 && dayCount <= daysInMonth) html += `</tr><tr>`;
		if (dayCount > daysInMonth && i % 7 === 6) break;
	}
	html += `</tr></table>`;
	document.getElementById("calendarContainer").innerHTML = html;
	document.getElementById("selectedMonth").innerHTML = `Calendar ${monthNamesRo[selectedMonth]} ${selectedYear}`;
}

window.addEventListener('load', function() {
	initializeControls();
	updateCalendar();
});

document.addEventListener('visibilitychange', function() {
	if (!document.hidden) updateUserInfo();
});

