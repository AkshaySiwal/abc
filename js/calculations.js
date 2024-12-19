class SystemCalculator {
    constructor(inputs) {
        this.inputs = inputs;
        this.calculationSteps = [];
        this.stepNumber = 1;
    }

    addCalculationStep(description, formula, result) {
        this.calculationSteps.push(showCalculationStep(
            this.stepNumber++,
            description,
            formula,
            result
        ));
    }

    calculateMetrics() {
        const metrics = {
            storage: this.calculateStorageMetrics(),
            requests: this.calculateRequestMetrics(),
            bandwidth: this.calculateBandwidthMetrics(),
            growth: this.calculateGrowthProjections()
        };

        this.displayCalculationSteps();
        return metrics;
    }

    calculateStorageMetrics() {
        // Calculate actual DAU
        const actualDau = this.inputs.dauType === 'percentage'
            ? (this.inputs.totalUsers * this.inputs.dau / 100)
            : this.inputs.dau;

        // Daily storage calculation
        const dailyStoragePerUser = this.inputs.filesPerDay * this.inputs.avgFileSize * 1024; // KB to bytes
        const totalDailyStorage = actualDau * dailyStoragePerUser;

        this.addCalculationStep(
            "Calculate daily storage generation per user",
            `${this.inputs.filesPerDay} files/day × ${this.inputs.avgFileSize} KB × 1024 = ${formatSize(dailyStoragePerUser)}`,
            `Daily storage per user: ${formatSize(dailyStoragePerUser)}`
        );

        this.addCalculationStep(
            "Calculate total daily storage generation",
            `${formatNumber(actualDau)} active users × ${formatSize(dailyStoragePerUser)} = ${formatSize(totalDailyStorage)}`,
            `Total daily storage: ${formatSize(totalDailyStorage)}`
        );

        // Total allocated storage
        const totalAllocatedStorage = this.inputs.totalUsers * (this.inputs.storagePerUser * 1024 * 1024 * 1024); // GB to bytes

        this.addCalculationStep(
            "Calculate total allocated storage",
            `${formatNumber(this.inputs.totalUsers)} users × ${this.inputs.storagePerUser} GB = ${formatSize(totalAllocatedStorage)}`,
            `Total allocated storage: ${formatSize(totalAllocatedStorage)}`
        );

        return {
            dailyPerUser: dailyStoragePerUser,
            totalDaily: totalDailyStorage,
            totalAllocated: totalAllocatedStorage,
            actualDau: actualDau
        };
    }

    calculateRequestMetrics() {
    let readRps, writeRps;
    const actualDau = this.inputs.dauType === 'percentage'
        ? (this.inputs.totalUsers * this.inputs.dau / 100)
        : this.inputs.dau;

    if (this.inputs.requestCount) {
        // Original request-based calculations
        let totalRequestsPerSecond;
        switch(this.inputs.requestPeriod) {
            case 'second':
                totalRequestsPerSecond = this.inputs.requestCount * actualDau;
                break;
            case 'hour':
                totalRequestsPerSecond = (this.inputs.requestCount * actualDau) / 3600;
                break;
            case 'day':
                totalRequestsPerSecond = (this.inputs.requestCount * actualDau) / (24 * 3600);
                break;
        }

        // For request-based calculations, use 80:20 style ratios
        const [readRatio, writeRatio] = this.inputs.readWriteRatio.split(':').map(x => parseInt(x));
        const totalRatio = readRatio + writeRatio;
        readRps = (totalRequestsPerSecond * readRatio) / totalRatio;
        writeRps = (totalRequestsPerSecond * writeRatio) / totalRatio;

    } else if (this.inputs.filesPerDay && this.inputs.avgFileSize) {
        // File-based calculations
        const dailyWriteRequests = actualDau * this.inputs.filesPerDay;
        writeRps = dailyWriteRequests / (24 * 3600);

        // Parse ratio for file-based calculations (4:1, 1:1, 1:4 style)
        const [readPart, writePart] = this.inputs.readWriteRatio.split(':').map(Number);

        if (readPart >= writePart) {
            // For ratios like 100:1, 4:1, 1:1
            readRps = writeRps * (readPart / writePart);
        } else {
            // For ratios like 1:4
            readRps = writeRps / (writePart / readPart);
        }
    }

    this.addCalculationStep(
        "Calculate requests per second",
        `Daily Active Users: ${formatNumber(actualDau)} / 24hr / 60min / 60sec\nRead/Write Ratio: ${this.inputs.readWriteRatio}`,
        `Read RPS: ${formatNumber(readRps.toFixed(2))}\nWrite RPS: ${formatNumber(writeRps.toFixed(2))}`
    );

    return {
        totalRps: readRps + writeRps,
        readRps,
        writeRps,
        readRatio: parseInt(this.inputs.readWriteRatio.split(':')[0]),
        writeRatio: parseInt(this.inputs.readWriteRatio.split(':')[1])
    };
}

    calculateBandwidthMetrics() {
        const requests = this.calculateRequestMetrics();
        const avgRequestSize = 1024; // 1KB average request size
        const avgResponseSize = 2048; // 2KB average response size

        const inboundBandwidth = requests.writeRps * avgRequestSize;
        const outboundBandwidth = requests.readRps * avgResponseSize;

        this.addCalculationStep(
            "Calculate bandwidth requirements",
            `Inbound: ${formatNumber(requests.writeRps.toFixed(2))} write RPS × ${formatSize(avgRequestSize)}\nOutbound: ${formatNumber(requests.readRps.toFixed(2))} read RPS × ${formatSize(avgResponseSize)}`,
            `Inbound: ${formatSize(inboundBandwidth)}/s\nOutbound: ${formatSize(outboundBandwidth)}/s`
        );

        return {
            inbound: inboundBandwidth,
            outbound: outboundBandwidth,
            total: inboundBandwidth + outboundBandwidth
        };
    }

    calculateGrowthProjections() {
        const storage = this.calculateStorageMetrics();
        const monthlyGrowth = this.inputs.growthPeriod === 'yearly'
            ? Math.pow(1 + this.inputs.growthRate/100, 1/12) - 1
            : this.inputs.growthRate/100;

        const projections = {
            storage: [],
            users: [],
            bandwidth: []
        };

        let currentStorage = storage.totalDaily * 30; // Monthly storage
        let currentUsers = this.inputs.totalUsers;
        let currentBandwidth = this.calculateBandwidthMetrics().total;

        for (let i = 0; i <= 60; i++) { // 5 years projection
            projections.storage.push(currentStorage);
            projections.users.push(currentUsers);
            projections.bandwidth.push(currentBandwidth);

            currentStorage *= (1 + monthlyGrowth);
            currentUsers *= (1 + monthlyGrowth);
            currentBandwidth *= (1 + monthlyGrowth);
        }

        this.addCalculationStep(
            "Calculate growth projections",
            `Monthly growth rate: ${formatPercentage(monthlyGrowth)}`,
            `5-year projection:\nStorage: ${formatSize(projections.storage[60])}\nUsers: ${formatNumber(Math.round(projections.users[60]))}\nBandwidth: ${formatSize(projections.bandwidth[60])}/s`
        );

        return projections;
    }

    displayCalculationSteps() {
        const stepsContainer = document.getElementById('calculationSteps');
        if (stepsContainer) {
            stepsContainer.innerHTML = `
                <h3>Detailed Calculation Steps</h3>
                ${this.calculationSteps.join('')}
            `;
        }
    }
}

function calculateAll() {
    if (!validateInputs()) return;

    const inputs = {
        totalUsers: parseInt(document.getElementById('totalUsers').value),
        dau: parseInt(document.getElementById('dau').value),
        dauType: document.getElementById('dauType').value,
        storagePerUser: parseFloat(document.getElementById('storagePerUser').value),
        filesPerDay: parseInt(document.getElementById('filesPerDay').value),
        avgFileSize: parseInt(document.getElementById('avgFileSize').value),
        requestCount: parseInt(document.getElementById('requestCount').value),
        requestPeriod: document.getElementById('requestPeriod').value,
        readWriteRatio: document.getElementById('readWriteRatio').value,
        growthRate: parseFloat(document.getElementById('growthRate').value),
        growthPeriod: document.getElementById('growthPeriod').value
    };

    const calculator = new SystemCalculator(inputs);
    const metrics = calculator.calculateMetrics();

    updateResults(metrics);
    updateAllCharts(metrics);
}
