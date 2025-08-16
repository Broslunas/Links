#!/usr/bin/env node

/**
 * Migration script to add apiTokenLastUsedAt field to existing users
 * This script ensures all existing users have the new field structure
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// User schema definition (simplified for migration)
const UserSchema = new mongoose.Schema({
    email: String,
    name: String,
    apiToken: String,
    apiTokenCreatedAt: Date,
    apiTokenLastUsedAt: Date,
}, {
    timestamps: true,
    strict: false // Allow additional fields during migration
});

const User = mongoose.model('User', UserSchema);

async function migrateApiTokenFields() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log('🔄 Starting migration for API token fields...');

        // Find all users that have an apiToken but no apiTokenLastUsedAt
        const usersToUpdate = await User.find({
            apiToken: { $exists: true, $ne: null },
            apiTokenLastUsedAt: { $exists: false }
        });

        console.log(`📊 Found ${usersToUpdate.length} users to migrate`);

        if (usersToUpdate.length === 0) {
            console.log('✅ No users need migration');
            return;
        }

        // Update users in batches
        const batchSize = 100;
        let updated = 0;

        for (let i = 0; i < usersToUpdate.length; i += batchSize) {
            const batch = usersToUpdate.slice(i, i + batchSize);
            const userIds = batch.map(user => user._id);

            await User.updateMany(
                { _id: { $in: userIds } },
                { 
                    $set: { 
                        apiTokenLastUsedAt: null // Initialize as null, will be set when token is used
                    }
                }
            );

            updated += batch.length;
            console.log(`✅ Updated ${updated}/${usersToUpdate.length} users`);
        }

        console.log('🎉 Migration completed successfully!');
        console.log(`📊 Total users updated: ${updated}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run migration if called directly
if (require.main === module) {
    migrateApiTokenFields()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateApiTokenFields };