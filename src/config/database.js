const { Pool } = require('pg');
const logger = require('../utils/helpers').logger;

// PostgreSQL Connection Pool Configuration
class DatabaseService {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.init();
  }

  init() {
    try {
      const dbConfig = process.env.DATABASE_URL ? {
        connectionString: process.env.DATABASE_URL
      } : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        database: process.env.DB_NAME || 'srms',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres'
      };

      this.pool = new Pool({
        ...dbConfig,
        max: parseInt(process.env.DB_MAX_CONNECTIONS, 10) || 20, // Maximum number of clients in the pool
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT, 10) || 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 2000, // Return an error after 2 seconds if connection could not be established
        acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT, 10) || 60000, // Wait up to 60 seconds to acquire a client
        allowExitOnIdle: true, // Allow the pool to close when all clients are idle
      });

      this.setupEventHandlers();
      this.isConnected = true;
      logger.info('Database connection pool initialized');
    } catch (error) {
      logger.error('Failed to initialize database connection pool:', error);
      throw error;
    }
  }

  setupEventHandlers() {
    this.pool.on('connect', (client) => {
      logger.info('New client connected to the database');
    });

    this.pool.on('error', (err, client) => {
      logger.error('Unexpected error on idle client:', err);
      // In production, you might want to implement reconnection logic here
      this.isConnected = false;
    });

    this.pool.on('remove', (client) => {
      logger.info('Client removed from pool');
    });
  }

  // Execute a query with optional tenant context
  async query(text, params = [], tenantId = null) {
    if (!this.isConnected) {
      throw new Error('Database connection is not available');
    }

    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      // Log slow queries
      if (duration > 1000) {
        logger.warn(`Slow query (${duration}ms): ${text}`, { params, tenantId });
      } else {
        logger.info(`Query executed in ${duration}ms: ${text.substring(0, 50)}...`, { tenantId });
      }

      return result;
    } catch (error) {
      logger.error('Database query error:', {
        query: text,
        params,
        tenantId,
        error: error.message
      });
      throw error;
    }
  }

  // Execute a query within a transaction
  async transaction(callback) {
    if (!this.isConnected) {
      throw new Error('Database connection is not available');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Health check for the database connection
  async healthCheck() {
    try {
      const result = await this.query('SELECT NOW() as current_time');
      return {
        status: 'healthy',
        timestamp: result.rows[0].current_time,
        pool: {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount
        }
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  // Get tenant-specific schema name (for schema-based multi-tenancy)
  getTenantSchema(tenantId) {
    // For schema-based multi-tenancy, you could return schema names like `tenant_${tenantId}`
    // For now, we'll use a shared schema but ensure tenant isolation in queries
    return 'public';
  }

  // Close the connection pool
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      logger.info('Database connection pool closed');
    }
  }

  // Get the raw pool (for advanced usage)
  getPool() {
    return this.pool;
  }
}

// Create and export a singleton instance
const dbService = new DatabaseService();

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, closing database connection...');
  await dbService.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, closing database connection...');
  await dbService.close();
  process.exit(0);
});

module.exports = dbService;