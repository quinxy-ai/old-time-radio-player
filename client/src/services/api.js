const BASE = '/api';

async function request(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

export async function fetchStations() {
  const data = await request('/stations');
  return data.stations;
}

export async function fetchStationEpisodes(stationId) {
  const data = await request(`/stations/${stationId}/episodes`);
  return data.episodes;
}
