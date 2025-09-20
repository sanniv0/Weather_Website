const API_KEY = 'd1737ed2efe9a7eccf26f715d0f1385a';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

        // Weather icon mapping
        const weatherIcons = {
            '01d': '☀️', '01n': '🌙',
            '02d': '🌤️', '02n': '☁️',
            '03d': '☁️', '03n': '☁️',
            '04d': '☁️', '04n': '☁️',
            '09d': '🌧️', '09n': '🌧️',
            '10d': '🌦️', '10n': '🌧️',
            '11d': '⛈️', '11n': '⛈️',
            '13d': '❄️', '13n': '❄️',
            '50d': '🌫️', '50n': '🌫️'
        };



        function showLoading() {
            document.getElementById('loading').style.display = 'block';
            document.getElementById('weatherContent').classList.remove('show');
            document.getElementById('error').style.display = 'none';
        }

        function hideLoading() {
            document.getElementById('loading').style.display = 'none';
        }

        function showError(message) {
            const errorEl = document.getElementById('error');
            errorEl.textContent = message;
            errorEl.style.display = 'block';
            document.getElementById('weatherContent').classList.remove('show');
            hideLoading();
        }

        function displayWeather(data) {
            hideLoading();
            
            // Current weather
            document.getElementById('location').textContent = data.current.name;
            document.getElementById('weatherIcon').textContent = weatherIcons[data.current.weather[0].icon] || '🌤️';
            document.getElementById('temperature').textContent = `${Math.round(data.current.main.temp)}°C`;
            document.getElementById('description').textContent = data.current.weather[0].description;
            
            // Weather details
            document.getElementById('feelsLike').textContent = `${Math.round(data.current.main.feels_like)}°C`;
            document.getElementById('humidity').textContent = `${data.current.main.humidity}%`;
            document.getElementById('windSpeed').textContent = `${data.current.wind.speed} m/s`;
            document.getElementById('visibility').textContent = `${(data.current.visibility / 1000).toFixed(1)} km`;

            // 5-day forecast
            const forecastContainer = document.getElementById('forecastContainer');
            forecastContainer.innerHTML = '';

            data.forecast.list.forEach(item => {
                const date = new Date(item.dt * 1000);
                const dayName = date.toLocaleDateString('en', { weekday: 'short' });
                
                const forecastItem = document.createElement('div');
                forecastItem.className = 'forecast-item';
                forecastItem.innerHTML = `
                    <div class="forecast-day">${dayName}</div>
                    <div class="forecast-icon">${weatherIcons[item.weather[0].icon] || '🌤️'}</div>
                    <div class="forecast-temp">
                        <div>${Math.round(item.main.temp_max)}°</div>
                        <div style="opacity: 0.7; font-size: 0.9rem;">${Math.round(item.main.temp_min)}°</div>
                    </div>
                `;
                forecastContainer.appendChild(forecastItem);
            });

            document.getElementById('weatherContent').classList.add('show');
            document.getElementById('error').style.display = 'none';
        }

        async function fetchWeatherData(lat, lon, cityName = null) {
            showLoading();

            // Check if API key is available
            if (!API_KEY) {
                showError('API key is not configured. Please set it in the .env file.');
                return;
            }

            try {
                let currentWeatherUrl, forecastUrl;

                if (lat && lon) {
                    currentWeatherUrl = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
                    forecastUrl = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
                } else if (cityName) {
                    currentWeatherUrl = `${BASE_URL}/weather?q=${cityName}&appid=${API_KEY}&units=metric`;
                    forecastUrl = `${BASE_URL}/forecast?q=${cityName}&appid=${API_KEY}&units=metric`;
                }

                const [currentResponse, forecastResponse] = await Promise.all([
                    fetch(currentWeatherUrl),
                    fetch(forecastUrl)
                ]);

                if (!currentResponse.ok || !forecastResponse.ok) {
                    throw new Error('Weather data not found');
                }

                const currentData = await currentResponse.json();
                const forecastData = await forecastResponse.json();

                // Filter forecast to get one entry per day (around noon)
                const dailyForecast = forecastData.list.filter((item, index) => index % 8 === 0).slice(0, 5);

                displayWeather({
                    current: currentData,
                    forecast: { list: dailyForecast }
                });

            } catch (error) {
                console.error('Error fetching weather data:', error);
                showError('Unable to fetch weather data. Please check your connection and try again.');
            }
        }

        function searchWeather() {
            const cityInput = document.getElementById('cityInput');
            const city = cityInput.value.trim();
            
            if (!city) {
                showError('Please enter a city name');
                return;
            }

            fetchWeatherData(null, null, city);
        }

        function getCurrentLocation() {
            if (!navigator.geolocation) {
                showError('Geolocation is not supported by this browser');
                return;
            }

            showLoading();

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    fetchWeatherData(latitude, longitude);
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    showError('Unable to get your location. Please search for a city instead.');
                },
                {
                    timeout: 10000,
                    enableHighAccuracy: true
                }
            );
        }

        // Event listeners
        document.getElementById('cityInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchWeather();
            }
        });