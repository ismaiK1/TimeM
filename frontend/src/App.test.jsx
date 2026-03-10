import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('exporte un composant fonction', () => {
    expect(typeof App).toBe('function');
  });
});
