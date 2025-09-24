const fs = require('fs').promises;
const path = require('path');
const db = require('../config/database');

/**
 * Database Migration System
 * Manages database schema changes and version tracking
 */

class MigrationManager {
    constructor() {
        this.migrationsDir = path.join(__dirname, '../migrations');
    }

    /**
     * Initialize migration tracking table
     */
    async initializeMigrations() {
        try {
            // Create migrations table if it doesn't exist
            await db.query(`
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    id SERIAL PRIMARY KEY,
                    version VARCHAR(255) UNIQUE NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            console.log('✅ Migrations table initialized');
        } catch (error) {
            console.error('❌ Failed to initialize migrations table:', error);
            throw error;
        }
    }

    /**
     * Get list of pending migrations
     */
    async getPendingMigrations() {
        try {
            // Ensure migrations directory exists
            await this.ensureMigrationsDir();
            
            // Get all migration files
            const files = await fs.readdir(this.migrationsDir);
            const migrationFiles = files
                .filter(file => file.endsWith('.sql'))
                .sort();

            // Get executed migrations
            const result = await db.query('SELECT version FROM schema_migrations ORDER BY version');
            const executedVersions = new Set(result.rows.map(row => row.version));

            // Find pending migrations
            const pendingMigrations = migrationFiles
                .map(file => {
                    const version = path.basename(file, '.sql');
                    return {
                        version,
                        filename: file,
                        path: path.join(this.migrationsDir, file)
                    };
                })
                .filter(migration => !executedVersions.has(migration.version));

            return pendingMigrations;
        } catch (error) {
            console.error('❌ Failed to get pending migrations:', error);
            throw error;
        }
    }

    /**
     * Run a single migration
     */
    async runMigration(migration) {
        try {
            console.log(`🔄 Running migration: ${migration.version}`);
            
            // Read migration file
            const sql = await fs.readFile(migration.path, 'utf8');
            
            // Execute migration in a transaction
            await db.query('BEGIN');
            
            try {
                // Execute the migration SQL
                await db.query(sql);
                
                // Record migration as executed
                const migrationName = migration.version.replace(/^\d+_/, '').replace(/_/g, ' ');
                await db.query(
                    'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
                    [migration.version, migrationName]
                );
                
                await db.query('COMMIT');
                console.log(`✅ Migration completed: ${migration.version}`);
                
            } catch (error) {
                await db.query('ROLLBACK');
                throw error;
            }
            
        } catch (error) {
            console.error(`❌ Migration failed: ${migration.version}`, error);
            throw error;
        }
    }

    /**
     * Run all pending migrations
     */
    async runPendingMigrations() {
        try {
            await this.initializeMigrations();
            
            const pendingMigrations = await this.getPendingMigrations();
            
            if (pendingMigrations.length === 0) {
                console.log('✅ No pending migrations');
                return;
            }
            
            console.log(`🔄 Running ${pendingMigrations.length} pending migrations...`);
            
            for (const migration of pendingMigrations) {
                await this.runMigration(migration);
            }
            
            console.log('✅ All migrations completed successfully');
            
        } catch (error) {
            console.error('❌ Migration process failed:', error);
            throw error;
        }
    }

    /**
     * Get migration status
     */
    async getStatus() {
        try {
            await this.initializeMigrations();
            
            const pendingMigrations = await this.getPendingMigrations();
            const executedResult = await db.query(
                'SELECT version, name, executed_at FROM schema_migrations ORDER BY executed_at DESC'
            );
            
            return {
                pending: pendingMigrations.length,
                executed: executedResult.rows.length,
                pendingMigrations: pendingMigrations,
                lastExecuted: executedResult.rows[0] || null
            };
            
        } catch (error) {
            console.error('❌ Failed to get migration status:', error);
            throw error;
        }
    }

    /**
     * Create a new migration file
     */
    async createMigration(name) {
        try {
            await this.ensureMigrationsDir();
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '').replace('T', '_').slice(0, 15);
            const filename = `${timestamp}_${name.toLowerCase().replace(/\s+/g, '_')}.sql`;
            const filepath = path.join(this.migrationsDir, filename);
            
            const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

-- Add your SQL statements here
-- Example:
-- CREATE TABLE example (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(255) NOT NULL
-- );

-- Remember to add indexes if needed
-- CREATE INDEX idx_example_name ON example(name);
`;
            
            await fs.writeFile(filepath, template);
            console.log(`✅ Created migration: ${filename}`);
            
            return filepath;
            
        } catch (error) {
            console.error('❌ Failed to create migration:', error);
            throw error;
        }
    }

    /**
     * Ensure migrations directory exists
     */
    async ensureMigrationsDir() {
        try {
            await fs.access(this.migrationsDir);
        } catch (error) {
            // Directory doesn't exist, create it
            await fs.mkdir(this.migrationsDir, { recursive: true });
            console.log(`✅ Created migrations directory: ${this.migrationsDir}`);
        }
    }
}

module.exports = MigrationManager;