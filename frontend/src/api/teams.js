import client from './client';

export async function list() {
  const { data } = await client.get('/teams');
  return data;
}

export async function get(id) {
  const { data } = await client.get(`/teams/${id}`);
  return data;
}

export async function create(payload) {
  const { data } = await client.post('/teams', payload);
  return data;
}

export async function update(id, payload) {
  const { data } = await client.patch(`/teams/${id}`, payload);
  return data;
}

export async function remove(id) {
  await client.delete(`/teams/${id}`);
}
