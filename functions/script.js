import { API_KEY } from "./env.js";

const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const mainContent = document.getElementById('main-content'); 
const currentWeatherSection = document.getElementById('current-weather');
const forecastGrid = document.getElementById('forecast-grid'); 
const activityList = document.getElementById('activity-list'); 
const autocompleteList = document.getElementById('autocomplete-list');
const divHistorial = document.getElementById('historial');
const divFavoritos = document.getElementById('favoritos');
const likeBtn = document.getElementById('like-btn');
const loadingSpinner = document.getElementById('loading-spinner');

let currentCityData = null;

const historial= JSON.parse(localStorage.getItem('historial')) || [];
const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

localStorage.setItem('historial', JSON.stringify(historial));

showSearchHistory();
showFavorites();

searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = cityInput.value.trim();
    if (city) {
        fetchWeatherData(city);
        autocompleteList.classList.add('hidden'); // Ocultar al buscar
    }
});

let debounceTimer;

cityInput.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    
    clearTimeout(debounceTimer);
    
    if (value.length < 3) {
        autocompleteList.classList.add('hidden');
        return;
    }

    debounceTimer = setTimeout(() => {
        fetchCitySuggestions(value);
    }, 300); // 300ms 
});

document.addEventListener('click', (e) => {
    if (!searchForm.contains(e.target)) {
        autocompleteList.classList.add('hidden');
    }
});

async function fetchCitySuggestions(query) {
    try {
        const res = await fetchWithRetry(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`);
        const cities = await res.json();
        
        showSuggestions(cities);
    } catch (error) {
        console.error("Error autocompletado:", error);
    }
}

function showSuggestions(cities) {
    autocompleteList.innerHTML = '';
    
    if (cities.length === 0) {
        autocompleteList.classList.add('hidden');
        return;
    }

    cities.forEach(city => {
        const li = document.createElement('li');
        li.className = "px-4 py-3 hover:bg-slate-700 cursor-pointer text-slate-200 border-b border-slate-700/50 last:border-0 flex justify-between items-center";
        
        const locationText = `${city.name}${city.state ? `, ${city.state}` : ''}`;
        
        li.innerHTML = `
            <span>${locationText}</span>
            <span class="text-xs text-slate-500 font-bold bg-slate-900 px-2 py-1 rounded">${city.country}</span>
        `;
        
        li.addEventListener('click', () => {
            cityInput.value = city.name;
            autocompleteList.classList.add('hidden');
            fetchWeatherData(city); 
        });
        
        autocompleteList.appendChild(li);
    });

    autocompleteList.classList.remove('hidden');
}

async function fetchWeatherData(cityOrData) {
    loadingSpinner.classList.remove('hidden');
    mainContent.classList.add('hidden'); 
    
    try {
        let lat, lon, name, country;

        if (typeof cityOrData === 'object' && cityOrData !== null) {
            ({ lat, lon, name, country } = cityOrData);
        } else {
            const geoRes = await fetchWithRetry(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityOrData)}&limit=1&appid=${API_KEY}`);
            const geoData = await geoRes.json();

            if (!geoData.length) {
                alert("Ciudad no encontrada");
                loadingSpinner.classList.add('hidden');
                return;
            }

            ({ lat, lon, name, country } = geoData[0]);
        }


        currentCityData = { city: name, country, lat, lon };

         if (!historial.some(item => item.city === name && item.country === country)) {
            historial.unshift({ city: name, country, lat, lon }); 
            if (historial.length > 5) historial.pop();

            localStorage.setItem('historial', JSON.stringify(historial));
         }
         console.log(JSON.parse(localStorage.getItem('historial')));

        const [weatherRes, forecastRes] = await Promise.all([
            fetchWithRetry(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`),
            fetchWithRetry(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`)
        ]);

        const weatherData = await weatherRes.json();
        const forecastData = await forecastRes.json();



        CurrentWeather(weatherData, name, country);
        Forecast(forecastData);
        Recommendations(weatherData.weather[0].main);
        showSearchHistory();

        mainContent.classList.remove('hidden');

    } catch (error) {
        console.error("Error:", error);
        alert(error.message || "Hubo un error de conexión.");
        mainContent.classList.remove('hidden'); 
    } finally {
        loadingSpinner.classList.add('hidden');
    }
}

likeBtn.addEventListener('click', () => {
    if (!currentCityData) {
        alert("Primero busca una ciudad");
        return;
    }

    if (!favorites.some(fav => fav.city === currentCityData.city && fav.country === currentCityData.country)) {
        favorites.push(currentCityData);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        showFavorites();
        
        likeBtn.textContent = "⭐ Guardado";
        setTimeout(() => likeBtn.textContent = "⭐ Like", 2000);
    } else {
        alert("Esta ciudad ya está en favoritos");
    }
});

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
        const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' }); 
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
            activities = ["Haz ejercicio", "Visita un parque", "Sal a comer con amigos", "Tomate unas bien muertas","Bebidas heladass", "Usa shorts"];
            break;
        case 'clouds':
            activities = ["Cofee trip", "Visitas culturales", "Sal a correr", "Pasea a tu perro", "Visita un museo", "Ve de compras"];
            break;
        case 'rain':
        case 'drizzle':
        case 'thunderstorm':
            activities = ["Ver peliculas ", "Cocinar en casa", "Café y un libro", "Juegos de mesa"];
            break;
        case 'snow':
            activities = ["Juega en la nieve", "Mantente abrigado", "Tomate un té o un café caliente"];
            break;
        default:
            activities = ["Chillear", "Banquetear"];
    }

    activityList.innerHTML = activities.map(act => 
        `<li class="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition">
            <span class="text-cyan-400 text-m">•</span> 
            <span class="text-slate-200 text-base">${act}</span>
        </li>`
    ).join('');
}



function showSearchHistory() {
    if (historial.length === 0) {
        divHistorial.innerHTML = '<li class="p-3 text-slate-500">No hay búsquedas recientes</li>';
    } else {
        divHistorial.innerHTML = historial.map(item => 
            `
            <button onclick="searchHistorial('${item.city}')" class="p-1 w-full text-left">
                <li class="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition cursor-pointer" data-lat="${item.lat}" data-lon="${item.lon}">
                    <span class="text-cyan-400 text-lg">•</span> 
                    <span class="text-slate-200 text-sm">${item.city}, ${item.country}</span>
                </li>
            </button>`
        ).join('');

    }
}

function showFavorites() {
    if (favorites.length === 0) {
        divFavoritos.innerHTML = '<p class="p-3 text-slate-500 text-center text-sm">No tienes favoritos aún</p>';
        return;
    }

    divFavoritos.innerHTML = favorites.map((item, index) => `
        <div class="flex items-center gap-2 mb-2">
            <button onclick="searchHistorial('${item.city}')" class="flex-grow text-left">
                <div class="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition cursor-pointer border border-transparent hover:border-cyan-500/30">
                    <span class="text-yellow-400 text-lg">★</span> 
                    <span class="text-slate-200 text-sm font-medium">${item.city}, ${item.country}</span>
                </div>
            </button>
            <button onclick="removeFavorite(${index})" class="p-3 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-xl transition" title="Borrar">
                ✕
            </button>
        </div>
    `).join('');
}

window.removeFavorite = (index) => {
    favorites.splice(index, 1);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    showFavorites();
};

window.searchHistorial = (cityInputParam) => {
    cityInput.value = cityInputParam; 
    fetchWeatherData(cityInputParam);
};


const circuitBreaker = {
    failures: 0,           
    threshold: 3,          
    openUntil: 0,         
    timeout: 30000,         

    isOpen() {
        if (Date.now() < this.openUntil) return true;
        
        if (this.openUntil !== 0) {
            this.reset();
        }
        return false;
    },

    recordFailure() {
        this.failures++;
        if (this.failures >= this.threshold) {
            this.openUntil = Date.now() + this.timeout;
            console.warn("⚠️ Circuit Breaker ABIERTO. Pausando peticiones por 30s.");
        }
    },

    reset() {
        this.failures = 0;
        this.openUntil = 0;
        console.log("✅ Circuit Breaker CERRADO. Reanudando peticiones.");
    }
};

async function fetchWithRetry(url, retries = 3, backoff = 1000) {
    if (circuitBreaker.isOpen()) {
        const remaining = Math.ceil((circuitBreaker.openUntil - Date.now()) / 1000);
        throw new Error(`Servicio temporalmente no disponible. Intenta en ${remaining}s.`);
    }

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                if (response.status >= 500) throw new Error(`Error servidor: ${response.status}`);
                return response; 
            }

            circuitBreaker.reset(); 
            return response;

        } catch (error) {
            console.warn(`Intento ${i + 1} fallido: ${error.message}`);
            
            if (i === retries - 1) {
                circuitBreaker.recordFailure();
                throw error;
            }

            await new Promise(res => setTimeout(res, backoff * (i + 1))); 
        }
    }
}