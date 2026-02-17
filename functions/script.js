import { API_KEY } from "./env.js";

const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const mainContent = document.getElementById('main-content'); 
const currentWeatherSection = document.getElementById('current-weather');
const forecastGrid = document.getElementById('forecast-grid'); 
const activityList = document.getElementById('activity-list'); 

searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = cityInput.value.trim();
    if (city) {
        fetchWeatherData(city);
    }
});

async function fetchWeatherData(city) {
    try {
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`);
        const geoData = await geoRes.json();

        if (!geoData.length) {
            alert("Ciudad no encontrada");
            return;
        }

        const { lat, lon, name, country } = geoData[0];

        const [weatherRes, forecastRes] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`)
        ]);

        const weatherData = await weatherRes.json();
        const forecastData = await forecastRes.json();

        CurrentWeather(weatherData, name, country);
        Forecast(forecastData);
        Recommendations(weatherData.weather[0].main);

    } catch (error) {
        console.error("Error:", error);
    }
}


function CurrentWeather(data, name, country) {
    mainContent.classList.remove('hidden');

    const temp = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const icon = data.weather[0].icon;

    currentWeatherSection.innerHTML = `
        <div class="relative bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-600 text-center transform scale-105 z-10">
            <!-- Glow Effect -->
            <div class="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/20 blur-[80px] rounded-full pointer-events-none"></div>

            <h2 class="text-3xl font-light text-white mb-1 tracking-tight">
                ${name} <span class="text-cyan-400 font-bold ml-1">${country}</span>
            </h2>
            <p class="text-slate-400 capitalize text-sm mb-6">
                ${new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            
            <div class="flex flex-col items-center justify-center my-4">
                <img src="https://openweathermap.org/img/wn/${icon}@4x.png" alt="${description}" class="w-40 h-40 drop-shadow-xl animate-pulse-slow">
                <div class="text-8xl font-thin text-white tracking-tighter -mt-4">
                    ${temp}°
                </div>
            </div>

            <p class="text-xl text-cyan-200 capitalize font-medium mb-8">${description}</p>

            <div class="grid grid-cols-3 gap-2 border-t border-slate-700 pt-6">
                <div class="flex flex-col">
                    <span class="text-slate-500 text-[10px] uppercase tracking-wider">Humedad</span>
                    <span class="text-white font-semibold">${data.main.humidity}%</span>
                </div>
                <div class="flex flex-col border-l border-slate-700">
                    <span class="text-slate-500 text-[10px] uppercase tracking-wider">Viento</span>
                    <span class="text-white font-semibold">${Math.round(data.wind.speed)} km/h</span>
                </div>
                <div class="flex flex-col border-l border-slate-700">
                    <span class="text-slate-500 text-[10px] uppercase tracking-wider">Sensación</span>
                    <span class="text-white font-semibold">${Math.round(data.main.feels_like)}°</span>
                </div>
            </div>
        </div>
    `;
}

function Forecast(data) {
    const dailyForecasts = [];
    const usedDates = new Set();
    
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateStr = date.toLocaleDateString();
        
        if (!usedDates.has(dateStr) && dailyForecasts.length < 5) {
            if (item.dt_txt.includes("12:00:00") || !usedDates.has(dateStr)) {
                usedDates.add(dateStr);
                dailyForecasts.push(item);
            }
        }
    });

    forecastGrid.innerHTML = ''; 

    dailyForecasts.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' }); // Cambié a 'short' para que quepa mejor
        const temp = Math.round(day.main.temp);
        const icon = day.weather[0].icon;

        const row = document.createElement('div');
        row.className = "flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition border border-slate-700/50";
        row.innerHTML = `
            <span class="text-slate-300 capitalize font-medium w-1/3 text-left text-sm">${dayName}</span>
            <div class="flex items-center justify-center w-1/3">
                 <img src="https://openweathermap.org/img/wn/${icon}.png" class="w-8 h-8" alt="icono">
            </div>
            <span class="text-white font-bold w-1/3 text-right">${temp}°</span>
        `;
        forecastGrid.appendChild(row);
    });
}

function Recommendations(mainWeather) {
    let activities = [];

    
    switch(mainWeather.toLowerCase()){
        case 'clear':
            activities = ["☀️ Ve a correr al parque", "📷 Haz fotos a la ciudad", "🕶️ Paseo con gafas de sol"];
            break;
        case 'clouds':
            activities = ["☁️ Ideal para cafeterías", "🏛️ Visita un museo", "🚲 Paseo con brisa"];
            break;
        case 'rain':
        case 'drizzle':
        case 'thunderstorm':
            activities = ["☔ Cine o Netflix", "🍜 Cocina algo rico", "📚 Lee un libro"];
            break;
        case 'snow':
            activities = ["⛄ Haz un muñeco", "🧤 Abrígate mucho", "☕ Bebida caliente"];
            break;
        default:
            activities = ["🏙️ Explora el centro", "🍽️ Cena local"];
    }

    activityList.innerHTML = activities.map(act => 
        `<li class="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition">
            <span class="text-cyan-400 text-lg">•</span> 
            <span class="text-slate-200 text-sm">${act}</span>
        </li>`
    ).join('');
}


const actividades={
    "clear": ["☀️ Ve a correr al parque", "📷 Haz fotos a la ciudad", "🕶️ Paseo con gafas de sol"],
    "clouds": ["☁️ Ideal para cafeterías", "🏛️ Visita un museo", "🚲 Paseo con brisa"],
    "rain": ["☔ Cine o Netflix", "🍜 Cocina algo rico", "📚 Lee un libro"],
    "drizzle": ["☔ Cine o Netflix", "🍜 Cocina algo rico", "📚 Lee un libro"],
    "thunderstorm": ["☔ Cine o Netflix", "🍜 Cocina algo rico", "📚 Lee un libro"],
    "snow": ["⛄ Haz un muñeco", "🧤 Abrígate mucho", "☕ Bebida caliente"],
    "default": ["🏙️ Explora el centro", "🍽️ Cena local"]


}