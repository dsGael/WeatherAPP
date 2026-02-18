# 🌤️ Weather App 

Una aplicación de clima moderna y  diseñada para ofrecer una experiencia de usuario superior. No es solo un buscador de clima: es un dashboard inteligente que aprende de tus búsquedas, te sugiere actividades y maneja conexiones inestables con elegancia.


---



👉 **[Ver Proyecto Desplegado](https://weather-app-eight-bice-93.vercel.app/)**

---

## ✨ Características Premium

### 🧠 Experiencia de Usuario (UX)
*   **🔍 Autocompletado Inteligente en Tiempo Real:** Sugerencias de ciudades mientras escribes con "debounce" para optimizar peticiones.
*   **⭐ Favoritos y Historial Persistente:** Guarda tus ciudades preferidas y accede rápidamente a tus últimas búsquedas (almacenado en LocalStorage).
*   **💡 Recomendaciones Personalizadas:** Sugiere actividades (correr, leer, café, etc.) basadas específicamente en el clima actual.
*   **🔄 Feedback Visual Completo:** Pantallas de carga (spinners), estados de vacío y animaciones suaves.

### Funcionalidad

*   **🛡️ Manejo de errores:** 
    *   **Reintentos automáticos:** Si la red falla momentáneamente, la app reintenta conectar sola.
    *   **Circuit Breaker:** Si el servicio cae, bloquea temporalmente las peticiones para evitar saturación y avisa al usuario.

### 📊 Datos Meteorológicos 
*   **Clima Actual:** Temperatura, sensación térmica, humedad, viento y condiciones visuales.
*   **Pronóstico a 5 Días:** Previsión detallada día a día.
*   **Recomendaciones:** Basado en el clima.
*   **Historial y Favoritos:** Guarda tu información.
*   **Diseño Responsive:** Grid adaptativo.

---

## 🛠️ Stack Tecnológico

*   **Frontend:** HTML5, TailwindCSS, JavaScript .
*   **API Externa:** OpenWeatherMap (Geocoding, Weather, Forecast).
*   **Almacenamiento:** LocalStorage (Persistencia de datos en cliente).
