#!/usr/bin/env node

/**
 * Database Migration CLI
 * Command line interface for managing database migrations
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const MigrationManager = require('./src/utils/migrations');

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    const migrationManager = new MigrationManager();
    
    try {
        switch (command) {
            case 'up':
            case 'migrate':
                console.log('🚀 Running pending migrations...');
                await migrationManager.runPendingMigrations();
                break;
                
            case 'status':
                console.log('📊 Migration Status:');
                const status = await migrationManager.getStatus();
                console.log(`   Executed: ${status.executed}`);
                console.log(`   Pending: ${status.pending}`);
                
                if (status.lastExecuted) {
                    console.log(`   Last executed: ${status.lastExecuted.name} (${status.lastExecuted.version})`);
                    console.log(`   Executed at: ${status.lastExecuted.executed_at}`);
                }
                
                if (status.pending > 0) {
                    console.log('\\n📋 Pending migrations:');
                    status.pendingMigrations.forEach(migration => {
                        console.log(`   - ${migration.version}`);
                    });
                }
                break;
                
            case 'create':
                const migrationName = args.slice(1).join(' ');
                if (!migrationName) {
                    console.error('❌ Please provide a migration name');
                    console.log('   Usage: npm run migrate:create "migration name"');
                    process.exit(1);
                }
                
                console.log(`✨ Creating new migration: ${migrationName}`);
                const filepath = await migrationManager.createMigration(migrationName);
                console.log(`📝 Migration file created: ${filepath}`);
                console.log('   Edit the file and run "npm run migrate" to apply it.');
                break;
                
            case 'help':
            default:
                console.log('📚 Database Migration CLI');
                console.log('');
                console.log('Available commands:');
                console.log('  migrate, up     Run pending migrations');
                console.log('  status          Show migration status');
                console.log('  create <name>   Create a new migration file');
                console.log('  help            Show this help message');
                console.log('');
                console.log('Examples:');
                console.log('  npm run migrate');
                console.log('  npm run migrate:status');
                console.log('  npm run migrate:create "add user preferences table"');
                break;
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Migration command failed:', error.message);
        
        if (process.env.NODE_ENV === 'development') {
            console.error('Stack trace:', error.stack);
        }
        
        process.exit(1);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run the CLI
main();