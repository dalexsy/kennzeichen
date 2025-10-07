const fs = require('fs');
const https = require('https');

// Load kennzeichen data
const data = JSON.parse(fs.readFileSync('./public/kennzeichen.json', 'utf8'));

// Extract unique cities
const uniqueCities = new Map();
data.license_plates
  .filter(p => p.derived_from && p.derived_from !== 'willkürlich gewählt')
  .forEach(p => {
    const key = `${p.derived_from}|${p.federal_state}`;
    if (!uniqueCities.has(key)) {
      uniqueCities.set(key, { name: p.derived_from, state: p.federal_state });
    }
  });

console.log(`Found ${uniqueCities.size} unique cities to geocode`);

// Load german-cities.json cache
let cache = new Map();
try {
  const cachedCities = JSON.parse(fs.readFileSync('./public/german-cities.json', 'utf8'));
  cachedCities.forEach(city => {
    const key = `${city.name}|${city.state}`;
    cache.set(key, { lat: city.lat, lng: city.lng });
  });
  console.log(`Loaded ${cache.size} cities from cache`);
} catch (e) {
  console.log('No cache file found');
}

// Add coordinates to license plates
let addedFromCache = 0;
let missing = 0;

data.license_plates.forEach(plate => {
  if (plate.derived_from && plate.derived_from !== 'willkürlich gewählt') {
    const key = `${plate.derived_from}|${plate.federal_state}`;
    if (cache.has(key)) {
      const coords = cache.get(key);
      plate.lat = coords.lat;
      plate.lng = coords.lng;
      addedFromCache++;
    } else {
      missing++;
    }
  }
});

console.log(`Added coordinates to ${addedFromCache} plates from cache`);
console.log(`${missing} plates still missing coordinates`);

// Save updated data
fs.writeFileSync('./public/kennzeichen-with-coords.json', JSON.stringify(data, null, 2));
console.log('Saved to kennzeichen-with-coords.json');

// List missing cities
const missingCities = [];
uniqueCities.forEach((city, key) => {
  if (!cache.has(key)) {
    missingCities.push(city);
  }
});

console.log(`\n${missingCities.length} cities need geocoding:`);
console.log(missingCities.slice(0, 20).map(c => c.name).join(', '));
