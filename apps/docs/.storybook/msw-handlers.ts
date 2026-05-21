import { http, HttpResponse } from 'msw';

export const mswHandlers = {
  health: [
    http.get('https://api.example.com/health', () => {
      return HttpResponse.json({ ok: true });
    }),
  ],
};
