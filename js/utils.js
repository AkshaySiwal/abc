// js/utils.js

// Format large numbers with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Format bytes into human-readable sizes
function formatSize(bytes, detailed = false) {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    if (bytes === 0) return '0 B';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    const size = Math.round(bytes / Math.pow(1024, i) * 100) / 100;

    if (detailed) {
        return {
            value: size,
            unit: sizes[i],
            bytes: bytes,
            formatted: `${size} ${sizes[i]}`
        };
    }
    return `${size} ${sizes[i]}`;
}

// Convert various units to bytes
function toBytes(value, unit) {
    const units = {
        'B': 1,
        'KB': 1024,
        'MB': 1024 * 1024,
        'GB': 1024 * 1024 * 1024,
        'TB': 1024 * 1024 * 1024 * 1024
    };
    return value * (units[unit] || 1);
}

// Format time duration
function formatDuration(seconds) {
    if (seconds < 60) return `${seconds.toFixed(2)} seconds`;
    if (seconds < 3600) return `${(seconds/60).toFixed(2)} minutes`;
    if (seconds < 86400) return `${(seconds/3600).toFixed(2)} hours`;
    return `${(seconds/86400).toFixed(2)} days`;
}

// Validate numeric input
function validateNumericInput(value, min = 0, max = Infinity) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
}

// Show calculation steps
function showCalculationStep(stepNumber, description, formula, result) {
    return `
        <div class="calculation-step">
            <strong>Step ${stepNumber}:</strong> ${description}
            <div class="formula">${formula}</div>
            <div class="result">Result: ${result}</div>
        </div>
    `;
}

// Format percentage
function formatPercentage(value, decimals = 2) {
    return `${(value * 100).toFixed(decimals)}%`;
}

// Generate time labels for charts
function generateTimeLabels(months) {
    const labels = [];
    for (let i = 0; i <= months; i++) {
        if (i === 0) labels.push('Now');
        else if (i % 12 === 0) labels.push(`${i/12}y`);
        else if (i % 3 === 0) labels.push(`${i}m`);
        else labels.push('');
    }
    return labels;
}

// Error handling wrapper
function safeExecute(func, errorMessage = 'An error occurred') {
    try {
        return func();
    } catch (error) {
        console.error(error);
        alert(errorMessage);
        return null;
    }
}

// Input validation
// In js/utils.js
function validateInputs() {
    // Always required fields
    const basicFields = [
        { id: 'totalUsers', name: 'Total Users', min: 1 },
        { id: 'dau', name: 'Daily Active Users', min: 1 }
    ];

    // Validate basic fields
    for (const field of basicFields) {
        const element = document.getElementById(field.id);
        const value = parseFloat(element.value);

        if (!validateNumericInput(value, field.min)) {
            alert(`Please enter a valid value for ${field.name}`);
            element.focus();
            return false;
        }
    }

    // Validate DAU logic
    const dau = parseInt(document.getElementById('dau').value);
    const totalUsers = parseInt(document.getElementById('totalUsers').value);
    if (isNaN(totalUsers) || totalUsers <= 0) {
            alert('Please enter a valid number for Total Users');
            return false;
        }
    const dauType = document.getElementById('dauType').value;

    if (dauType === 'absolute' && dau > totalUsers) {
        alert('Daily Active Users cannot exceed Total Users');
        return false;
    }

    if (dauType === 'percentage' && dau > 100) {
        alert('DAU percentage cannot exceed 100%');
        return false;
    }

    // Check if either request count or file metrics are provided
    const requestCount = document.getElementById('requestCount').value.trim();
    const filesPerDay = document.getElementById('filesPerDay').value.trim();
    const avgFileSize = document.getElementById('avgFileSize').value.trim();

    // If using request count, validate it
    if (requestCount !== '') {
        if (!validateNumericInput(parseFloat(requestCount), 0)) {
            alert('Please enter a valid value for Requests Per User');
            document.getElementById('requestCount').focus();
            return false;
        }
        return true; // Request count is valid, no need to check file metrics
    }

    // If using file metrics, validate both fields together
    if (filesPerDay !== '' || avgFileSize !== '') {
        if (filesPerDay === '') {
            alert('Please enter a value for Files Per Day');
            document.getElementById('filesPerDay').focus();
            return false;
        }
        if (avgFileSize === '') {
            alert('Please enter a value for Average File Size');
            document.getElementById('avgFileSize').focus();
            return false;
        }
        if (!validateNumericInput(parseFloat(filesPerDay), 0)) {
            alert('Please enter a valid value for Files Per Day');
            document.getElementById('filesPerDay').focus();
            return false;
        }
        if (!validateNumericInput(parseFloat(avgFileSize), 0)) {
            alert('Please enter a valid value for Average File Size');
            document.getElementById('avgFileSize').focus();
            return false;
        }
    }

    // At least one of request count or file metrics must be provided
    if (requestCount === '' && filesPerDay === '' && avgFileSize === '') {
        alert('Please provide either Requests Per User or File Upload metrics');
        return false;
    }

    return true;
}
