import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key'
    YANDEX_WEATHER_API_KEY = 'bd7249d1-a738-414a-a224-32d090756c0f'
    YANDEX_GEOCODER_API_KEY = 'acbd6e8d-6f1f-44b5-a784-15d8cf760e15'
    YANDEX_WEATHER_BASE_URL = 'https://api.weather.yandex.ru/v2'
    YANDEX_GEOCODER_BASE_URL = 'https://geocode-maps.yandex.ru/1.x'