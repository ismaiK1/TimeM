import client from './client';

export async function login(email, password) {
  const { data } = await client.post('/auth/login', { email, password });
  return data;
}

export async function me() {
  const { data } = await client.get('/auth/me');
  return data;
}

export async function changePassword(currentPassword, newPassword) {
  const { data } = await client.patch('/auth/me/password', {
    currentPassword,
    newPassword,
  });
  return data;
}
