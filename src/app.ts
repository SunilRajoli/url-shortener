import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import urlRoutes from './routes/urlRoutes';
import { globalLimiter } from './middleware/rateLimiter';
import { requestId } from './middleware/requestId';
// import cors from 'cors'; // uncomment when frontend is added

const app = express();

// trust proxy for correct IP (important for rate limiting if behind proxy)
app.set('trust proxy', 1);

// security headers
app.use(helmet());

// add request ID middleware
app.use(requestId);

// request logger (include request id)
morgan.token('id', (req: any) => req.id);
app.use(morgan(':id :method :url :status :response-time ms - :res[content-length]'));

// Apply JSON + URL parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// ===== CORS (uncomment when you have a frontend) =====
// app.use(cors({
//   origin: 'http://localhost:3000',
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   credentials: true,
// }));

// Apply global rate limiter (affects all routes)
app.use(globalLimiter);

// health check
app.get('/_health', (req, res) => res.json({ ok: true, requestId: req.id }));

// main routes
app.use('/', urlRoutes);

// generic error handler
app.use(
  (err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(`[${req.id}] Unhandled error:`, err);
    res.status(500).json({ success: false, message: 'internal server error', requestId: req.id });
  }
);

export default app;
