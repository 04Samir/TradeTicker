let marketChart;

function createChart(canvasId, data, timeframe) {
    const ctx = $('#' + canvasId)[0].getContext('2d');
    const parsedData = parseChartData(data);

    if (marketChart) {
        marketChart.destroy();
    }

    const timeUnit = getTimeUnit(timeframe);
    const firstPrice = parsedData.prices[0];
    const lastPrice = parsedData.prices[parsedData.prices.length - 1];
    const isPriceUp = lastPrice > firstPrice;

    let lastFormattedLabel = '';

    // eslint-disable-next-line no-undef
    marketChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: parsedData.labels,
            datasets: [
                {
                    data: parsedData.prices,
                    borderColor: isPriceUp ? '#4CAF50' : '#FF3B30',
                    backgroundColor: isPriceUp
                        ? 'rgba(76, 175, 80, 0.1)'
                        : 'rgba(255, 59, 48, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: timeUnit,
                        displayFormats: {
                            minute: 'HH:mm',
                            hour: 'HH:mm',
                            day: 'MMM d',
                            week: 'MMM d',
                            month: 'MMM yyyy',
                            year: 'yyyy',
                        },
                    },
                    grid: { display: false },
                    ticks: {
                        source: 'auto',
                        autoSkip: true,
                        maxRotation: 0,
                        minRotation: 0,
                        callback: function (value) {
                            const date = new Date(value);
                            let formattedLabel;

                            switch (timeframe) {
                                case '1D': {
                                    const minutes = date.getMinutes();
                                    if (minutes % 30 === 0) {
                                        formattedLabel =
                                            date.toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            });
                                    }
                                    break;
                                }
                                case '1W': {
                                    formattedLabel = date.toLocaleDateString(
                                        [],
                                        {
                                            weekday: 'short',
                                        },
                                    );
                                    break;
                                }
                                case '1M': {
                                    formattedLabel = date.toLocaleDateString(
                                        [],
                                        {
                                            day: 'numeric',
                                            month: 'short',
                                        },
                                    );
                                    break;
                                }
                                case '6M':
                                    formattedLabel = date.toLocaleDateString(
                                        [],
                                        {
                                            month: 'short',
                                            year: 'numeric',
                                        },
                                    );
                                    break;
                                case '1Y': {
                                    formattedLabel = date.toLocaleDateString(
                                        [],
                                        {
                                            month: 'short',
                                            year: 'numeric',
                                        },
                                    );
                                    break;
                                }
                                case '5Y': {
                                    formattedLabel = date.toLocaleDateString(
                                        [],
                                        {
                                            year: 'numeric',
                                        },
                                    );
                                    break;
                                }
                                default: {
                                    formattedLabel = date.toLocaleDateString();
                                    break;
                                }
                            }

                            if (formattedLabel === lastFormattedLabel) {
                                return null;
                            }

                            lastFormattedLabel = formattedLabel;
                            return formattedLabel;
                        },
                    },
                },
                y: {
                    position: 'right',
                    grid: { display: false },
                    ticks: {
                        callback: (value) => value.toFixed(2),
                    },
                },
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                },
            },
        },
    });
}

function initChart(data, timeframe, item) {
    const itemBars = data[timeframe]?.bars[item];
    if (!itemBars || itemBars.length < 3) {
        createChart('market-chart', [], timeframe);
        return;
    }
    createChart('market-chart', itemBars, timeframe);
}

function parseChartData(bars) {
    const labels = bars.map((bar) => new Date(bar.t));
    const prices = bars.map((bar) => bar.c);

    return { labels, prices };
}

function getTimeUnit(timeframe) {
    switch (timeframe) {
        case '1D':
            return 'minute';
        case '1W':
            return 'hour';
        case '1M':
            return 'day';
        case '6M':
            return 'day';
        case '1Y':
            return 'day';
        case '5Y':
            return 'week';
        default:
            return 'day';
    }
}

export { initChart };
