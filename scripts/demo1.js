document.addEventListener('DOMContentLoaded', () => {
    const mapElement = document.getElementById('map');
    const controlsContainer = document.getElementById('controls-container');
    const sportSelectionPopover = document.getElementById('sport-selection-popover');
    const sportSearchInput = document.getElementById('sport-search-input');
    const sportOptionsList = document.getElementById('sport-options-list');
    const timeSelectionPopover = document.getElementById('time-selection-popover');
    const hoursInput = document.getElementById('hours');
    const minutesInput = document.getElementById('minutes');
    const confirmTimeButton = document.getElementById('confirm-time-button');
    const timeArrowButtons = document.querySelectorAll('.time-arrow');

    let map;
    let userMarkersLayer = L.layerGroup();
    let placeHighlightsLayer = L.layerGroup();
    let currentMapCenter = { lat: 21.0285, lon: 105.8542 };
    const initialZoomLevel = 14;
    let selectedSport = null;
    let selectedTime = null;

    const sports = ["Bóng đá", "Bóng chuyền", "Bóng rổ", "Cầu lông", "Tennis", "Bơi lội", "Chạy bộ", "Yoga", "Gym", "Đạp xe", "Bóng bàn", "Bi-a"];
    const userNames = ["Linh", "Minh", "Khánh", "Phương", "Tuấn", "Hương", "Đức", "Mai", "Sơn", "Ngọc", "Trang", "Hải", "Thảo", "Quân"];
    const genders = ["Nam", "Nữ"];
    
    // Gender-based color palettes
    const femaleAvatarColors = ['#FF69B4', '#FFC0CB', '#FFB6C1', '#DB7093', '#FBAED2', '#FF1493', '#C71585', '#FF85A1', '#F78FB3']; // Pinks, light purples, magentas
    const maleAvatarColors = ['#4682B4', '#5F9EA0', '#2E8B57', '#483D8B', '#000080', '#191970', '#008080', '#2F4F4F', '#556B2F']; // Blues, teals, greens, dark slates
    const neutralAvatarColors = ['#FFCA28', '#26A69A', '#42A5F5', '#FFA726', '#66BB6A', '#AB47BC', '#78909C', '#A1887F', '#FF7043', '#795548', '#FFD700'];

    const maleBios = ["Thích cà phê và code dạo.", "Tìm đồng đội giao lưu học hỏi.", "Chơi hết mình, không ngại khó khăn."];
    const femaleBios = ["Vui vẻ, hòa đồng, thích thể thao.", "Mong muốn rèn luyện sức khỏe.", "Tìm bạn chơi cùng cho có động lực."];
    const genericBios = ["Thể thao là cuộc sống!", "Yêu vận động, ghét ngồi yên."];
    const defaultPlaceHighlightStyle = { radius: 150, color: '#D32F2F', weight: 2.5, dashArray: '6, 6', fillOpacity: 0.05, fillColor: '#D32F2F' };
    const activePlaceHighlightStyle = { radius: 160, color: '#FF1744', weight: 3.5, dashArray: null, fillOpacity: 0.15, fillColor: '#FF1744' };

    function initMap(lat, lon) { /* ... (same as before) ... */
        currentMapCenter = { lat, lon };
        map = L.map(mapElement, { preferCanvas: true }).setView([lat, lon], initialZoomLevel);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 19, subdomains: 'abcd'
        }).addTo(map);
        userMarkersLayer.addTo(map); placeHighlightsLayer.addTo(map);
        map.on('moveend', () => { currentMapCenter = { lat: map.getCenter().lat, lon: map.getCenter().lng }; });
        updateControlButtons(); populateSportOptionsList();
    }
    if (navigator.geolocation) { navigator.geolocation.getCurrentPosition(p => initMap(p.coords.latitude, p.coords.longitude), () => initMap(currentMapCenter.lat, currentMapCenter.lon)); } else { initMap(currentMapCenter.lat, currentMapCenter.lon); }

    function createActionButton(id, text, cb, cC = '') { /* ... (same as before) ... */ const b = document.createElement('button'); b.id = id; b.classList.add('action-button'); if (cC) b.classList.add(cC); b.textContent = text; b.onclick = cb; requestAnimationFrame(() => { b.classList.add('visible'); }); return b; }
    function updateControlButtons() { /* ... (same as before) ... */
        controlsContainer.innerHTML = ''; const sBT = selectedSport ? `Môn: ${selectedSport}` : 'Chọn môn thể thao';
        controlsContainer.appendChild(createActionButton('sport-button', sBT, toggleSportPopover));
        if (selectedSport) { const tBT = selectedTime ? `Giờ: ${String(selectedTime.hours).padStart(2, '0')}:${String(selectedTime.minutes).padStart(2, '0')}` : 'Thời gian chơi'; controlsContainer.appendChild(createActionButton('time-button', tBT, toggleTimePopover)); }
        Array.from(controlsContainer.children).forEach(b => { b.classList.remove('visible'); void b.offsetWidth; b.classList.add('visible'); });
    }
    function populateSportOptionsList(fT = "") { /* ... (same as before) ... */ sportOptionsList.innerHTML = ''; const fS = sports.filter(s => s.toLowerCase().includes(fT.toLowerCase())); fS.forEach(s => { const b = document.createElement('button'); b.textContent = s; b.onclick = () => selectSport(s); sportOptionsList.appendChild(b); }); }
    sportSearchInput.addEventListener('input', (e) => populateSportOptionsList(e.target.value));
    let sBEC; function toggleSportPopover() { /* ... (same as before) ... */ sBEC = document.getElementById('sport-button'); if (!sBEC) return; if (sportSelectionPopover.classList.contains('hidden')) { closeTimePopover(); const r = sBEC.getBoundingClientRect(); sportSelectionPopover.style.bottom = `${window.innerHeight - r.top}px`; sportSelectionPopover.style.right = `${window.innerWidth - r.right}px`; sportSelectionPopover.classList.remove('hidden'); sportSearchInput.value = ''; populateSportOptionsList(); sportSearchInput.focus(); addClickOutsideCatcher(closeSportPopover, sportSelectionPopover, sBEC); } else { closeSportPopover(); } }
    function closeSportPopover() { sportSelectionPopover.classList.add('hidden'); removeClickOutsideCatcher(); }
    function selectSport(s) { /* ... (same as before) ... */ selectedSport = s; closeSportPopover(); updateControlButtons(); if (selectedSport && selectedTime) { addUsersToMap(); } else { clearUserMarkers(); } }
    
    // --- Time Selection with Arrows ---
    timeArrowButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetInputId = button.dataset.target; // 'hours' or 'minutes'
            const direction = parseInt(button.dataset.direction); // 1 or -1
            const inputElement = document.getElementById(targetInputId);
            
            let currentValue = parseInt(inputElement.value);
            let newValue;

            if (targetInputId === 'hours') {
                newValue = currentValue + direction;
                if (newValue > 23) newValue = 0;
                if (newValue < 0) newValue = 23;
            } else { // minutes
                newValue = currentValue + direction;
                if (newValue > 59) newValue = 0;
                if (newValue < 0) newValue = 59;
            }
            inputElement.value = String(newValue).padStart(2, '0');
        });
    });

    let tBEC; function toggleTimePopover() { tBEC = document.getElementById('time-button'); if(!tBEC) return; if (timeSelectionPopover.classList.contains('hidden')) { closeSportPopover(); hoursInput.value = (selectedTime ? selectedTime.hours : parseInt(hoursInput.value || 17)).toString().padStart(2,'0'); minutesInput.value = (selectedTime ? selectedTime.minutes : parseInt(minutesInput.value || 0)).toString().padStart(2,'0'); const r = tBEC.getBoundingClientRect(); timeSelectionPopover.style.bottom = `${window.innerHeight - r.top}px`; timeSelectionPopover.style.right = `${window.innerWidth - r.right}px`; timeSelectionPopover.classList.remove('hidden'); addClickOutsideCatcher(closeTimePopover, timeSelectionPopover, tBEC); } else { closeTimePopover(); } }
    function closeTimePopover() { timeSelectionPopover.classList.add('hidden'); removeClickOutsideCatcher(); }
    confirmTimeButton.onclick = () => { const h = parseInt(hoursInput.value), m = parseInt(minutesInput.value); if (isNaN(h) || h<0||h>23||isNaN(m)||m<0||m>59) { alert("Thời gian không hợp lệ."); return; } selectedTime = {hours:h,minutes:m}; closeTimePopover(); updateControlButtons(); if (selectedSport && selectedTime) { addUsersToMap(); } else { clearUserMarkers(); } };
    
    let cOC; function addClickOutsideCatcher(cb, pE, tBE) { /* ... (same as before) ... */ if (cOC) removeClickOutsideCatcher(); cOC = document.createElement('div'); cOC.id = 'click-outside-catcher'; cOC.onclick = (e) => { if (pE && !pE.contains(e.target) && tBE && !tBE.contains(e.target)) { cb(); } }; document.body.appendChild(cOC); }
    function removeClickOutsideCatcher() { if (cOC) { cOC.remove(); cOC = null; } }
    function getRndEl(a){return a[Math.floor(Math.random()*a.length)];} function getRndTime(){if(!selectedTime)return"N/A";let tM=selectedTime.hours*60+selectedTime.minutes;tM+=Math.floor(Math.random()*61)-30;tM=Math.max(0,Math.min(1439,tM));const h=Math.floor(tM/60),m=tM%60;return`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`; } function getRndAge(){return 18+Math.floor(Math.random()*33);} function getRndBio(g){const cB=[...genericBios];if(g==="Nam")cB.push(...maleBios);if(g==="Nữ")cB.push(...femaleBios);return getRndEl(cB);}
    function darkCol(h,p){h=h.replace(/^#/,'');let r=parseInt(h.substring(0,2),16),g=parseInt(h.substring(2,4),16),b=parseInt(h.substring(4,6),16);const f=1-p/100;r=Math.max(0,Math.min(255,Math.floor(r*f)));g=Math.max(0,Math.min(255,Math.floor(g*f)));b=Math.max(0,Math.min(255,Math.floor(b*f)));return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`; }
    function createInnerAvatarSvg(c,s="100%"){const sC=darkCol(c,20),eC=darkCol(c,60);return `<svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="${c}" stroke="${sC}" stroke-width="6"/><circle cx="33" cy="42" r="9" fill="${eC}"/><circle cx="67" cy="42" r="9" fill="${eC}"/><path d="M30 68 Q50 85 70 68" stroke="${eC}" stroke-width="7" fill="transparent" stroke-linecap="round"/></svg>`;}
    function createPlacePinSvg(c="#D32F2F",s="100%"){return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="${c}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/><circle cx="12" cy="9.5" r="1.8" fill="white"/></svg>`;}
    function getRndPt(cL,cLo,minR,maxR){const R=6371e3,rM=minR+Math.random()*(maxR-minR),a=Math.random()*2*Math.PI,dL=(rM*Math.cos(a))/R*(180/Math.PI),dLo=(rM*Math.sin(a))/(R*Math.cos(cL*Math.PI/180))*(180/Math.PI);return{lat:cL+dL,lon:cLo+dLo};}
    function clearUserMarkers(){ userMarkersLayer.clearLayers(); placeHighlightsLayer.clearLayers(); }

    function addUsersToMap() {
        if (!map || !selectedSport || !selectedTime) { clearUserMarkers(); return; }
        clearUserMarkers();
        const numUsers = 15 + Math.floor(Math.random() * 10);

        for (let i = 0; i < numUsers; i++) {
            const { lat, lon } = getRndPt(currentMapCenter.lat, currentMapCenter.lon, 500, 2000);
            const name = getRndEl(userNames);
            const gender = getRndEl(genders); // "Nam" or "Nữ"
            const age = getRndAge();
            const playTime = getRndTime(), bio = getRndBio(gender);
            const isHighlightedUser = Math.random() < 0.30;
            
            let avatarColor;
            if (gender === "Nữ") {
                avatarColor = getRndEl(femaleAvatarColors);
            } else if (gender === "Nam") {
                avatarColor = getRndEl(maleAvatarColors);
            } else { // Should not happen with current genders array, but good fallback
                avatarColor = getRndEl(neutralAvatarColors);
            }
            
            const iconHtml = `<div class="avatar-scaler">${createInnerAvatarSvg(avatarColor)}</div>`;
            const userMarkerDivIcon = L.divIcon({ html: iconHtml, className: 'custom-avatar-icon' + (isHighlightedUser ? ' highlighted-user-marker-outer' : ''), iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -22] });
            const userMarker = L.marker([lat, lon], { icon: userMarkerDivIcon }).addTo(userMarkersLayer);
            let popupContent = `<p><strong>Tên:</strong> ${name}</p><p><strong>Giới tính:</strong> ${gender}</p><p><strong>Tuổi:</strong> ${age}</p><p><strong>Thời gian:</strong> ${playTime}</p><p class="bio">${bio}</p>`;
            
            if (isHighlightedUser) {
                const placeLocation = getRndPt(lat, lon, 50, 1000);
                const placeName = `Sân ${selectedSport} ${String.fromCharCode(65+i%5)}${Math.floor(i/5)+1}`;
                popupContent = `<p><strong>Tên:</strong> ${name}</p><p><strong>Giới tính:</strong> ${gender}</p><p><strong>Tuổi:</strong> ${age}</p><p><strong>Thời gian:</strong> ${playTime}</p><p><strong>Địa điểm gợi ý:</strong> ${placeName}</p><p class="bio">${bio}</p>`;
                
                const placePinColor = avatarColor; // Match user's avatar color for their place pin
                
                const placePinIcon = L.divIcon({html: createPlacePinSvg(placePinColor), className:'place-marker', iconSize:[28,28], iconAnchor:[14,28]});
                const placePinMarker = L.marker([placeLocation.lat, placeLocation.lon], { icon: placePinIcon, interactive: false }).addTo(userMarkersLayer);
                const placeHighlightCircle = L.circle([placeLocation.lat, placeLocation.lon], defaultPlaceHighlightStyle);

                userMarker.on('mouseover', () => { /* ... (same as before) ... */
                    if (map) placeHighlightCircle.addTo(placeHighlightsLayer);
                    userMarker.getElement()?.querySelector('.avatar-scaler')?.classList.add('hover-active-avatar-inner');
                    userMarker.getElement()?.classList.add('active-hover-wrapper');
                    placePinMarker.getElement()?.classList.add('hover-active-pin');
                    placeHighlightCircle.setStyle(activePlaceHighlightStyle);
                });
                userMarker.on('mouseout', () => { /* ... (same as before) ... */
                    if (map) placeHighlightsLayer.removeLayer(placeHighlightCircle);
                    userMarker.getElement()?.querySelector('.avatar-scaler')?.classList.remove('hover-active-avatar-inner');
                    userMarker.getElement()?.classList.remove('active-hover-wrapper');
                    placePinMarker.getElement()?.classList.remove('hover-active-pin');
                    placeHighlightCircle.setStyle(defaultPlaceHighlightStyle);
                });
            }
            userMarker.bindPopup(popupContent, { className:'user-info-popup' });
        }
    }
    updateControlButtons();
});