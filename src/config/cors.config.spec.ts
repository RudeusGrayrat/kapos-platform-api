import { buildCorsOptions, parseCorsOrigins } from './cors.config';

describe('buildCorsOptions', () => {
  it('parses explicit origins from the environment value', () => {
    expect(
      parseCorsOrigins('http://localhost:3001, http://localhost:3002'),
    ).toEqual(['http://localhost:3001', 'http://localhost:3002']);
  });

  it('enables credentials and accepts configured origins only', (done) => {
    const corsOptions = buildCorsOptions({
      getOrThrow: jest.fn(() => 'http://localhost:3001,http://localhost:3002'),
    });

    expect(corsOptions.credentials).toBe(true);

    if (typeof corsOptions.origin !== 'function') {
      throw new Error('Expected a dynamic CORS origin function.');
    }

    corsOptions.origin('http://localhost:3001', (error, allowed) => {
      expect(error).toBeNull();
      expect(allowed).toBe(true);
      done();
    });
  });

  it('rejects unknown browser origins', (done) => {
    const corsOptions = buildCorsOptions({
      getOrThrow: jest.fn(() => 'http://localhost:3001'),
    });

    if (typeof corsOptions.origin !== 'function') {
      throw new Error('Expected a dynamic CORS origin function.');
    }

    corsOptions.origin('http://malicious.local', (error, allowed) => {
      expect(error).toBeInstanceOf(Error);
      expect(allowed).toBe(false);
      done();
    });
  });
});
