/**
 * Test minimal du client API — vérifie que le client exporté est une instance axios.
 */
import { describe, it, expect } from 'vitest';
import client from './client';

describe('api client', () => {
  it('exporte un client avec les méthodes HTTP', () => {
    expect(client).toBeDefined();
    expect(typeof client.get).toBe('function');
    expect(typeof client.post).toBe('function');
    expect(typeof client.patch).toBe('function');
    expect(typeof client.delete).toBe('function');
  });
});
