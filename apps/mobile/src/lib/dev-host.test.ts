import { urlOnMetroHost } from './dev-host';

describe('urlOnMetroHost', () => {
  it('points a local Supabase URL at the computer running Metro', () => {
    expect(urlOnMetroHost('http://127.0.0.1:54321', '192.168.1.20:8081')).toBe(
      'http://192.168.1.20:54321',
    );
    expect(urlOnMetroHost('http://localhost:54321/', '10.0.0.7:8081')).toBe(
      'http://10.0.0.7:54321/',
    );
  });

  it('keeps the URL when Metro gives no network address', () => {
    expect(urlOnMetroHost('http://127.0.0.1:54321', undefined)).toBe('http://127.0.0.1:54321');
    expect(urlOnMetroHost('http://127.0.0.1:54321', '127.0.0.1:8081')).toBe(
      'http://127.0.0.1:54321',
    );
    // A tunnel only forwards Metro.
    expect(urlOnMetroHost('http://127.0.0.1:54321', 'abc-anonymous-8081.exp.direct')).toBe(
      'http://127.0.0.1:54321',
    );
  });

  it('never touches a hosted Supabase URL', () => {
    expect(urlOnMetroHost('https://xyz.supabase.co', '192.168.1.20:8081')).toBe(
      'https://xyz.supabase.co',
    );
  });
});
