import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import multer from 'multer';
import uploadFileToCloud from './utils/uploadcare-util.js';
import sanitize from 'express-mongo-sanitize';
import authRouter from './routes/authRoute.js';
import collegeRouter from './routes/collegeRoute.js';
import errorHandler from './middlewares/errorHandler.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class App {
  app;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  configureMiddleware() {
    this.app.use(
      cors({
        origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['Content-Range', 'X-Content-Range'],
        credentials: true,
        maxAge: 600,
      })
    );

    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
          },
        },
        crossOriginEmbedderPolicy: true,
        crossOriginOpenerPolicy: true,
        crossOriginResourcePolicy: { policy: 'same-site' },
        dnsPrefetchControl: true,
        frameguard: { action: 'deny' },
        hidePoweredBy: true,
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
        ieNoOpen: true,
        noSniff: true,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        xssFilter: true,
      })
    );

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    this.app.use(
      compression({
        filter: (req, res) => {
          if (req.headers['x-no-compression']) {
            return false;
          }
          return compression.filter(req, res);
        },
        level: 6,
      })
    );

    this.app.use((req, res, next) => {
      req.correlationId =
        req.headers['x-correlation-id'] ||
        `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      next();
    });

    this.app.use(sanitize());
    this.app.use(cookieParser());
  }

  configureRoutes() {
    const storage = multer.memoryStorage();
    const upload = multer({ storage });

    this.app.get('/health', (req, res) => {
      res.status(200).json({ status: 'healthy' });
    });

    const apiRouter = express.Router();
    this.app.use('/api/v1', apiRouter);
    this.app.use('/api/v1/auth', authRouter);
    this.app.use('/api/v1/college', collegeRouter);

    // spec file & api documentation swagger page
    const swaggerDoc = YAML.load(path.join(__dirname, 'docs/spec.yaml'));
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: '404',
          message: 'Resource not found',
        },
      });
    });
  }

  configureErrorHandling() {
    this.app.use(errorHandler);

    process.on('unhandledRejection', (err) => {
      logger.error(err.name, err.message);
      logger.error('Unhandled promise rejection occured. Shutting down.');
      process.exit(1);
    });
  }

  getApp() {
    return this.app;
  }
}

export default App;
