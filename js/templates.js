// js/templates.js
const templates = {
    social: {
        totalUsers: 50000000,
        dau: 10000000,
        dauType: 'absolute',
        storagePerUser: 5,
        filesPerDay: 10,
        avgFileSize: 200,
        requestCount: 50,
        requestPeriod: 'day',
        readWriteRatio: '80:20',
        growthRate: 15,
        growthPeriod: 'yearly',
        description: 'Social Media Platform - High read ratio with moderate storage needs'
    },
    video: {
        totalUsers: 10000000,
        dau: 2000000,
        dauType: 'absolute',
        storagePerUser: 50,
        filesPerDay: 1,
        avgFileSize: 300000,
        requestCount: 20,
        requestPeriod: 'day',
        readWriteRatio: '100:1',
        growthRate: 20,
        growthPeriod: 'yearly',
        description: 'Video Streaming Service - Very high storage with read-heavy traffic'
    },
    photo: {
        totalUsers: 20000000,
        dau: 5000000,
        dauType: 'absolute',
        storagePerUser: 10,
        filesPerDay: 5,
        avgFileSize: 2000,
        requestCount: 30,
        requestPeriod: 'day',
        readWriteRatio: '80:20',
        growthRate: 25,
        growthPeriod: 'yearly',
        description: 'Photo Sharing App - Balanced storage with moderate read/write ratio'
    },
    ecommerce: {
        totalUsers: 5000000,
        dau: 1000000,
        dauType: 'absolute',
        storagePerUser: 1,
        filesPerDay: 2,
        avgFileSize: 500,
        requestCount: 100,
        requestPeriod: 'day',
        readWriteRatio: '100:1',
        growthRate: 30,
        growthPeriod: 'yearly',
        description: 'E-commerce Platform - Low storage with very high read ratio'
    },
    messaging: {
        totalUsers: 30000000,
        dau: 15000000,
        dauType: 'absolute',
        storagePerUser: 2,
        filesPerDay: 20,
        avgFileSize: 100,
        requestCount: 200,
        requestPeriod: 'day',
        readWriteRatio: '50:50',
        growthRate: 40,
        growthPeriod: 'yearly',
        description: 'Messaging Platform - High message volume with balanced read/write'
    }
};

function loadTemplate() {
    const template = document.getElementById('template').value;
    if (templates[template]) {
        const t = templates[template];
        // Reset all fields first
        document.getElementById('requestCount').disabled = false;
        document.getElementById('filesPerDay').disabled = false;
        document.getElementById('avgFileSize').disabled = false;

        // Update fields and trigger dependency check
        for (let key in t) {
            const element = document.getElementById(key);
            if (element && key !== 'description') {
                element.value = t[key];
                element.dispatchEvent(new Event('input'));
            }
        }

        updateDauPercentage();
        calculateAll();
    }
}
