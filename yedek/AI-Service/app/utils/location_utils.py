import math
import re
import os
import json
from typing import Optional, Tuple
import httpx

# Minimal city coordinates (lat, lon) for Turkey and common references
CITY_COORDS = {
    # Marmara & Ege & Akdeniz & İç Anadolu & Karadeniz & Doğu/Güneydoğu - 81 il
    'istanbul': (41.0082, 28.9784),
    'kocaeli': (40.8533, 29.8815),
    'izmit': (40.7667, 29.9167),  # Kocaeli merkezi
    'sakarya': (40.7731, 30.3940),
    'yalova': (40.6500, 29.2667),
    'bursa': (40.1950, 29.0600),
    'balikesir': (39.6484, 27.8826),
    'canakkale': (40.1553, 26.4142),
    'edirne': (41.6772, 26.5556),
    'tekirdag': (40.9781, 27.5110),
    'kirklareli': (41.7355, 27.2250),
    'eskisehir': (39.7667, 30.5256),
    'kutahya': (39.4242, 29.9833),
    'bilecik': (40.1426, 29.9793),
    'izmir': (38.4237, 27.1428),
    'manisa': (38.6191, 27.4289),
    'aydin': (37.8450, 27.8396),
    'denizli': (37.7830, 29.0963),
    'mugla': (37.2153, 28.3636),
    'antalya': (36.8969, 30.7133),
    'burdur': (37.7203, 30.2900),
    'isparta': (37.7648, 30.5566),
    'adana': (37.0000, 35.3213),
    'mersin': (36.8121, 34.6415),
    'hatay': (36.2021, 36.1600),  # Antakya
    'osmaniye': (37.0742, 36.2476),
    'kahramanmaras': (37.5753, 36.9371),
    'antalya': (36.8969, 30.7133),
    'ankara': (39.9208, 32.8541),
    'konya': (37.8714, 32.4846),
    'karaman': (37.1810, 33.2150),
    'aksaray': (38.3687, 34.0370),
    'nevsehir': (38.6247, 34.7200),
    'nigde': (37.9698, 34.6795),
    'kirikkale': (39.8468, 33.5153),
    'kirsehir': (39.1456, 34.1630),
    'yozgat': (39.8181, 34.8147),
    'sivas': (39.7477, 37.0179),
    'cankiri': (40.6013, 33.6134),
    'corum': (40.5506, 34.9556),
    'amasya': (40.6539, 35.8331),
    'tokat': (40.3167, 36.5500),
    'samsun': (41.2867, 36.3300),
    'ordu': (40.9862, 37.8797),
    'giresun': (40.9128, 38.3895),
    'trabzon': (41.0027, 39.7168),
    'rize': (41.0201, 40.5234),
    'artvin': (41.1830, 41.8183),
    'giresun': (40.9128, 38.3895),
    'gumushane': (40.4603, 39.4817),
    'bayburt': (40.2552, 40.2249),
    'kastamonu': (41.3887, 33.7827),
    'sinop': (42.0268, 35.1629),
    'zonguldak': (41.4564, 31.7987),
    'bartin': (41.6358, 32.3376),
    'karabuk': (41.2049, 32.6277),
    'bolu': (40.7350, 31.6061),
    'duzce': (40.8438, 31.1565),
    'afyonkarahisar': (38.7638, 30.5403),
    'usak': (38.6823, 29.4082),
    'yozgat': (39.8181, 34.8147),
    'erzincan': (39.7505, 39.4923),
    'erzurum': (39.9043, 41.2679),
    'agrı': (39.7191, 43.0503),  # intentional typo fallback
    'agri': (39.7191, 43.0503),
    'kars': (40.6017, 43.0949),
    'igdir': (39.9237, 44.0450),
    'ardahan': (41.1105, 42.7022),
    'bingol': (38.8853, 40.4983),
    'mus': (38.7432, 41.5065),
    'bitlis': (38.4011, 42.1078),
    'van': (38.4942, 43.3800),
    'hakkari': (37.5744, 43.7408),
    'sirnak': (37.5164, 42.4614),
    'siirt': (37.9333, 41.9500),
    'batman': (37.8812, 41.1351),
    'mardin': (37.3129, 40.7350),
    'diyarbakir': (37.9144, 40.2306),
    'sanliurfa': (37.1674, 38.7955),
    'gaziantep': (37.0667, 37.3833),
    'kilis': (36.7184, 37.1212),
    'malatya': (38.3554, 38.3331),
    'elazig': (38.6746, 39.2220),
    'kayseri': (38.7312, 35.4787),
    'karaman': (37.1810, 33.2150),
}

_TR_MAP = str.maketrans({
    'İ': 'i', 'I': 'i', 'Ğ': 'g', 'Ü': 'u', 'Ş': 's', 'Ö': 'o', 'Ç': 'c',
    'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c',
})


def normalize_city(text: str) -> str:
    if not text:
        return ''
    t = text.strip().translate(_TR_MAP).lower()
    # synonyms / aliases mapping
    synonyms = {
        'izmit': 'kocaeli',
        'antakya': 'hatay',
        'urfa': 'sanliurfa',
        'maras': 'kahramanmaras',
        'adapazari': 'sakarya',
    }
    # Keep only letters and spaces, split by separators, take first meaningful token that matches a known city
    tokens = re.split(r"[,/|\-]", t)
    for tok in tokens:
        tok = tok.strip()
        tok = synonyms.get(tok, tok)
        if tok in CITY_COORDS:
            return tok
        # try to pick first word of token
        w = tok.split()
        if w:
            c = w[0]
            c = synonyms.get(c, c)
            if c in CITY_COORDS:
                return c
    # fallback: first word
    return (tokens[0].strip().split()[0]) if tokens and tokens[0].strip() else ''


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def classify_distance_km(distance_km: float) -> str:
    # User's rules:
    # - exact city match => 'exact' (handled separately when same city)
    # - 10–150 km => 'near'
    # - >150 km => 'far'
    if distance_km <= 10:
        return 'near'
    if distance_km <= 150:
        return 'near'
    return 'far'


# Simple file-based cache for geocoding
_CACHE_DIR = os.path.join(os.path.dirname(__file__), 'data')
_CACHE_PATH = os.path.join(_CACHE_DIR, 'geo_cache.json')
_cache = None


def _load_cache():
    global _cache
    if _cache is not None:
        return
    try:
        os.makedirs(_CACHE_DIR, exist_ok=True)
        if os.path.exists(_CACHE_PATH):
            with open(_CACHE_PATH, 'r', encoding='utf-8') as f:
                _cache = json.load(f)
        else:
            _cache = {}
    except Exception:
        _cache = {}


def _save_cache():
    try:
        with open(_CACHE_PATH, 'w', encoding='utf-8') as f:
            json.dump(_cache or {}, f)
    except Exception:
        pass


def geocode_city(name: str) -> Optional[Tuple[float, float]]:
    """Geocode a city name via Nominatim (OSM) with simple caching.
    Returns (lat, lon) or None on failure.
    """
    if not name:
        return None
    _load_cache()
    key = name.strip().lower()
    if key in (_cache or {}):
        coords = _cache[key]
        if isinstance(coords, list) and len(coords) == 2:
            return float(coords[0]), float(coords[1])
    try:
        q = f"{name}, Turkey"
        headers = {"User-Agent": "cv-manager/1.0 (local)"}
        with httpx.Client(timeout=5.0, headers=headers) as client:
            r = client.get('https://nominatim.openstreetmap.org/search', params={
                'q': q,
                'format': 'json',
                'limit': 1,
            })
            if r.status_code == 200:
                arr = r.json()
                if isinstance(arr, list) and arr:
                    lat = float(arr[0]['lat'])
                    lon = float(arr[0]['lon'])
                    _cache[key] = [lat, lon]
                    _save_cache()
                    return lat, lon
    except Exception:
        return None
    return None


def compute_location_match(job_location: str, candidate_location: str):
    jc = normalize_city(job_location or '')
    cc = normalize_city(candidate_location or '')
    if not jc and not cc:
        return None

    # Coordinates for job city
    if jc in CITY_COORDS:
        jlat, jlon = CITY_COORDS[jc]
    else:
        jcoords = geocode_city(jc)
        if not jcoords:
            return {
                'job_city': jc or None,
                'candidate_city': cc or None,
                'distance_km': None,
                'category': 'unknown',
                'location_score': 0,
            }
        jlat, jlon = jcoords

    # Coordinates for candidate city
    if cc in CITY_COORDS:
        clat, clon = CITY_COORDS[cc]
    else:
        ccoords = geocode_city(cc)
        if not ccoords:
            return {
                'job_city': jc or None,
                'candidate_city': cc or None,
                'distance_km': None,
                'category': 'unknown',
                'location_score': 0,
            }
        clat, clon = ccoords

    # If exact same normalized city name, treat as exact
    if jc and cc and jc == cc:
        return {
            'job_city': jc,
            'candidate_city': cc,
            'distance_km': 0.0,
            'category': 'exact',
            'location_score': 10,
        }

    dist = haversine_km(jlat, jlon, clat, clon)
    category = classify_distance_km(dist)
    score = 10 if category == 'exact' else (8 if category == 'near' else 0)
    return {
        'job_city': jc,
        'candidate_city': cc,
        'distance_km': round(dist, 1),
        'category': category,
        'location_score': score,
    }
