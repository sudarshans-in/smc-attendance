import { Config } from '../constants/config';
import * as mockApi from '../mock/mockApi';
import * as realApi from './realApi';

/**
 * To switch to the real backend:
 *   1. Open src/constants/config.ts
 *   2. Set USE_MOCK: false
 *   3. Set API_BASE_URL to your backend server URL
 *
 * Every function signature is identical between mockApi and realApi,
 * so all screens continue to work without any changes.
 */
export const api = Config.USE_MOCK ? mockApi : realApi;
