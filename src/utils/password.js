import bcrypt from 'bcrypt';
export const hash = (str) => bcrypt.hash(str, 10);
export const compare = (str, hashed) => bcrypt.compare(str, hashed);