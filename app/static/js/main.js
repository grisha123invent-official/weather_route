// Глобальные переменные
let myMap;
let weatherData = null;

// Инициализация карты
ymaps.ready(init);

function init() {
   myMap = new ymaps.Map('map', {
       center: [55.76, 37.64], // Москва
       zoom: 9,
       controls: ['zoomControl', 'searchControl']
   });
}

// Функция для автодополнения адресов
function initializeAutocomplete(input) {
   let suggestView = new ymaps.SuggestView(input);

   suggestView.events.add('select', function (e) {
       let selectedValue = e.get('item').value;
   });
}

// Добавление точки маршрута
document.getElementById('add-point').addEventListener('click', function() {
   const routePoints = document.getElementById('route-points');
   const pointDiv = document.createElement('div');
   pointDiv.className = 'route-point flex items-center space-x-2 mb-2';

   const input = document.createElement('input');
   input.type = 'text';
   input.className = 'location-input flex-1 p-2 border rounded';
   input.placeholder = 'Введите адрес';
   input.id = 'point-' + Date.now();

   const removeButton = document.createElement('button');
   removeButton.className = 'text-red-500 px-2';
   removeButton.innerHTML = '×';
   removeButton.onclick = function() {
       pointDiv.remove();
   };

   pointDiv.appendChild(input);
   pointDiv.appendChild(removeButton);
   routePoints.appendChild(pointDiv);

   initializeAutocomplete(input);
});

// Инициализация автодополнения для начальных полей
document.addEventListener('DOMContentLoaded', function() {
   const inputs = document.querySelectorAll('.location-input');
   inputs.forEach(input => {
       if (!input.id) {
           input.id = 'point-' + Date.now();
       }
       initializeAutocomplete(input);
   });

   // Инициализация обработчиков для временных интервалов
   const timeIntervalSelect = document.getElementById('time-interval');
   const forecastDaySelect = document.getElementById('forecast-day');

   if (timeIntervalSelect) {
       timeIntervalSelect.addEventListener('change', function() {
           forecastDaySelect.style.display =
               (this.value === 'hourly' || this.value === 'daily') ? 'block' : 'none';
           if (weatherData) updateCharts(weatherData);
       });
   }

   if (forecastDaySelect) {
       forecastDaySelect.addEventListener('change', function() {
           if (weatherData) updateCharts(weatherData);
       });
   }
});

// Получение прогноза погоды
document.getElementById('get-weather').addEventListener('click', async function() {
   const inputs = document.querySelectorAll('.location-input');
   const points = Array.from(inputs).map(input => input.value).filter(Boolean);
   const timeInterval = document.getElementById('time-interval').value;
   const forecastDay = parseInt(document.getElementById('forecast-day').value);

   if (points.length === 0) {
       alert('Добавьте хотя бы одну точку маршрута');
       return;
   }

   try {
       const response = await fetch('/api/weather', {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
           },
           body: JSON.stringify({
               points: points,
               time_interval: timeInterval,
               forecast_day: forecastDay
           })
       });

       if (!response.ok) {
           throw new Error(`HTTP error! status: ${response.status}`);
       }

       const data = await response.json();
       if (data.error) {
           alert(data.error);
           return;
       }

       weatherData = data.results;
       updateMap(weatherData);
       updateCharts(weatherData);

   } catch (error) {
       alert('Произошла ошибка при получении прогноза погоды');
   }
});

// Обновление карты
function updateMap(data) {
   myMap.geoObjects.removeAll();

   if (!data || data.length === 0) return;

   const coordinates = data.map(point => [
       point.coordinates.lat,
       point.coordinates.lon
   ]);

   // Добавляем метки
   coordinates.forEach((coords, index) => {
       const weather = data[index].weather;
       const placemark = new ymaps.Placemark(coords, {
           balloonContent: `
               <strong>${data[index].location}</strong><br>
               Температура: ${weather.fact.temp}°C<br>
               Ощущается как: ${weather.fact.feels_like}°C<br>
               Влажность: ${weather.fact.humidity}%<br>
               Давление: ${weather.fact.pressure_mm} мм рт.ст.<br>
               Скорость ветра: ${weather.fact.wind_speed} м/с<br>
               Вероятность осадков: ${weather.fact.prec_prob}%
           `
       });
       myMap.geoObjects.add(placemark);
   });

   if (coordinates.length > 1) {
       const multiRoute = new ymaps.multiRouter.MultiRoute({
           referencePoints: coordinates,
           params: { routingMode: 'auto' }
       });
       myMap.geoObjects.add(multiRoute);
   }

   myMap.setBounds(myMap.geoObjects.getBounds(), { checkZoomRange: true });
}

// Обновление графиков
function updateCharts(data) {
    const chartType = document.getElementById('chart-type').value;
    const chartStyle = document.getElementById('chart-style').value;
    const timeInterval = document.getElementById('time-interval').value;
    const forecastDay = parseInt(document.getElementById('forecast-day').value);

    if (!data || data.length === 0) return;

    // Создаем отдельную серию для каждого города
    const series = data.map(point => {
        let chartData = {
            x: [],
            y: [],
            type: chartStyle === 'bar' ? 'bar' : 'scatter',
            mode: 'lines+markers',
            fill: chartStyle === 'area' ? 'tozeroy' : undefined,
            name: point.location // Имя города для легенды
        };

        if (timeInterval === 'current') {
            chartData.x = [point.location];
            chartData.y = [getWeatherValue(point.weather.fact, chartType)];
        } else if (timeInterval === 'hourly' && point.weather.forecasts[forecastDay]) {
            const forecast = point.weather.forecasts[forecastDay];
            forecast.hours.forEach((hour, index) => {
                if (index % 3 === 0) { // Каждые 3 часа
                    chartData.x.push(`${hour.hour}:00`);
                    chartData.y.push(getWeatherValue(hour, chartType));
                }
            });
        } else if (timeInterval === 'daily') {
            point.weather.forecasts.forEach(forecast => {
                chartData.x.push(forecast.date);
                chartData.y.push(getWeatherValue(forecast.parts.day, chartType));
            });
        }

        return chartData;
    });

    const layout = {
        title: `${getParameterName(chartType)} - ${getTimeIntervalName(timeInterval)}`,
        yaxis: {
            title: getParameterUnit(chartType),
            gridcolor: '#E5E5E5'
        },
        xaxis: {
            tickangle: -45,
            gridcolor: '#E5E5E5'
        },
        margin: {
            t: 40,
            b: 100,
            l: 60,
            r: 40
        },
        height: 500,
        showlegend: true,
        legend: {
            orientation: 'h',
            y: -0.2
        },
        plot_bgcolor: '#FFFFFF',
        paper_bgcolor: '#FFFFFF',
        hovermode: 'x unified'
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToAdd: ['drawline', 'drawopenpath', 'eraseshape'],
        modeBarButtonsToRemove: ['lasso2d']
    };

    Plotly.newPlot('weather-chart', series, layout, config);
}
function getWeatherValue(data, paramType) {
   switch(paramType) {
       case 'temperature':
           return data.temp;
       case 'humidity':
           return data.humidity;
       case 'precipitation':
           return data.prec_prob || 0;
       case 'wind':
           return data.wind_speed;
       case 'pressure':
           return data.pressure_mm;
       default:
           return data.temp;
   }
}

function getParameterName(paramType) {
   const names = {
       'temperature': 'Температура',
       'humidity': 'Влажность',
       'precipitation': 'Вероятность осадков',
       'wind': 'Скорость ветра',
       'pressure': 'Давление'
   };
   return names[paramType] || paramType;
}

function getParameterUnit(paramType) {
   const units = {
       'temperature': '°C',
       'humidity': '%',
       'precipitation': '%',
       'wind': 'м/с',
       'pressure': 'мм рт.ст.'
   };
   return units[paramType] || '';
}

function getTimeIntervalName(interval) {
   const names = {
       'current': 'Текущая погода',
       'hourly': 'Почасовой прогноз',
       'daily': 'Прогноз по дням'
   };
   return names[interval] || interval;
}

['chart-type', 'chart-style', 'time-interval', 'forecast-day'].forEach(id => {
   const element = document.getElementById(id);
   if (element) {
       element.addEventListener('change', function() {
           if (weatherData) updateCharts(weatherData);
       });
   }
});