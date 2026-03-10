import client from './client';

export async function list() {
  const { data } = await client.get('/users');
  return data;
}

export async function get(id) {
  const { data } = await client.get(`/users/${id}`);
  return data;
}

export async function create(payload) {
  const { data } = await client.post('/users', payload);
  return data;
}

export async function update(id, payload) {
  const { data } = await client.patch(`/users/${id}`, payload);
  return data;
}

export async function remove(id) {
  await client.delete(`/users/${id}`);
}
