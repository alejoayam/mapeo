const CATEGORY_COLORS = {
	deportivo: '#e74c3c',
	cafetero: '#2ecc71',
	cultural: '#f1c40f',
};

let map;
let currentMarker = null;
let currentPhoto = null;
let places = JSON.parse(localStorage.getItem('places')) || [];

function initMap() {
	map = L.map('map').setView([6.2442, -75.5812], 13);
	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '© OpenStreetMap contributors',
	}).addTo(map);

	places.forEach((place) => createMarker(place));
	updateMarkerList();

	map.on('click', (e) => {
		if (currentMarker) map.removeLayer(currentMarker);
		currentMarker = L.marker(e.latlng, {
			icon: L.divIcon({
				html: `<div style="background: ${
					CATEGORY_COLORS[document.getElementById('placeCategory').value]
				};
										 width: 25px; height: 25px; border-radius: 50%; border: 2px solid white;"></div>`,
			}),
		}).addTo(map);
	});

	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.register('/sw.js');
	}
}

document.addEventListener('DOMContentLoaded', initMap);

document.getElementById('photoInput').addEventListener('change', function (e) {
	const reader = new FileReader();
	reader.onload = (event) => {
		currentPhoto = event.target.result;
		document.getElementById('photoPreview').src = currentPhoto;
		document.getElementById('photoPreview').style.display = 'block';
	};
	reader.readAsDataURL(e.target.files[0]);
});

function savePlace() {
	if (!currentMarker) {
		alert('¡Primero haz clic en el mapa para posicionar el punto!');
		return;
	}

	const placeName = document.getElementById('placeName').value.trim();
	if (!placeName) {
		alert('¡El nombre del lugar es obligatorio!');
		return;
	}

	const place = {
		id: Date.now(),
		name: placeName,
		desc: document.getElementById('placeDesc').value,
		category: document.getElementById('placeCategory').value,
		lat: currentMarker.getLatLng().lat,
		lng: currentMarker.getLatLng().lng,
		photo: currentPhoto,
	};

	places.push(place);
	localStorage.setItem('places', JSON.stringify(places));
	createMarker(place);
	updateMarkerList();
	resetForm();
}

function createMarker(place) {
	const marker = L.marker([place.lat, place.lng], {
		icon: L.divIcon({
			html: `<div style="background: ${CATEGORY_COLORS[place.category]};
								 width: 30px; height: 30px; border-radius: 50%; border: 2px solid white;
								 display: flex; align-items: center; justify-content: center;
								 color: white; font-weight: bold; font-size: 14px;">
								 ${place.name.charAt(0).toUpperCase()}</div>`,
		}),
	}).addTo(map);

	let popupContent = `
			<div style="max-width: 250px;">
					<h3 style="color: ${CATEGORY_COLORS[place.category]}; margin: 0 0 10px 0;">${
		place.name
	}</h3>
					${place.desc ? `<p style="margin: 0 0 10px 0;">${place.desc}</p>` : ''}
					${
						place.photo
							? `<img src="${place.photo}" style="width: 100%; border-radius: 8px;">`
							: ''
					}
					<button onclick="if(confirm('¿Eliminar ${place.name.replace(
						/'/g,
						"\\'"
					)}?')) deletePlace(${place.id})" 
									style="background: #e74c3c; color: white; padding: 8px; border-radius: 4px; margin-top: 10px; width: 100%; cursor: pointer;">
							Eliminar
					</button>
			</div>
	`;

	marker.bindPopup(popupContent);
}

function updateMarkerList() {
	const list = document.getElementById('markerList');
	list.innerHTML = places
		.map(
			(place) => `
			<div class="marker-item" onclick="focusOnMarker(${place.lat}, ${place.lng})">
					<div class="marker-color" style="background: ${
						CATEGORY_COLORS[place.category]
					}"></div>
					<div style="flex-grow: 1;">
							<strong>${place.name}</strong><br>
							<small>${place.category}</small>
					</div>
					<button onclick="event.stopPropagation(); if(confirm('¿Eliminar ${place.name.replace(
						/'/g,
						"\\'"
					)}?')) deletePlace(${place.id})">
							×
					</button>
			</div>
	`
		)
		.join('');
}

function focusOnMarker(lat, lng) {
	map.flyTo([lat, lng], 16);
}

function deletePlace(id) {
	const placeToDelete = places.find((place) => place.id === id);
	if (!confirm(`¿Seguro que quieres eliminar "${placeToDelete.name}"?`)) return;

	map.eachLayer((layer) => {
		if (
			layer instanceof L.Marker &&
			layer.getLatLng().lat === placeToDelete.lat &&
			layer.getLatLng().lng === placeToDelete.lng
		) {
			map.removeLayer(layer);
		}
	});

	places = places.filter((place) => place.id !== id);
	localStorage.setItem('places', JSON.stringify(places));
	updateMarkerList();
}

function resetAll() {
	if (
		!confirm(
			'⚠️ ¿REINICIAR TODOS LOS DATOS?\nEsta acción no se puede deshacer.'
		)
	)
		return;

	map.eachLayer((layer) => {
		if (layer instanceof L.Marker) map.removeLayer(layer);
	});

	localStorage.removeItem('places');
	places = [];
	updateMarkerList();
	resetForm();
	map.setView([6.2442, -75.5812], 13);
	alert('✅ Todos los datos han sido reiniciados.');
}

function exportData() {
	const jsonData = JSON.stringify(places, null, 2);
	downloadFile(jsonData, 'lugares.json', 'application/json');

	html2canvas(document.querySelector('#map'), { scale: 2 }).then((canvas) => {
		canvas.toBlob((blob) => {
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `mapa_${Date.now()}.png`;
			a.click();
		}, 'image/png');
	});
}

function downloadFile(data, filename, type) {
	const blob = new Blob([data], { type });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
}

function resetForm() {
	document.getElementById('placeName').value = '';
	document.getElementById('placeDesc').value = '';
	document.getElementById('photoPreview').style.display = 'none';
	currentPhoto = null;
	if (currentMarker) map.removeLayer(currentMarker);
	currentMarker = null;
}
