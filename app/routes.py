from flask import render_template, jsonify, request
from app import app
from app.weather_api import WeatherAPI

weather_api = WeatherAPI()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/weather', methods=['POST'])
def get_weather():
    data = request.json
    points = data.get('points', [])
    time_interval = data.get('time_interval', 'current')
    forecast_day = data.get('forecast_day', 0)

    if points:
        try:
            results = weather_api.get_route_weather(points)
            return jsonify({
                'results': results,
                'time_interval': time_interval,
                'forecast_day': forecast_day
            })
        except Exception as e:
            return jsonify({
                'error': str(e),
                'details': 'Проверьте правильность введенных адресов'
            }), 500

    return jsonify({
        'error': 'Необходимо указать точки маршрута',
        'details': 'Добавьте хотя бы одну точку маршрута'
    }), 400