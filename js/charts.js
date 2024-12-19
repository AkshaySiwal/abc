// js/charts.js

let storageGrowthChart = null;
let dailyUsageChart = null;
let readWriteChart = null;
let resourceUtilizationChart = null;

function initializeCharts() {
    // Destroy existing charts if they exist
    if (storageGrowthChart) storageGrowthChart.destroy();
    if (dailyUsageChart) dailyUsageChart.destroy();
    if (readWriteChart) readWriteChart.destroy();
    if (resourceUtilizationChart) resourceUtilizationChart.destroy();

    // Initialize charts with empty data
    createStorageGrowthChart([]);
    createDailyUsageChart(0);
    createReadWriteChart(0, 0);
    createResourceUtilizationChart(0);
}

function createStorageGrowthChart(projections) {
    const ctx = document.getElementById('storageGrowthChart').getContext('2d');
    storageGrowthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: generateTimeLabels(60),
            datasets: [{
                label: 'Storage Growth',
                data: projections.map(bytes => bytes / (1024 * 1024 * 1024 * 1024)), // Convert to TB
                borderColor: '#3498db',
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Storage (TB)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                }
            }
        }
    });
}

function createDailyUsageChart(dailyStorage) {
    const ctx = document.getElementById('dailyUsageChart').getContext('2d');
    dailyUsageChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Daily Storage Generation'],
            datasets: [{
                label: 'Storage (GB)',
                data: [dailyStorage / (1024 * 1024 * 1024)],
                backgroundColor: '#2ecc71'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'GB'
                    }
                }
            }
        }
    });
}

function createReadWriteChart(readRps, writeRps) {
    const ctx = document.getElementById('readWriteChart').getContext('2d');
    readWriteChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Read Operations', 'Write Operations'],
            datasets: [{
                data: [readRps, writeRps],
                backgroundColor: ['#3498db', '#e74c3c']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createResourceUtilizationChart(totalStorage) {
    const ctx = document.getElementById('resourceUtilizationChart').getContext('2d');
    resourceUtilizationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Storage Utilization'],
            datasets: [{
                label: 'Used (TB)',
                data: [totalStorage / (1024 * 1024 * 1024 * 1024)],
                backgroundColor: '#f1c40f'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'TB'
                    }
                }
            }
        }
    });
}

function updateAllCharts(metrics) {
    // Update Storage Growth Chart
    storageGrowthChart.data.datasets[0].data = metrics.growth.storage.map(bytes => bytes / (1024 * 1024 * 1024 * 1024));
    storageGrowthChart.update();

    // Update Daily Usage Chart
    dailyUsageChart.data.datasets[0].data = [metrics.storage.totalDaily / (1024 * 1024 * 1024)];
    dailyUsageChart.update();

    // Update Read/Write Chart
    readWriteChart.data.datasets[0].data = [metrics.requests.readRps, metrics.requests.writeRps];
    readWriteChart.update();

    // Update Resource Utilization Chart
    resourceUtilizationChart.data.datasets[0].data = [metrics.storage.totalAllocated / (1024 * 1024 * 1024 * 1024)];
    resourceUtilizationChart.update();
}
