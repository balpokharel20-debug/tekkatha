import { app } from '../backend/src/app.js';
import { restoreOriginalPath } from './request-path.js';

export default function handler(req, res) {
  restoreOriginalPath(req);
  return app(req, res);
}
