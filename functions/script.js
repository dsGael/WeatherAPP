import { API_KEY } from "./env.js";


const domNodes = {
    searchForm: document.getElementById('search-form'),
    cityInput: document.getElementById('city-input'),
    currentWeather: document.getElementById('current-weather'),
    forecast: document.getElementById('forecast'),
    forecastGrid: document.getElementById('forecast-grid'),
    activityList: document.getElementById('activity-list')
};


domNodes.searchForm.addEventListener('submit', (event) => {
    event.preventDefault(); 
    const query = domNodes.cityInput.value.trim();
    if (query) {
        fetchWeatherData(query);
    }
});


async function fetchWeatherData(city) {
    try {
        const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (geoData.length === 0) {
            alert("Ciudad no encontrada. Intenta con otro nombre.");
            return;
        }

        const { lat, lon, name, country } = geoData[0];

        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`;

       
        const [weatherRes, forecastRes] = await Promise.all([
            fetch(weatherUrl),
            fetch(forecastUrl)
        ]);

        const weatherData = await weatherRes.json();
        const forecastData = await forecastRes.json();

        // Paso 3: Actualizar la UI
        renderCurrentWeather(weatherData, name, country);
        renderForecast(forecastData);
        generateRecommendations(weatherData.weather[0].main); // Recomendaciones 

    } catch (error) {
        console.error("Error al obtener datos:", error);
        alert("Hubo un error de conexión.");
    }
}


function renderCurrentWeather(data, name, country) {
    domNodes.currentWeather.classList.remove('hidden');
    
    const temp = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const icon = data.weather[0].icon;

    // Inserción limpia de HTML
    domNodes.currentWeather.innerHTML = `
        <h2 class="text-xl font-semibold mb-2">Clima Actual en <span class="text-blue-600">${name}, ${country}</span></h2>
        <div class="flex items-center gap-6">
            <div class="bg-blue-100 p-2 rounded-full w-24 h-24 flex items-center justify-center shadow-inner">
                <img src="https://openweathermap.org/img/wn/${icon}@4x.png" alt="${description}" class="w-full h-full drop-shadow-sm">
            </div>
            <div>
                <p class="text-5xl font-bold text-gray-800 flex items-start">
                    ${temp}<span class="text-xl mt-1">°C</span>
                </p>
                <p class="text-gray-600 capitalize text-lg">${description}</p>
                <div class="text-sm text-gray-500 mt-1 flex gap-3">
                    <span>💧 ${data.main.humidity}% Hum</span>
                    <span>💨 ${data.wind.speed} m/s</span>
                </div>
            </div>
        </div>
    `;
}

function renderForecast(data) {
    domNodes.forecast.classList.remove('hidden');
    domNodes.forecastGrid.innerHTML = ''; // Limpiar anterior

    // Filtrar para obtener una predicción por día (cerca de mediodía)
    // La API devuelve datos cada 3 horas.
    const uniqueDays = [];
    const seenDates = new Set();

    data.list.forEach(item => {
        const dateObj = new Date(item.dt * 1000);
        const dayString = dateObj.toLocaleDateString();
        
        // Tomamos 1 registro por día, preferiblemente a mediodía (entre las 11 y las 14) o el primero que encontremos
        const hour = dateObj.getHours();
        
        if (!seenDates.has(dayString)) {
            if (hour >= 11 && hour <= 14) {
                seenDates.add(dayString);
                uniqueDays.push(item);
            } else if (!seenDates.has(dayString) && uniqueDays.length < 5) {
                // Fallback: si no encontramos hora exacta, guardamos pero seguimos buscando una mejor hora si es el mismo día
                // Para simplificar, añadimos el primero y marcamos
                seenDates.add(dayString);
                uniqueDays.push(item);
            }
        }
    });

    // Renderizar solo los primeros 5 días encontrados
    uniqueDays.slice(0, 5).forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
        const temp = Math.round(day.main.temp);
        const icon = day.weather[0].icon;

        const cardHTML = `
            <div class="bg-gray-50 p-3 rounded-lg text-center border border-gray-100 shadow-sm hover:shadow-md transition">
                <p class="font-bold uppercase text-xs text-gray-500 mb-1">${dayName}</p>
                <img src="https://openweathermap.org/img/wn/${icon}.png" alt="icon" class="w-12 h-12 mx-auto">
                <p class="text-lg font-bold text-gray-800">${temp}°</p>
            </div>
        `;
        domNodes.forecastGrid.innerHTML += cardHTML;
    });
}

function generateRecommendations(weatherMain) {
    let activities = [];
    // Lógica simple de recomendaciones basada en el tipo de clima
    switch (weatherMain.toLowerCase()) {
        case 'clear':
            activities = ["Visita un parque al aire libre", "Sal a correr", "Haz un picnic"];
            break;
        case 'clouds':
            activities = ["Visita un museo", "Toma un café en una terraza", "Fotografía urbana"];
            break;
        case 'rain':
        case 'drizzle':
            activities = ["Visita una galería de arte", "Ve al cine", "Lee un libro en una cafetería acogedora"];
            break;
        case 'snow':
            activities = ["Haz un muñeco de nieve", "Toma chocolate caliente", "Esquí o snowboard"];
            break;
        case 'thunderstorm':
            activities = ["Quédate en casa", "Juegos de mesa", "Cocina algo rico"];
            break;
        default:
            activities = ["Explora el centro de la ciudad", "Prueba comida local"];
    }

    domNodes.activityList.innerHTML = activities.map(act => `<li class="mb-1">✅ ${act}</li>`).join('');
}