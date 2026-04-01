const db = require('../config/database');
const gradingScaleService = require('../services/gradingScaleService');

async function seedGradingScales() {
    try {
        console.log('Starting grading scale seeding...');

        // Get all universities
        const universities = await db.query('SELECT id, tenant_id FROM universities');

        if (universities.rows.length === 0) {
            console.log('No universities found. Skipping grading scale seeding.');
            return;
        }

        console.log(`Found ${universities.rows.length} universities`);

        let successCount = 0;
        let skipCount = 0;

        for (const university of universities.rows) {
            try {
                // Check if university already has an active grading scale
                const existingScale = await db.query(
                    'SELECT id FROM grading_scales WHERE university_id = $1 AND is_active = true',
                    [university.id]
                );

                if (existingScale.rows.length > 0) {
                    console.log(`University ${university.id} already has an active grading scale. Skipping.`);
                    skipCount++;
                    continue;
                }

                // Initialize default scale
                await gradingScaleService.initializeDefaultScale(university.id, university.tenant_id);
                console.log(`Initialized default grading scale for university ${university.id}`);
                successCount++;

            } catch (error) {
                console.error(`Failed to initialize grading scale for university ${university.id}:`, error.message);
            }
        }

        console.log(`Grading scale seeding completed. Success: ${successCount}, Skipped: ${skipCount}`);

    } catch (error) {
        console.error('Error during grading scale seeding:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    seedGradingScales()
        .then(() => {
            console.log('Seeding completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Seeding failed:', error);
            process.exit(1);
        });
}

module.exports = { seedGradingScales };