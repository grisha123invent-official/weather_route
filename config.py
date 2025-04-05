import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key'
    YANDEX_WEATHER_API_KEY = ''
    YANDEX_GEOCODER_API_KEY = ''
    YANDEX_WEATHER_BASE_URL = 'https://api.weather.yandex.ru/v2'
    YANDEX_GEOCODER_BASE_URL = 'https://geocode-maps.yandex.ru/1.x'
