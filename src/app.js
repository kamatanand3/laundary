import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler.js';
import router from './routes/index.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// global rate limit
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }));

app.get('/health', (_, res) => res.json({ ok: true }));
app.use('/api', router);
app.use(errorHandler);

export default app;