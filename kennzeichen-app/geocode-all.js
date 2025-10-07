const fs = require('fs');
const https = require('https');

// Load kennzeichen data
const data = JSON.parse(fs.readFileSync('./public/kennzeichen.json', 'utf8'));

// Load existing cache
let cache = new Map();
try {
  const cachedCities = JSON.parse(fs.readFileSync('./public/german-cities.json', 'utf8'));
  cachedCities.forEach(city => {
    const key = `${city.name}|${city.state}`;
    cache.set(key, city);
  });
  console.log(`Loaded ${cache.size} cities from cache`);
} catch (e) {
  console.log('No cache file found');
}

// Extract unique cities
const uniqueCities = [];
const cityKeys = new Set();
data.license_plates
  .filter(p => p.derived_from && p.derived_from !== 'willkürlich gewählt')
  .forEach(p => {
    const key = `${p.derived_from}|${p.federal_state}`;
    if (!cityKeys.has(key) && !cache.has(key)) {
      cityKeys.add(key);
      uniqueCities.push({ name: p.derived_from, state: p.federal_state });
    }
  });

console.log(`Need to geocode ${uniqueCities.length} cities`);

// Geocode function using Nominatim
async function geocodeCity(cityName, stateName) {
  return new Promise((resolve) => {
    const query = encodeURIComponent(`${cityName}, ${stateName}, Germany`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=de`;

    https.get(url, {
      headers: { 'User-Agent': 'KennzeichenApp/1.0' }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const results = JSON.parse(body);
          if (results && results.length > 0) {
            resolve({
              name: cityName,
              lat: parseFloat(results[0].lat),
              lng: parseFloat(results[0].lon),
              state: stateName
            });
          } else {
            console.log(`Not found: ${cityName}`);
            resolve(null);
          }
        } catch (e) {
          console.error(`Error parsing ${cityName}:`, e.message);
          resolve(null);
        }
      });
    }).on('error', (e) => {
      console.error(`Error fetching ${cityName}:`, e.message);
      resolve(null);
    });
  });
}

// Geocode all cities with delay
async function geocodeAll() {
  const results = [];
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  for (let i = 0; i < uniqueCities.length; i++) {
    const city = uniqueCities[i];
    console.log(`Geocoding ${i + 1}/${uniqueCities.length}: ${city.name}, ${city.state}`);

    const result = await geocodeCity(city.name, city.state);
    if (result) {
      results.push(result);
    }

    // Nominatim requires 1 second between requests
    await delay(1000);
  }

  // Merge with cache
  const cachedArray = Array.from(cache.values());
  const allCities = [...cachedArray, ...results];

  // Save complete geocoding file
  fs.writeFileSync('./public/german-cities-complete.json', JSON.stringify(allCities, null, 2));
  console.log(`\nSaved ${allCities.length} total cities to german-cities-complete.json`);
  console.log(`New cities geocoded: ${results.length}`);
}

geocodeAll().catch(console.error);
