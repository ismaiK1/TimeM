import client from './client';

export async function list(params = {}) {
  const { data } = await client.get('/clocks', { params });
  return data;
}

export async function clockIn() {
  const { data } = await client.post('/clocks', { action: 'clock_in' });
  return data;
}

export async function clockOut() {
  const { data } = await client.post('/clocks', { action: 'clock_out' });
  return data;
}
