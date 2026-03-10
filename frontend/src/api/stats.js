import client from './client';

export async function lateRate(params = {}) {
  const { data } = await client.get('/stats/late-rate', { params });
  return data;
}

export async function avgHours(params = {}) {
  const { data } = await client.get('/stats/avg-hours', { params });
  return data;
}
