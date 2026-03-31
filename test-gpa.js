// Simple test script for GPA calculation with Nigerian grading system
const gpaCalculationService = require('./src/services/gpaCalculationService');

async function testGPACalculation() {
    console.log('Testing GPA Calculation Service...');

    try {
        // Test grade conversion
        console.log('\n1. Testing grade conversion from scores:');

        // Mock student with university ID (we'll use a dummy ID for testing)
        const mockUniversityId = 1;

        const testScores = [75, 65, 55, 45, 35, 85, 95];
        for (const score of testScores) {
            try {
                const gradeInfo = await gpaCalculationService.getGradeFromScore(score, mockUniversityId);
                console.log(`Score ${score}: Grade ${gradeInfo.grade}, Grade Point ${gradeInfo.gradePoint}`);
            } catch (error) {
                console.log(`Score ${score}: Error - ${error.message}`);
            }
        }

        // Test degree classification
        console.log('\n2. Testing degree classification:');
        const testCGPAs = [4.8, 4.2, 3.8, 3.2, 2.8, 2.2, 1.8, 1.2];
        for (const cgpa of testCGPAs) {
            const classification = gpaCalculationService.getDegreeClassification(cgpa);
            console.log(`CGPA ${cgpa}: ${classification.classification} (${classification.description})`);
        }

        console.log('\nGPA Calculation Service test completed successfully!');

    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run test if called directly
if (require.main === module) {
    testGPACalculation();
}

module.exports = { testGPACalculation };