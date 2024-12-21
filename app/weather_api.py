import requests
from config import Config


class WeatherAPI:
    def __init__(self):
        self.weather_key = Config.YANDEX_WEATHER_API_KEY
        self.geocoder_key = Config.YANDEX_GEOCODER_API_KEY
        self.weather_url = Config.YANDEX_WEATHER_BASE_URL
        self.geocoder_url = Config.YANDEX_GEOCODER_BASE_URL

    def get_coordinates(self, address):
        params = {
            'apikey': self.geocoder_key,
            'geocode': address,
            'format': 'json'
        }
        response = requests.get(self.geocoder_url, params=params)
        if response.status_code == 200:
            data = response.json()
            features = data['response']['GeoObjectCollection']['featureMember']
            if features:
                coords = features[0]['GeoObject']['Point']['pos'].split()
                return {
                    'lat': float(coords[1]),
                    'lon': float(coords[0]),
                    'name': features[0]['GeoObject']['name']
                }
        return None

    def get_weather(self, lat, lon):
        headers = {'X-Yandex-API-Key': self.weather_key}
        params = {
            'lat': lat,
            'lon': lon,
            'lang': 'ru_RU',
            'extra': True,
            'hours': True,
            'limit': 7
        }

        response = requests.get(
            f'{self.weather_url}/forecast',
            headers=headers,
            params=params
        )

        if response.status_code == 200:
            data = response.json()
            fact = data.get('fact', {})
            forecasts = data.get('forecasts', [])

            processed_forecasts = []
            for forecast in forecasts:
                processed_forecast = {
                    'date': forecast.get('date'),
                    'parts': {
                        'day': {
                            'temp': forecast['parts']['day'].get('temp_avg'),
                            'humidity': forecast['parts']['day'].get('humidity'),
                            'pressure_mm': forecast['parts']['day'].get('pressure_mm'),
                            'wind_speed': forecast['parts']['day'].get('wind_speed'),
                            'prec_prob': forecast['parts']['day'].get('prec_prob', 0),
                            'condition': forecast['parts']['day'].get('condition')
                        }
                    },
                    'hours': []
                }

                for hour in forecast.get('hours', []):
                    processed_forecast['hours'].append({
                        'hour': hour.get('hour'),
                        'temp': hour.get('temp'),
                        'humidity': hour.get('humidity'),
                        'pressure_mm': hour.get('pressure_mm'),
                        'wind_speed': hour.get('wind_speed'),
                        'prec_prob': hour.get('prec_prob', 0),
                        'condition': hour.get('condition')
                    })

                processed_forecasts.append(processed_forecast)

            return {
                'fact': {
                    'temp': fact.get('temp'),
                    'feels_like': fact.get('feels_like'),
                    'humidity': fact.get('humidity'),
                    'pressure_mm': fact.get('pressure_mm'),
                    'wind_speed': fact.get('wind_speed'),
                    'wind_dir': fact.get('wind_dir'),
                    'prec_prob': fact.get('prec_probability', 0),
                    'condition': fact.get('condition')
                },
                'forecasts': processed_forecasts
            }
        return None

    def get_route_weather(self, points):
        results = []
        for point in points:
            coords = self.get_coordinates(point)
            if coords:
                weather = self.get_weather(coords['lat'], coords['lon'])
                if weather:
                    results.append({
                        'location': coords['name'],
                        'coordinates': {'lat': coords['lat'], 'lon': coords['lon']},
                        'weather': weather
                    })
        return results