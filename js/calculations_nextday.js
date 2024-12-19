class SystemCalculator {
    constructor(inputs) {
        // Sanitize all inputs
        this.inputs = {
            totalUsers: Math.max(0, Number(inputs.totalUsers)),
            dau: Math.max(0, Number(inputs.dau)),
            dauType: inputs.dauType || 'absolute',
            storagePerUser: Math.max(0, Number(inputs.storagePerUser)),
            filesPerDay: Math.max(0, Number(inputs.filesPerDay) || 0),
            avgFileSize: Math.max(0, Number(inputs.avgFileSize) || 0),
            requestCount: Math.max(0, Number(inputs.requestCount) || 0),
            requestPeriod: inputs.requestPeriod || 'day',
            avgRequestSize: Math.max(0, Number(inputs.avgRequestSize) || 0),
            readWriteRatio: inputs.readWriteRatio || '80:20',
            growthRate: Math.max(0, Number(inputs.growthRate)),
            growthPeriod: inputs.growthPeriod || 'yearly'
        };

        // Calculate actual DAU
        this.actualDau = this.calculateActualDau();

        // Parse read/write ratio
        const [read, write] = this.inputs.readWriteRatio.split(':');
        this.readRatio = Number(read) / (Number(read) + Number(write));
        this.writeRatio = Number(write) / (Number(read) + Number(write));
    }

    calculateActualDau() {
        if (this.inputs.dauType === 'percentage') {
            return Math.floor(this.inputs.totalUsers * (this.inputs.dau / 100));
        }
        return Math.min(this.inputs.dau, this.inputs.totalUsers);
    }

    calculateRequestsPerSecond() {
        let requestsPerDay = 0;


        // If files per day is provided, calculate requests based on files
        if (this.inputs.filesPerDay > 0 && this.inputs.avgFileSize > 0) {
            const writeRequestsPerDay = this.actualDau * this.inputs.filesPerDay;
            const totalRequestsPerDay = writeRequestsPerDay / this.writeRatio;
            requestsPerDay = totalRequestsPerDay;

            // Store sizes for bandwidth calculation
            this.writeRequestSize = this.inputs.avgFileSize;
            this.readRequestSize = this.inputs.avgRequestSize || this.inputs.avgFileSize;
        }
        // If request count is provided, use that
        else if (this.inputs.requestCount > 0) {
            requestsPerDay = this.actualDau * this.inputs.requestCount;

            // Convert based on period
            if (this.inputs.requestPeriod === 'second') {
                requestsPerDay *= 86400; // 24 * 60 * 60
            } else if (this.inputs.requestPeriod === 'hour') {
                requestsPerDay *= 24;
            }

            // Use avgRequestSize for both read and write
            this.readRequestSize = this.inputs.avgRequestSize;
            this.writeRequestSize = this.inputs.avgRequestSize;
        }
        else {
            return 0;
        }

        return requestsPerDay / 86400; // Convert to per second
    }

    calculateBandwidth() {
        const rps = this.calculateRequestsPerSecond();

        // Calculate read and write requests per second
        const readRps = rps * this.readRatio;
        const writeRps = rps * this.writeRatio;

        // Calculate bandwidth for reads and writes (KB/s)
        const readBandwidth = readRps * this.readRequestSize;
        const writeBandwidth = writeRps * this.writeRequestSize;

        return {
            readBandwidth,
            writeBandwidth,
            totalBandwidth: readBandwidth + writeBandwidth
        };
    }

    calculateStorage() {
        // Calculate base storage
        const baseStorage = this.inputs.totalUsers * this.inputs.storagePerUser;

        // Calculate additional storage from file uploads
        let dailyStorageIncrease = 0;
        if (this.inputs.filesPerDay > 0 && this.inputs.avgFileSize > 0) {
            dailyStorageIncrease = (this.actualDau * this.inputs.filesPerDay * this.inputs.avgFileSize) / (1024 * 1024); // Convert to GB
        }

        return {
            baseStorage,
            dailyIncrease: dailyStorageIncrease
        };
    }

calculateGrowth(months = 12) {
    // Add error handling for edge cases
    try {
        const results = [];
        let currentUsers = this.inputs.totalUsers;
        let currentStorage = this.calculateStorage().baseStorage;

        // Validate growth rate
        const monthlyRate = this.inputs.growthPeriod === 'yearly'
            ? Math.pow(1 + Math.max(0, Math.min(1000, this.inputs.growthRate)) / 100, 1/12) - 1
            : Math.max(0, Math.min(100, this.inputs.growthRate)) / 100;

        for (let i = 0; i <= months; i++) {
            results.push({
                month: i,
                users: Math.floor(currentUsers),
                storage: currentStorage
            });

            currentUsers *= (1 + monthlyRate);
            currentStorage *= (1 + monthlyRate);
        }

        return results;
    } catch (error) {
        console.error('Error in growth calculation:', error);
        return Array(months + 1).fill({ month: 0, users: 0, storage: 0 });
    }
}

    generateReport() {
        const bandwidth = this.calculateBandwidth();
        const storage = this.calculateStorage();
        const growth = this.calculateGrowth();
        const rps = this.calculateRequestsPerSecond();

        return {
            currentMetrics: {
                totalUsers: this.inputs.totalUsers,
                dau: this.actualDau,
                rps: rps,
                bandwidth: bandwidth,
                storage: storage
            },
            growth: growth,
            readRatio: this.readRatio,
            writeRatio: this.writeRatio,
            requestSizes: {
                read: this.readRequestSize,
                write: this.writeRequestSize
            }
        };
    }
}

function updateCharts(report) {
    try {
        // Update storage growth chart
        if (typeof storageGrowthChart !== 'undefined') {
            const storageData = report.growth.map(point => point.storage);
            storageGrowthChart.data.datasets[0].data = storageData;
            storageGrowthChart.update();
        }

        // Update user growth chart
        if (typeof userGrowthChart !== 'undefined') {
            const userData = report.growth.map(point => point.users);
            userGrowthChart.data.datasets[0].data = userData;
            userGrowthChart.update();
        }
    } catch (error) {
        console.warn('Error updating charts:', error);
    }
}

function validateInputs() {
    const requiredFields = ['totalUsers', 'dau', 'storagePerUser'];
    for (const field of requiredFields) {
        const value = document.getElementById(field).value;
        if (!value || isNaN(value) || value <= 0) {
            alert(`Please enter a valid value for ${field.replace(/([A-Z])/g, ' \$1').toLowerCase()}`);
            return false;
        }
    }
    return true;
}

function displayResults(report) {
    const resultsDiv = document.getElementById('results');
    const stepsDiv = document.getElementById('calculationSteps');

    // Format current metrics
    const currentMetrics = `
        <div class="result-section">
            <h3>Current System Requirements</h3>
            <div class="result-grid">
                <div class="result-item">
                    <div class="result-label">Total Users</div>
                    <div class="result-value">${formatNumber(report.currentMetrics.totalUsers)}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Daily Active Users</div>
                    <div class="result-value">${formatNumber(report.currentMetrics.dau)}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Requests per Second</div>
                    <div class="result-value">${formatNumber(report.currentMetrics.rps, 2)}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Total Bandwidth</div>
                    <div class="result-value">${formatSize(report.currentMetrics.bandwidth.totalBandwidth * 1024)}/s</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Storage Required</div>
                    <div class="result-value">${formatSize(report.currentMetrics.storage.baseStorage * 1024 * 1024 * 1024)}</div>
                </div>
            </div>
        </div>
    `;

    // Format detailed metrics
    const detailedMetrics = `
        <div class="result-section">
            <h3>Detailed Metrics</h3>
            <div class="result-grid">
                <div class="result-item">
                    <div class="result-label">Read Bandwidth</div>
                    <div class="result-value">${formatSize(report.currentMetrics.bandwidth.readBandwidth * 1024)}/s</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Write Bandwidth</div>
                    <div class="result-value">${formatSize(report.currentMetrics.bandwidth.writeBandwidth * 1024)}/s</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Daily Storage Growth</div>
                    <div class="result-value">${formatSize(report.currentMetrics.storage.dailyIncrease * 1024 * 1024 * 1024)}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Read/Write Ratio</div>
                    <div class="result-value">${Math.round(report.readRatio * 100)}:${Math.round(report.writeRatio * 100)}</div>
                </div>
            </div>
        </div>
    `;

    // Format calculation steps
    const steps = generateCalculationSteps(report);

    // Update the DOM
    resultsDiv.innerHTML = currentMetrics + detailedMetrics;
    stepsDiv.innerHTML = steps;
}

function generateCalculationSteps(report) {
    const steps = `
        <h3>Detailed Calculation Steps</h3>
        <div class="calculation-step">
            <h4>1. User Base Calculations</h4>
            <p>Total Users: ${formatNumber(report.currentMetrics.totalUsers)}</p>
            <p>Daily Active Users: ${formatNumber(report.currentMetrics.dau)}</p>
        </div>

        <div class="calculation-step">
            <h4>2. Request Calculations</h4>
            <p>Requests per Second: ${formatNumber(report.currentMetrics.rps, 2)}</p>
            <p>Read Request Size: ${formatSize(report.requestSizes.read * 1024)}</p>
            <p>Write Request Size: ${formatSize(report.requestSizes.write * 1024)}</p>
        </div>

        <div class="calculation-step">
            <h4>3. Bandwidth Requirements</h4>
            <p>Read Bandwidth: ${formatSize(report.currentMetrics.bandwidth.readBandwidth * 1024)}/s</p>
            <p>Write Bandwidth: ${formatSize(report.currentMetrics.bandwidth.writeBandwidth * 1024)}/s</p>
            <p>Total Bandwidth: ${formatSize(report.currentMetrics.bandwidth.totalBandwidth * 1024)}/s</p>
        </div>

        <div class="calculation-step">
            <h4>4. Storage Requirements</h4>
            <p>Base Storage: ${formatSize(report.currentMetrics.storage.baseStorage * 1024 * 1024 * 1024)}</p>
            <p>Daily Storage Growth: ${formatSize(report.currentMetrics.storage.dailyIncrease * 1024 * 1024 * 1024)}</p>
        </div>

        <div class="calculation-step">
            <h4>5. Growth Projections</h4>
            <p>12-Month User Growth: ${formatNumber(report.growth[12].users)}</p>
            <p>12-Month Storage Growth: ${formatSize(report.growth[12].storage * 1024 * 1024 * 1024)}</p>
        </div>
    `;

    return steps;
}

// Helper function to format numbers with commas
function formatNumber(num, decimals = 0) {
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// Helper function to format sizes (bytes to appropriate unit)
function formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${formatNumber(size, 2)} ${units[unitIndex]}`;
}

// Main calculation function
function calculateAll() {
    // Clear previous results
    document.getElementById('results').innerHTML = '';
    document.getElementById('calculationSteps').innerHTML = '';

    // Validate inputs
    if (!validateInputs()) return;

    // Create calculator instance
    const calculator = new SystemCalculator({
        totalUsers: document.getElementById('totalUsers').value,
        dau: document.getElementById('dau').value,
        dauType: document.getElementById('dauType').value,
        storagePerUser: document.getElementById('storagePerUser').value,
        filesPerDay: document.getElementById('filesPerDay').value,
        avgFileSize: document.getElementById('avgFileSize').value,
        requestCount: document.getElementById('requestCount').value,
        requestPeriod: document.getElementById('requestPeriod').value,
        avgRequestSize: document.getElementById('avgRequestSize').value,
        readWriteRatio: document.getElementById('readWriteRatio').value,
        growthRate: document.getElementById('growthRate').value,
        growthPeriod: document.getElementById('growthPeriod').value
    });

    // Generate and display report
    const report = calculator.generateReport();
    displayResults(report);
    updateCharts(report);
}