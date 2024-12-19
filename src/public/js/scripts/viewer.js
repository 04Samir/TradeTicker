const charts = {};

function createChart(canvasId, data, timeframe) {
    const ctx = $('#' + canvasId)[0].getContext('2d');
    const parsedData = parseChartData(data);

    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }

    const timeUnit = getTimeUnit(timeframe);
    const firstPrice = parsedData.prices[0];
    const lastPrice = parsedData.prices[parsedData.prices.length - 1];
    const isPriceUp = lastPrice > firstPrice;

    let lastFormattedLabel = '';

    // eslint-disable-next-line no-undef
    charts[canvasId] = new Chart(ctx, {
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

function initChart(elemID, bars, timeframe) {
    if (!bars || bars.length < 3) {
        createChart(elemID, [], timeframe);
        return;
    }

    createChart(elemID, bars, timeframe);
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

function initChartEvents() {
    $('#chart-type-toggle').on('click', function () {
        alert('Coming Soon!');
    });

    if ($('#market-overview').length > 0) {
        let currentCategory;
        let currentTimeframe;
        let marketItemOrder = [];

        const marketData = {};
        const marketTypes = ['stocks', 'crypto'];

        marketTypes.forEach((type) => {
            marketData[type] = fetchMarketData(type);
        });

        populateDynamicContent();
        populateMarketItems(marketData[currentCategory], currentTimeframe);

        function populateDynamicContent() {
            const categoriesContainer = $('#market-categories');
            categoriesContainer.empty();
            marketTypes.forEach((type, index) => {
                const categoryHTML = `
                    <div class="market-category-tab pb-2 px-4 text-base font-medium cursor-pointer ${index === 0 ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}" data-category="${type}">
                        ${type.charAt(0).toUpperCase() + type.slice(1)}
                    </div>
                `;
                categoriesContainer.append(categoryHTML);
            });

            currentCategory = marketTypes[0];
            populateTimeframes(marketData[currentCategory]);
        }

        function populateTimeframes(categoryData, timeframe = null) {
            const timeframesContainer = $('#market-timeframes');
            timeframesContainer.empty();

            const timeframes = Object.keys(
                categoryData[Object.keys(categoryData)[0]].bars,
            );
            timeframes.forEach((frame) => {
                const timeframeHTML = `
                    <button class="timeframe-button px-3 py-1 rounded-md text-sm font-medium ${frame === (timeframe || timeframes[0]) ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}" data-timeframe="${frame}">
                        ${frame}
                    </button>
                `;
                timeframesContainer.append(timeframeHTML);
            });

            currentTimeframe =
                timeframe && timeframes.includes(timeframe)
                    ? timeframe
                    : timeframes[0];
        }

        function populateMarketItems(data, timeframe) {
            let currentItem;
            if (!marketItemOrder.length) {
                marketItemOrder = Object.keys(data);
                currentItem = marketItemOrder[0];
            } else {
                currentItem = $('.market-item.bg-blue-100').data('item');
            }

            const marketItemsContainer = $('#market-items');
            marketItemsContainer.empty();

            marketItemOrder.forEach((item) => {
                const bars = data[item]?.bars?.[timeframe];
                if (!bars || bars.length === 0) return;

                const startBar = bars[0];
                const latestBar = bars[bars.length - 1];

                const openingPrice = parseFloat(startBar.c);
                const latestPrice = parseFloat(latestBar.c);

                const valueChange = (latestPrice - openingPrice).toFixed(2);
                const percentageChange = openingPrice
                    ? (
                          ((latestPrice - openingPrice) / openingPrice) *
                          100
                      ).toFixed(2)
                    : 0;

                const priceLabel = latestPrice
                    .toFixed(2)
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                const valueLabel = valueChange.replace(
                    /\B(?=(\d{3})+(?!\d))/g,
                    ',',
                );
                const percentageLabel = percentageChange.replace(
                    /\B(?=(\d{3})+(?!\d))/g,
                    ',',
                );

                const itemHTML = `
                    <div class="market-item p-4 border border-gray-200 rounded-md shadow-sm flex flex-col space-y-2 bg-white hover:bg-gray-100 cursor-pointer text-gray-800" data-item="${item}">
                        <div class="text-xl font-semibold">${item}</div>
                        <div class="text-sm flex justify-between">
                            <span>$${priceLabel} USD</span>
                            <span class="${valueChange > 0 ? 'text-green-600' : 'text-red-600'} font-medium">
                                ${valueChange > 0 ? '+' : ''}${valueLabel} (${percentageLabel}%)
                            </span>
                        </div>
                    </div>
                `;
                marketItemsContainer.append(itemHTML);
            });

            $(`.market-item[data-item="${currentItem}"]`)
                .addClass('bg-blue-100')
                .removeClass('bg-white hover:bg-gray-100');

            initChart(
                'market-chart',
                data[currentItem].bars[timeframe],
                currentTimeframe,
            );
        }

        function fetchMarketData(type) {
            return $.ajax({
                url: `${window.BASE_PATH}/api/markets/${type}/movers`,
                type: 'GET',
                async: false,
                error: function (xhr) {
                    console.error(xhr.responseJSON?.error?.message);
                },
            }).responseJSON.data;
        }

        $(document).on('click', '.market-category-tab', function () {
            const selectedCategory = $(this).data('category');
            if (selectedCategory === currentCategory) return;

            $('.market-category-tab')
                .removeClass('border-b-2 border-blue-600 text-blue-600')
                .addClass('text-gray-600 hover:text-gray-800');
            $(this)
                .addClass('border-b-2 border-blue-600 text-blue-600')
                .removeClass('text-gray-600 hover:text-gray-800');

            currentCategory = selectedCategory;
            marketItemOrder = [];

            populateTimeframes(marketData[currentCategory], currentTimeframe);
            populateMarketItems(marketData[currentCategory], currentTimeframe);
        });

        $(document).on('click', '.market-item', function () {
            const selectedItem = $(this).data('item');
            if (selectedItem === $('.market-item.bg-blue-100').data('item'))
                return;

            const itemData =
                marketData[currentCategory][selectedItem]?.bars[
                    currentTimeframe
                ];

            if (!itemData || itemData.length === 0) {
                return;
            }

            $('.market-item')
                .removeClass('bg-blue-100')
                .addClass('bg-white hover:bg-gray-100');
            $(this)
                .addClass('bg-blue-100')
                .removeClass('bg-white hover:bg-gray-100');

            initChart('market-chart', itemData, currentTimeframe);
        });

        $(document).on('click', '.timeframe-button', function () {
            const selectedTimeframe = $(this).data('timeframe');
            if (selectedTimeframe === currentTimeframe) return;

            $('.timeframe-button')
                .removeClass('bg-blue-100 text-blue-600')
                .addClass('text-gray-600 hover:bg-gray-100');
            $(this)
                .addClass('bg-blue-100 text-blue-600')
                .removeClass('text-gray-600 hover:bg-gray-100');

            currentTimeframe = selectedTimeframe;
            const selectedItem = $('.market-item.bg-blue-100').data('item');
            const itemData =
                marketData[currentCategory]?.[selectedItem]?.bars?.[
                    currentTimeframe
                ];

            if (!itemData || itemData.length === 0) {
                return;
            }

            populateMarketItems(marketData[currentCategory], currentTimeframe);
            initChart('market-chart', itemData, currentTimeframe);
        });
    }

    if ($('#symbol-chart').length > 0) {
        let currentTimeframe;

        const symbol = $('#symbol-ticker').text();
        const symbolTicker = $('#symbol-ticker').data('ticker');
        const symbolData = fetchSymbolData();

        populateTimeframes();
        populateData();

        function populateTimeframes() {
            const timeframesContainer = $('#symbol-timeframes');
            timeframesContainer.empty();

            const timeframes = Object.keys(symbolData[symbol].bars);
            timeframes.forEach((frame, index) => {
                const timeframeHTML = `
                    <button class="timeframe-button px-3 py-1 rounded-md text-sm font-medium ${index === 0 ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}" data-timeframe="${frame}">
                        ${frame}
                    </button>
                `;
                timeframesContainer.append(timeframeHTML);
            });

            currentTimeframe = timeframes[0];

            initChart(
                'symbol-chart',
                symbolData[symbol].bars[currentTimeframe],
                currentTimeframe,
            );
        }

        function populateData() {
            const bars = symbolData[symbol].bars[currentTimeframe];
            if (!bars || bars.length === 0) return;

            const startBar = bars[0];
            const latestBar = bars[bars.length - 1];

            const openingPrice = parseFloat(startBar.c);
            const latestPrice = parseFloat(latestBar.c);

            const valueChange = (latestPrice - openingPrice).toFixed(2);
            const percentageChange = openingPrice
                ? (((latestPrice - openingPrice) / openingPrice) * 100).toFixed(
                      2,
                  )
                : 0;

            const priceLabel = latestPrice
                .toFixed(2)
                .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            const valueLabel = valueChange.replace(
                /\B(?=(\d{3})+(?!\d))/g,
                ',',
            );
            const percentageLabel = percentageChange.replace(
                /\B(?=(\d{3})+(?!\d))/g,
                ',',
            );

            $('#symbol-price').text(`$${priceLabel} USD`);
            $('#symbol-change').text(
                `${valueChange > 0 ? '+' : ''}${valueLabel} (${percentageLabel}%)`,
            );
            $('#symbol-change').removeClass('text-green-600 text-red-600');
            if (valueChange > 0) {
                $('#symbol-change').addClass('text-green-600');
            } else {
                $('#symbol-change').addClass('text-red-600');
            }
        }

        function fetchSymbolData() {
            return $.ajax({
                url: `${window.BASE_PATH}/api/markets/bars?symbols=${symbolTicker}`,
                type: 'GET',
                async: false,
                error: function (xhr) {
                    console.error(xhr.responseJSON?.error?.message);
                },
            }).responseJSON.data;
        }

        $(document).on('click', '.timeframe-button', function () {
            const selectedTimeframe = $(this).data('timeframe');
            if (selectedTimeframe === currentTimeframe) return;

            $('.timeframe-button')
                .removeClass('bg-blue-100 text-blue-600')
                .addClass('text-gray-600 hover:bg-gray-100');
            $(this)
                .addClass('bg-blue-100 text-blue-600')
                .removeClass('text-gray-600 hover:bg-gray-100');

            currentTimeframe = selectedTimeframe;
            const itemData = symbolData[symbol].bars[currentTimeframe];

            if (!itemData || itemData.length === 0) {
                return;
            }

            initChart('symbol-chart', itemData, currentTimeframe);
            populateData();
        });
    }

    if ($('#watchlist-charts').length > 0) {
        let currentTimeframes = {};

        const symbols = $('#watchlist-charts canvas')
            .map(function () {
                return $(this).data('symbol');
            })
            .get();

        console.log('Symbols:', symbols);

        const symbolData = fetchSymbolData();

        populateTimeframes();

        function populateTimeframes() {
            symbols.forEach(function (symbol) {
                const timeframesContainer = $(`#timeframes-${symbol}`);
                timeframesContainer.empty();

                const symbolKey = symbol.replace('-', '/');
                const timeframes = Object.keys(symbolData[symbolKey].bars);
                timeframes.forEach((frame, index) => {
                    const timeframeHTML = `
                        <button class="timeframe-button px-3 py-1 rounded-md text-sm font-medium ${index === 0 ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}" data-timeframe="${frame}" data-symbol="${symbol}">
                            ${frame}
                        </button>
                    `;
                    timeframesContainer.append(timeframeHTML);
                });

                currentTimeframes[symbol] = timeframes[0];
                initChart(
                    `chart-${symbol}`,
                    symbolData[symbolKey].bars[currentTimeframes[symbol]],
                    currentTimeframes[symbol],
                );
            });
        }

        function fetchSymbolData() {
            return $.ajax({
                url: `${window.BASE_PATH}/api/markets/bars?symbols=${symbols.join(',')}`,
                type: 'GET',
                async: false,
                error: function (xhr) {
                    console.error(xhr.responseJSON?.error?.message);
                },
            }).responseJSON.data;
        }

        $(document).on('click', '.timeframe-button', function () {
            const selectedTimeframe = $(this).data('timeframe');
            const symbol = $(this).data('symbol');
            const symbolKey = symbol.replace('-', '/');
            if (selectedTimeframe === currentTimeframes[symbolKey]) return;

            $('.timeframe-button')
                .removeClass('bg-blue-100 text-blue-600')
                .addClass('text-gray-600 hover:bg-gray-100');
            $(this)
                .addClass('bg-blue-100 text-blue-600')
                .removeClass('text-gray-600 hover:bg-gray-100');

            currentTimeframes[symbolKey] = selectedTimeframe;
            const itemData =
                symbolData[symbolKey].bars[currentTimeframes[symbolKey]];

            if (!itemData || itemData.length === 0) {
                return;
            }

            initChart(
                `chart-${symbol}`,
                itemData,
                currentTimeframes[symbolKey],
            );
        });
    }
}

export { initChartEvents };
