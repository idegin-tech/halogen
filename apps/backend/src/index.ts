import app from './server';
import Database from './config/db.config';
import Logger from './config/logger.config';
import { validateEnv } from './config/env.config';
import fs from 'fs';
import path from 'path';
import { FileSystemUtil } from './lib/fs.util';
import { DomainLib } from './lib/domain.lib';
import { SSLManager } from './lib/ssl.lib';
import { DomainQueue } from './lib/domain-queue.lib';
import { DomainCronJobs } from './lib/domain-cron.lib';
import { DomainsService } from './modules/domains/domains.service';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const env = validateEnv();
const port = env.PORT;

async function startServer() {
  try {
    await Database.getInstance().connect();

    // Initialize domain services    await DomainLib.createDefaultTemplates();
    await SSLManager.initializeClient();
    DomainQueue.initialize(DomainsService);
    DomainCronJobs.initialize();

    const server = app.listen(port, () => {
      Logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${port}`);
      Logger.info(`Access API at http://localhost:${port}/api/v1`);
    });

    const gracefulShutdown = async (signal: string) => {
      Logger.info(`${signal} signal received: closing HTTP server`);

      server.close(async () => {
        Logger.info('HTTP server closed');
        await Database.getInstance().disconnect();
        process.exit(0);
      });

      setTimeout(() => {
        Logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    Logger.error(`Error starting server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

const server = startServer();

export default server;

