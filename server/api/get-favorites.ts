import { ServerRoute } from 'hapi';
import * as Joi from 'joi';
import * as https from 'https';
import { createHash, randomBytes } from 'crypto';

export const getFavorites: ServerRoute = {
  method: 'GET',
  path: '/api/favorites',
  options: {
    validate: {
      headers: {
        sessionId: Joi.string().hex().optional()
      },
      options: {
        allowUnknown: true
      }
    }
  },
  handler: async (request, h) => {
    const sessionId = await request.server.methods['getSessionId'](request.headers.sessionid);
    return { sessionId, favorites: await request.server.methods['getFavorites'](sessionId) };
  }
}
