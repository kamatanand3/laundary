import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccess(payload){
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
}
export function signRefresh(payload){
  return jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn });
}
export function verifyAccess(token){
  return jwt.verify(token, env.jwt.secret);
}
export function verifyRefresh(token){
  return jwt.verify(token, env.jwt.refreshSecret);
}