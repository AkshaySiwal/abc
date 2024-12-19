// js/main.js

// Initialize everything when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    loadTemplate('social'); // Load social media template by default
    setupEventListeners();
    setupFieldDependencies(); // Add this line
});

function resetFields() {
    const fields = ['requestCount', 'requestPeriod', 'filesPerDay', 'avgFileSize'];
    fields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        element.value = fieldId === 'requestPeriod' ? 'second' : ''; // Reset period selector to default
        element.disabled = false;
        element.classList.remove('disabled-field');
        if (fieldId === 'requestCount') {
            document.getElementById('requestCountInfo').textContent = '';
        }
    });
}

// Add a call to resetFields in your existing template loading function
function loadTemplate() {
    resetFields(); // Add this line at the start
    const template = document.getElementById('template').value;
    if (templates[template]) {
        const t = templates[template];
        // Rest of your template loading code...
    }
}

// Also add it to your existing reset functionality
function resetForm() {
    resetFields(); // Add this line
    document.querySelectorAll('input').forEach(input => {
        if (!['requestCount', 'filesPerDay', 'avgFileSize'].includes(input.id)) {
            input.value = '';
        }
    });
    document.querySelectorAll('select').forEach(select => {
        select.selectedIndex = 0;
    });
    document.getElementById('template').value = '';
    document.getElementById('dauPercentageDisplay').textContent = '';
    document.getElementById('results').innerHTML = '';
    document.getElementById('calculationSteps').innerHTML = '';
    initializeCharts();
}

function calculateStorageInfo() {
    const dau = parseFloat(document.getElementById('dau').value) || 0;
    const storagePerUser = parseFloat(document.getElementById('storagePerUser').value) || 0;
    const filesPerDay = parseFloat(document.getElementById('filesPerDay').value) || 0;
    const avgFileSize = parseFloat(document.getElementById('avgFileSize').value) || 0;
    const storageInfo = document.getElementById('storageInfo');

    // Add null check
    if (!storageInfo) {
        console.warn('storageInfo element not found');
        return;
    }

    if (dau > 0 && (storagePerUser > 0 || (filesPerDay > 0 && avgFileSize > 0))) {
        // Calculate base storage
        const baseStorage = dau * storagePerUser * 1024 * 1024 * 1024; // Convert GB to bytes

        // Calculate daily growth if file uploads are specified
        const dailyGrowth = filesPerDay > 0 && avgFileSize > 0
            ? dau * filesPerDay * avgFileSize * 1024 // Convert KB to bytes
            : 0;

        // Calculate time periods
        const monthlyGrowth = dailyGrowth * 30;
        const yearlyGrowth = dailyGrowth * 365;

        // Calculate time to fill base storage
        let timeToFill = "N/A";
        if (dailyGrowth > 0 && baseStorage > 0) {
            const daysToFill = baseStorage / dailyGrowth;
            if (daysToFill < 30) {
                timeToFill = `${Math.round(daysToFill)} days`;
            } else if (daysToFill < 365) {
                timeToFill = `${Math.round(daysToFill / 30)} months`;
            } else {
                timeToFill = `${(daysToFill / 365).toFixed(1)} years`;
            }
        }

        storageInfo.innerHTML = `
            <div class="info-message">
                Based on ${formatNumber(dau)} daily active users:
                <br>Total Storage Allocated: ${formatSize(baseStorage)}
                <br>Daily Storage Growth: ${formatSize(dailyGrowth)}
                <br>Monthly Storage Growth: ${formatSize(monthlyGrowth)}
                <br>Yearly Storage Growth: ${formatSize(yearlyGrowth)}
                <br>Time to Fill Total Storage: ${timeToFill}
            </div>
        `;
    } else {
        storageInfo.innerHTML = '';
    }
}


// Setup all event listeners
function setupEventListeners() {
    // Input change listeners
    document.getElementById('totalUsers').addEventListener('change', updateDauPercentage);
    document.getElementById('dau').addEventListener('change', updateDauPercentage);
    document.getElementById('dauType').addEventListener('change', updateDauPercentage);

    document.getElementById('dau').addEventListener('input', calculateStorageInfo);
    document.getElementById('dauType').addEventListener('change', calculateStorageInfo);
document.getElementById('storagePerUser').addEventListener('input', calculateStorageInfo);
document.getElementById('filesPerDay').addEventListener('input', calculateStorageInfo);
document.getElementById('avgFileSize').addEventListener('input', calculateStorageInfo);

    // Template change listener
    document.getElementById('template').addEventListener('change', loadTemplate);

    // Calculate button listener
    document.querySelector('.calculate-btn').addEventListener('click', calculateAll);

    // Add input validation to all numeric inputs
    const numericInputs = document.querySelectorAll('input[type="number"]');
    numericInputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.value < 0) this.value = 0;
        });
    });
}

function setupFieldDependencies() {
    const requestCount = document.getElementById('requestCount');
    const requestPeriod = document.getElementById('requestPeriod');
    const filesPerDay = document.getElementById('filesPerDay');
    const avgFileSize = document.getElementById('avgFileSize');
    const requestCountInfo = document.getElementById('requestCountInfo');
    const filesPerDayInfo = document.getElementById('filesPerDayInfo');
    const avgFileSizeInfo = document.getElementById('avgFileSizeInfo');
    const readWriteRatio = document.getElementById('readWriteRatio');



    readWriteRatio.addEventListener('change', function() {
        const hasFilesPerDay = filesPerDay.value.trim() !== '';
          if (hasFilesPerDay) {
             calculateFileBasedRequests();
          }
    });

    readWriteRatio.addEventListener('change', function() {
          if (requestCount.value.trim() !== '') {
             calculateRequestBasedRequests();
          }
    });

    requestCount.addEventListener('input', () => {
    if (requestCount.value.trim() !== '') {
        calculateRequestBasedRequests();
        }
    });

     requestPeriod.addEventListener('change', () => {
    if (requestCount.value.trim() !== '') {
        calculateRequestBasedRequests();
        }
    });





    function enableFileFields() {
        filesPerDay.disabled = false;
        avgFileSize.disabled = false;
        filesPerDay.classList.remove('disabled-field');
        avgFileSize.classList.remove('disabled-field');
        filesPerDayInfo.textContent = '';
        avgFileSizeInfo.textContent = '';
    }

    function enableRequestField() {
        requestCount.disabled = false;
        requestPeriod.disabled = false; // Enable period selector
        requestCount.classList.remove('disabled-field');
        requestPeriod.classList.remove('disabled-field'); // Remove disabled style from period selector
        requestCountInfo.textContent = '';
    }

    function disableFileFields() {
        filesPerDay.disabled = true;
        avgFileSize.disabled = true;
        filesPerDay.classList.add('disabled-field');
        avgFileSize.classList.add('disabled-field');
        filesPerDayInfo.textContent = 'Disabled when using Requests Per User';
        avgFileSizeInfo.textContent = 'Disabled when using Requests Per User';
        avgFileSize.classList.remove('required-field');
        filesPerDay.classList.remove('required-field');
        avgFileSizeInfo.classList.remove('warning-message');
        filesPerDayInfo.classList.remove('warning-message');
    }

    function disableRequestField() {
        requestCount.disabled = true;
        requestPeriod.disabled = true; // Disable period selector
        requestCount.classList.add('disabled-field');
        requestPeriod.classList.add('disabled-field'); // Add disabled style to period selector
        requestCountInfo.textContent = 'Disabled when using File Upload metrics';
    }

    function clearFileFieldsWarnings() {
        avgFileSize.classList.remove('required-field');
        filesPerDay.classList.remove('required-field');
        avgFileSizeInfo.textContent = '';
        filesPerDayInfo.textContent = '';
        avgFileSizeInfo.classList.remove('warning-message');
        filesPerDayInfo.classList.remove('warning-message');
    }

    function updateFieldStates() {
    const hasRequestCount = requestCount.value.trim() !== '';
    const hasFilesPerDay = filesPerDay.value.trim() !== '';
    const hasAvgFileSize = avgFileSize.value.trim() !== '';

    // Clear warnings if all fields are empty
    if (!hasRequestCount && !hasFilesPerDay && !hasAvgFileSize) {
        clearFileFieldsWarnings();
        enableRequestField();
        enableFileFields();
        updateReadWriteRatioOptions('request'); // Default to request-based options
        return;
    }

    if (hasRequestCount) {
        disableFileFields();
        enableRequestField();
        updateReadWriteRatioOptions('request');
    } else if (hasFilesPerDay || hasAvgFileSize) {
        disableRequestField();
        enableFileFields();
        updateReadWriteRatioOptions('files');

        // Check for mutual dependency between Files Per Day and Average File Size
        if (hasFilesPerDay && !hasAvgFileSize) {
            avgFileSize.classList.add('required-field');
            avgFileSizeInfo.textContent = 'Required when Files Per Day is specified';
            avgFileSizeInfo.classList.add('warning-message');
        } else if (!hasFilesPerDay && hasAvgFileSize) {
            filesPerDay.classList.add('required-field');
            filesPerDayInfo.textContent = 'Required when Average File Size is specified';
            filesPerDayInfo.classList.add('warning-message');
        } else {
            clearFileFieldsWarnings();
        }
    } else {
        enableRequestField();
        enableFileFields();
        clearFileFieldsWarnings();
    }
}

    // Add input event listeners with debouncing
    let debounceTimer;
    const debounceDelay = 300; // milliseconds

    function debounceUpdate() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(updateFieldStates, debounceDelay);
    }

    requestCount.addEventListener('input', debounceUpdate);
    requestPeriod.addEventListener('change', debounceUpdate);
    filesPerDay.addEventListener('input', debounceUpdate);
    avgFileSize.addEventListener('input', debounceUpdate);

    // Add focus listeners to clear fields when focusing on disabled inputs
    requestCount.addEventListener('focus', function() {
        if (this.disabled) {
            filesPerDay.value = '';
            avgFileSize.value = '';
            clearFileFieldsWarnings();
            updateFieldStates();
        }
    });

    requestPeriod.addEventListener('focus', function() {
        if (this.disabled) {
            filesPerDay.value = '';
            avgFileSize.value = '';
            clearFileFieldsWarnings();
            updateFieldStates();
        }
    });

    filesPerDay.addEventListener('focus', function() {
        if (this.disabled) {
            requestCount.value = '';
            updateFieldStates();
        }
    });

    avgFileSize.addEventListener('focus', function() {
        if (this.disabled) {
            requestCount.value = '';
            updateFieldStates();
        }
    });
    // Modify the calculate button click handler
    const calculateButton = document.querySelector('.calculate-btn');
    calculateButton.addEventListener('click', function(e) {
        const hasFilesPerDay = filesPerDay.value.trim() !== '';
        const hasAvgFileSize = avgFileSize.value.trim() !== '';
        const hasRequestCount = requestCount.value.trim() !== '';

        // Only validate if we're using file upload metrics
        if (!hasRequestCount && (hasFilesPerDay || hasAvgFileSize)) {
            if (hasFilesPerDay && !hasAvgFileSize) {
                e.preventDefault();
                avgFileSize.classList.add('required-field');
                avgFileSizeInfo.textContent = 'Please specify Average File Size';
                avgFileSizeInfo.classList.add('warning-message');
                avgFileSize.focus();
                return false;
            } else if (!hasFilesPerDay && hasAvgFileSize) {
                e.preventDefault();
                filesPerDay.classList.add('required-field');
                filesPerDayInfo.textContent = 'Please specify Files Uploaded Per Day';
                filesPerDayInfo.classList.add('warning-message');
                filesPerDay.focus();
                return false;
            }
        }
    });

    // Initial state check
    updateFieldStates();
}

function updateResults(metrics) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <h2>System Requirements Analysis</h2>

        <div class="calculation-steps">
            <h3>Storage Requirements</h3>
            <p>Daily Storage Generation: ${formatSize(metrics.storage.totalDaily)}</p>
            <p>Total Allocated Storage: ${formatSize(metrics.storage.totalAllocated)}</p>
            <p>Storage per Active User: ${formatSize(metrics.storage.dailyPerUser)}</p>
            <p>Monthly Storage Growth: ${formatSize(metrics.storage.totalDaily * 30)}</p>
        </div>

        <div class="calculation-steps">
            <h3>Request Handling</h3>
            <p>Total Requests per Second: ${formatNumber(metrics.requests.totalRps.toFixed(2))}</p>
            <p>Read Operations: ${formatNumber(metrics.requests.readRps.toFixed(2))} per second</p>
            <p>Write Operations: ${formatNumber(metrics.requests.writeRps.toFixed(2))} per second</p>
            <p>Read/Write Ratio: ${metrics.requests.readRatio}:${metrics.requests.writeRatio}</p>
        </div>

        <div class="calculation-steps">
            <h3>Bandwidth Requirements</h3>
            <p>Inbound Bandwidth: ${formatSize(metrics.bandwidth.inbound)}/s</p>
            <p>Outbound Bandwidth: ${formatSize(metrics.bandwidth.outbound)}/s</p>
            <p>Total Bandwidth: ${formatSize(metrics.bandwidth.total)}/s</p>
            <p>Daily Data Transfer: ${formatSize(metrics.bandwidth.total * 86400)}</p>
        </div>

        <div class="calculation-steps">
            <h3>Growth Projections</h3>
            <p>1 Year Projection:</p>
            <ul>
                <li>Storage Needed: ${formatSize(metrics.growth.storage[11])}</li>
                <li>Expected Users: ${formatNumber(Math.round(metrics.growth.users[11]))}</li>
                <li>Projected Bandwidth: ${formatSize(metrics.growth.bandwidth[11])}/s</li>
            </ul>
            <p>5 Year Projection:</p>
            <ul>
                <li>Storage Needed: ${formatSize(metrics.growth.storage[59])}</li>
                <li>Expected Users: ${formatNumber(Math.round(metrics.growth.users[59]))}</li>
                <li>Projected Bandwidth: ${formatSize(metrics.growth.bandwidth[59])}/s</li>
            </ul>
        </div>
    `;
}

function updateReadWriteRatioOptions(mode) {
    const readWriteRatio = document.getElementById('readWriteRatio');
    const requestsInfo = document.getElementById('requestsInfo');

    const requestBasedOptions = `
        <option value="100:1">100:1 (Read Heavy)</option>
        <option value="80:20">80:20 (Typical Social Media)</option>
        <option value="50:50">50:50 (Balanced)</option>
        <option value="20:80">20:80 (Write Heavy)</option>
    `;

    const fileBasedOptions = `
        <option value="100:1">100:1 (Read Heavy)</option>
        <option value="4:1">4:1 (Typical Social Media)</option>
        <option value="1:1">1:1 (Balanced)</option>
        <option value="1:4">1:4 (Write Heavy)</option>
    `;

    // Update options based on mode
    readWriteRatio.innerHTML = mode === 'files' ? fileBasedOptions : requestBasedOptions;

    // Calculate and display requests info if in file mode
    if (mode === 'files') {
        calculateFileBasedRequests();
    } else if (mode === 'request') {
        calculateRequestBasedRequests();
    } else {
        if (requestsInfo) requestsInfo.innerHTML = '';
    }
}

function calculateFileBasedRequests() {
    const filesPerDay = parseFloat(document.getElementById('filesPerDay').value) || 0;
    const readWriteRatio = document.getElementById('readWriteRatio').value;
    const requestsInfo = document.getElementById('requestsInfo');

    // Add null check
    if (!requestsInfo) {
        console.warn('requestsInfo element not found');
        return;
    }

    if (filesPerDay > 0) {
        let [readPart, writePart] = readWriteRatio.split(':').map(Number);
        let writeRequests = filesPerDay; // Write requests equal to files uploaded
        let readRequests;

        if (readPart >= writePart) {
            // For ratios like 100:1, 4:1, 1:1
            readRequests = writeRequests * (readPart / writePart);
        } else {
            // For ratios like 1:4
            readRequests = writeRequests / (writePart / readPart);
        }

        requestsInfo.innerHTML = `
            <div class="info-message">
                Based on ${filesPerDay} files per day:
                <br>Write requests per day: ${writeRequests.toFixed(2)}
                <br>Read requests per day: ${readRequests.toFixed(2)}
                <br>Total requests per day: ${(readRequests + writeRequests).toFixed(2)}
                <br>Read/Write ratio: ${readWriteRatio}
            </div>
        `;
    } else {
        requestsInfo.innerHTML = '';
    }
}

function calculateRequestBasedRequests() {
    const requestCount = parseFloat(document.getElementById('requestCount').value) || 0;
    const requestPeriod = document.getElementById('requestPeriod').value;
    const readWriteRatio = document.getElementById('readWriteRatio').value;
    const requestsInfo = document.getElementById('requestsInfo');

    // Add null check
    if (!requestsInfo) {
        console.warn('requestsInfo element not found');
        return;
    }

    if (requestCount > 0) {
        let [readPart, writePart] = readWriteRatio.split(':').map(Number);
        let totalRatio = readPart + writePart;

        // Convert requests to daily if needed
        let requestsPerDay = requestCount;
        if (requestPeriod === 'second') {
            requestsPerDay *= 86400; // 24 * 60 * 60
        } else if (requestPeriod === 'hour') {
            requestsPerDay *= 24;
        }

        // Calculate read and write requests
        let readRequests = requestsPerDay * (readPart / totalRatio);
        let writeRequests = requestsPerDay * (writePart / totalRatio);

        // Format period text
        let periodText = requestPeriod === 'day' ? 'per day' :
                        requestPeriod === 'hour' ? 'per hour' : 'per second';

        requestsInfo.innerHTML = `
            <div class="info-message">
                Based on ${requestCount} requests ${periodText}:
                <br>Write requests per day: ${writeRequests.toFixed(2)}
                <br>Read requests per day: ${readRequests.toFixed(2)}
                <br>Total requests per day: ${(readRequests + writeRequests).toFixed(2)}
                <br>Read/Write ratio: ${readWriteRatio}
            </div>
        `;
    } else {
        requestsInfo.innerHTML = '';
    }
}


function updateDauPercentage() {
    const totalUsers = parseInt(document.getElementById('totalUsers').value) || 0;
    const dau = parseInt(document.getElementById('dau').value) || 0;
    const dauType = document.getElementById('dauType').value;
    const displayDiv = document.getElementById('dauPercentageDisplay');

    if (totalUsers > 0) {
        if (dauType === 'absolute') {
            const percentage = ((dau / totalUsers) * 100).toFixed(2);
            displayDiv.textContent = `This represents ${percentage}% of total users`;
            if (dau > totalUsers) {
                displayDiv.classList.add('error');
                displayDiv.textContent += ' (Warning: DAU exceeds total users)';
            } else {
                displayDiv.classList.remove('error');
            }
        } else {
            const absoluteUsers = Math.round((dau / 100) * totalUsers);
            displayDiv.textContent = `This represents ${formatNumber(absoluteUsers)} users`;
            if (dau > 100) {
                displayDiv.classList.add('error');
                displayDiv.textContent += ' (Warning: Percentage cannot exceed 100%)';
            } else {
                displayDiv.classList.remove('error');
            }
        }
    } else {
        displayDiv.textContent = '';
    }
}

// Export functionality
function exportResults() {
    const metrics = calculateAll(true); // Get metrics without updating UI
    const results = {
        timestamp: new Date().toISOString(),
        inputs: getInputValues(),
        metrics: metrics,
        calculations: document.getElementById('calculationSteps').innerHTML
    };

    // Create blob and download
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-design-calculations-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Print functionality
function printResults() {
    window.print();
}

// Reset form
function resetForm() {
    document.querySelectorAll('input').forEach(input => {
        input.value = '';
    });
    document.querySelectorAll('select').forEach(select => {
        select.selectedIndex = 0;
    });
    document.getElementById('template').value = '';
    document.getElementById('dauPercentageDisplay').textContent = '';
    document.getElementById('results').innerHTML = '';
    document.getElementById('calculationSteps').innerHTML = '';
    initializeCharts();
}

// Handle window resize for charts
window.addEventListener('resize', function() {
    try {
        // Check if Chart.js resize method exists
        if (storageGrowthChart && typeof storageGrowthChart.resize === 'function') {
            storageGrowthChart.resize();
        }
        if (dailyUsageChart && typeof dailyUsageChart.resize === 'function') {
            dailyUsageChart.resize();
        }
        if (readWriteChart && typeof readWriteChart.resize === 'function') {
            readWriteChart.resize();
        }
        if (resourceUtilizationChart && typeof resourceUtilizationChart.resize === 'function') {
            resourceUtilizationChart.resize();
        }
    } catch (error) {
        console.warn('Chart resize error:', error);
        // Don't show alert to user as this is not critical
    }
});

// Error handling
window.addEventListener('error', function(e) {
    console.error('Runtime error:', e);
    alert('An error occurred. Please check the console for details.');
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'Enter':
                calculateAll();
                e.preventDefault();
                break;
            case 'p':
                printResults();
                e.preventDefault();
                break;
            case 's':
                exportResults();
                e.preventDefault();
                break;
            case 'r':
                resetForm();
                e.preventDefault();
                break;
        }
    }
});
