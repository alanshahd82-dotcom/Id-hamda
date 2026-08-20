const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const port = Number(process.env.PORT || 3000);
const root = __dirname;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  });
  response.end(JSON.stringify(payload));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    const transport = url.startsWith('https:') ? require('https') : require('http');
    const request = transport.get(url, {
      headers: {
        'User-Agent': 'MySindbad/2.0 (+https://github.com/alanshahd82-dotcom/my-sindbad)'
      }
    }, (result) => {
      let body = '';
      result.setEncoding('utf8');
      result.on('data', (chunk) => { body += chunk; });
      result.on('end', () => {
        if ([301, 302, 303, 307, 308].includes(result.statusCode) && result.headers.location) {
          getJson(new URL(result.headers.location, url).toString()).then(resolve).catch(reject);
          return;
        }
        if (result.statusCode < 200 || result.statusCode >= 300) {
          reject(new Error(`upstream_${result.statusCode}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error('invalid_upstream_json'));
        }
      });
    });
    request.setTimeout(30000, () => request.destroy(new Error('upstream_timeout')));
    request.on('error', reject);
  });
}

async function handleApi(request, response, url) {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    response.end();
    return true;
  }
  if (!url.pathname.startsWith('/api/')) return false;

  try {
    if (url.pathname === '/api/search' && request.method === 'GET') {
      const query = (url.searchParams.get('q') || '').trim();
      if (query.length < 2) {
        sendJson(response, 400, { error: 'اكتب اسم مدينة أو دولة للبحث.' });
        return true;
      }
      const data = await getJson(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&accept-language=ar,en&q=${encodeURIComponent(query)}`
      );
      sendJson(response, 200, data.map((item) => ({
        id: item.place_id,
        name: item.name || item.display_name.split(',')[0],
        displayName: item.display_name,
        lat: Number(item.lat),
        lon: Number(item.lon),
        country: item.address?.country || '',
        type: item.type
      })));
      return true;
    }

    if (url.pathname === '/api/places' && request.method === 'GET') {
      const latParam = url.searchParams.get('lat');
      const lonParam = url.searchParams.get('lon');
      const lat = Number(latParam);
      const lon = Number(lonParam);
      const kind = url.searchParams.get('kind') || 'tourism';
      if (!latParam || !lonParam || !Number.isFinite(lat) || !Number.isFinite(lon)) {
        sendJson(response, 400, { error: 'إحداثيات الوجهة غير صالحة.' });
        return true;
      }
      const filter = kind === 'food'
        ? '["amenity"~"restaurant|cafe|fast_food"]'
        : kind === 'hotels'
          ? '["tourism"~"hotel|hostel|guest_house"]'
          : '["tourism"~"attraction|museum|gallery|viewpoint|theme_park"]';
      const query = `[out:json][timeout:20];(nwr(around:6000,${lat},${lon})${filter};);out center tags 25;`;
      const data = await getJson(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      const places = (data.elements || []).map((item) => ({
        id: `${item.type}/${item.id}`,
        name: item.tags?.name || item.tags?.['name:en'] || '',
        category: item.tags?.amenity || item.tags?.tourism || kind,
        address: item.tags?.['addr:street'] || item.tags?.['addr:city'] || '',
        lat: item.lat ?? item.center?.lat,
        lon: item.lon ?? item.center?.lon,
        website: item.tags?.website || item.tags?.['contact:website'] || '',
        phone: item.tags?.phone || ''
      })).filter((item) => item.name && Number.isFinite(item.lat) && Number.isFinite(item.lon));
      sendJson(response, 200, places);
      return true;
    }

    if (url.pathname === '/api/weather' && request.method === 'GET') {
      const latParam = url.searchParams.get('lat');
      const lonParam = url.searchParams.get('lon');
      const lat = Number(latParam);
      const lon = Number(lonParam);
      if (!latParam || !lonParam || !Number.isFinite(lat) || !Number.isFinite(lon)) {
        sendJson(response, 400, { error: 'إحداثيات الطقس غير صالحة.' });
        return true;
      }
      const data = await getJson(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
      );
      sendJson(response, 200, data);
      return true;
    }

    if (url.pathname === '/api/rates' && request.method === 'GET') {
      const base = (url.searchParams.get('base') || 'MAD').toUpperCase();
      const data = await getJson(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`);
      if (data.result !== 'success' || !data.rates) throw new Error('rates_unavailable');
      sendJson(response, 200, data);
      return true;
    }

    sendJson(response, 404, { error: 'المسار غير موجود.' });
    return true;
  } catch (error) {
    sendJson(response, 502, { error: 'تعذر الوصول إلى الخدمة الخارجية الآن.' });
    return true;
  }
}

const server = http.createServer((request, response) => {
  let requested;
  try {
    requested = decodeURIComponent((request.url || '/').split('?')[0]);
  } catch {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Bad request');
    return;
  }

  const parsedUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  handleApi(request, response, parsedUrl).then((handled) => {
    if (handled) return;

    const relative = requested === '/' ? 'index.html' : requested.replace(/^\/+/, '');
    const file = path.resolve(root, relative);
    if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
      response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Bad request');
      return;
    }

    fs.stat(file, (error, stats) => {
      if (error || !stats.isFile()) {
        const acceptsHtml = String(request.headers.accept || '').includes('text/html');
        if (!acceptsHtml) {
          response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          response.end('Not found');
          return;
        }
      }
      const target = !error && stats.isFile() ? file : path.join(root, 'index.html');
      fs.readFile(target, (readError, content) => {
        if (readError) {
          response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          response.end('Unable to load the application');
          return;
        }
        response.writeHead(200, {
          'Content-Type': types[path.extname(target).toLowerCase()] || 'application/octet-stream',
          'Cache-Control': 'no-cache'
        });
        response.end(content);
      });
    });
  }).catch(() => sendJson(response, 500, { error: 'حدث خطأ غير متوقع في الخادم.' }));
});

server.listen(port, '0.0.0.0', () => {
  console.log(`My Sindbad is running on port ${port}`);
});