import { hideModal, showModal } from './scripts/modal.js';
import {
    initialiseSearchEvents,
    updateSearchResults,
} from './scripts/search.js';
import { disableDarkMode, enableDarkMode } from './scripts/theme.js';

$(function () {
    $('.modal-backdrop').on('click', function () {
        hideModal($(this).closest('.modal').attr('id'));
    });

    $(document).on('keydown', function (event) {
        if (event.key === 'Escape') {
            $('.modal:not(.hidden)').each(function () {
                hideModal($(this).attr('id'));

                const focusedInput = $('input:focus');
                if (focusedInput.length > 0) {
                    focusedInput.trigger('blur');
                }
            });
        }
    });

    $('#user-button').on('click', function () {
        showModal('user-modal');
    });

    $('.auth-form-toggle').on('click', function (event) {
        event.preventDefault();

        $('#login-form').toggleClass('hidden');
        $('#register-form').toggleClass('hidden');

        if (!$('#login-form').hasClass('hidden')) {
            $('#auth-form-title').text('Welcome Back!');
            $('.auth-form-toggle').text('Register');
        } else {
            $('#auth-form-title').text('Create an Account');
            $('.auth-form-toggle').text('Login');
        }
    });

    $('form').on('submit', function (event) {
        const formId = $(this).attr('id');

        if (formId !== 'login-form' && formId !== 'register-form') return;
        event.preventDefault();

        let formData = {};
        $(this)
            .find('input')
            .each(function () {
                const inputName = $(this).attr('name');
                const inputValue = $(this).val();
                formData[inputName] = inputValue;
            });

        const URL = $(this).attr('action');
        const METHOD = $(this).attr('method') || 'POST';

        $.ajax({
            url: URL,
            type: METHOD,
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function (response) {
                console.log(
                    `${formId}: ${response.code} -> ${response.message}`,
                );
                alert(response.message || 'Request Successful');
            },
            error: function (xhr, status, error) {
                console.log(
                    `${formId}: ${status} -> ${JSON.stringify(xhr.responseJSON?.error, null, 4)}`,
                );
                alert(error || 'An Error Occurred.');
            },
        });
    });

    $('#search-input').on('click', function (event) {
        if (event.isDefaultPrevented()) return;

        showModal('search-modal');
        updateSearchResults();

        const focusedInput = $('#search-input');
        if (focusedInput.length > 0) {
            focusedInput.trigger('focus');
        }
    });

    initialiseSearchEvents();

    let menuClicked = false;

    $(document).on('click', function (event) {
        if (!$(event.target).closest('#menu-button, #menu-dropdown').length) {
            $('#menu-dropdown').addClass('hidden');
            menuClicked = false;
        }
    });

    $('#menu-button').on('click', function () {
        menuClicked = !menuClicked;
        $('#menu-dropdown').toggleClass('hidden', !menuClicked);
    });

    $('#menu-button').on('mouseenter', function () {
        if (!menuClicked) {
            $('#menu-dropdown').removeClass('hidden');
        }
    });

    $('#menu-button').on('mouseleave', function () {
        setTimeout(function () {
            if (!menuClicked && !$('#menu-dropdown').is(':hover')) {
                $('#menu-dropdown').addClass('hidden');
            }
        }, 200);
    });

    $('#menu-dropdown').on('mouseleave', function () {
        setTimeout(function () {
            if (!menuClicked && !$('#menu-button').is(':hover')) {
                $('#menu-dropdown').addClass('hidden');
            }
        }, 200);
    });

    if (localStorage.getItem('theme') === 'dark') {
        enableDarkMode();
    } else {
        disableDarkMode();
    }

    $('#theme-mode-toggle').on('click', function () {
        if (localStorage.getItem('theme') === 'dark') {
            disableDarkMode();
        } else {
            enableDarkMode();
        }
    });

    let marketChart;
    let currentCategory = $('.category-tab.text-blue-600').data('category');
    let currentTimeframe = $('.timeframe-button.bg-blue-100').data('timeframe');
    let marketItemOrder = [];

    const stockData = fetchMarketData('stocks');
    const cryptoData = fetchMarketData('crypto');

    function getCurrentCategoryData() {
        return currentCategory.toLowerCase() === 'stocks'
            ? stockData
            : cryptoData;
    }

    function initialiseChart(data, timeframe) {
        const ctx = document.getElementById('market-chart').getContext('2d');
        const parsedData = parseChartData(data);

        if (marketChart) {
            marketChart.destroy();
        }

        const timeUnit = getTimeUnit(timeframe);
        const firstPrice = parsedData.prices[0];
        const lastPrice = parsedData.prices[parsedData.prices.length - 1];
        const isPriceUp = lastPrice > firstPrice;

        let lastFormattedLabel = '';

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
                                        formattedLabel =
                                            date.toLocaleDateString([], {
                                                weekday: 'short',
                                            });
                                        break;
                                    }
                                    case '1M': {
                                        formattedLabel =
                                            date.toLocaleDateString([], {
                                                day: 'numeric',
                                                month: 'short',
                                            });
                                        break;
                                    }
                                    case '6M':
                                        formattedLabel =
                                            date.toLocaleDateString([], {
                                                month: 'short',
                                                year: 'numeric',
                                            });
                                        break;
                                    case '1Y': {
                                        formattedLabel =
                                            date.toLocaleDateString([], {
                                                month: 'short',
                                                year: 'numeric',
                                            });
                                        break;
                                    }
                                    case '5Y': {
                                        formattedLabel =
                                            date.toLocaleDateString([], {
                                                year: 'numeric',
                                            });
                                        break;
                                    }
                                    default: {
                                        formattedLabel =
                                            date.toLocaleDateString();
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

    function parseChartData(bars) {
        const labels = bars.map((bar) => new Date(bar.t));
        const prices = bars.map((bar) => bar.c);

        return { labels, prices };
    }

    function populateMarketItems(data, timeframe) {
        const marketItemsContainer = $('#market-items');
        marketItemsContainer.empty();

        const items = Object.keys(data[timeframe]?.bars || {}).sort();

        if (
            marketItemOrder.length === 0 ||
            currentCategory.toLowerCase() === 'crypto'
        ) {
            marketItemOrder = items;
        }

        marketItemOrder.forEach((item, index) => {
            const bars = data[timeframe]?.bars[item];
            if (!bars) return;

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

            const itemHTML = `
                <div class="market-item p-4 border border-gray-200 rounded-md shadow-sm flex flex-col space-y-2 ${index === 0 ? 'bg-blue-100' : 'bg-white hover:bg-gray-100'} cursor-pointer text-gray-800" data-item="${item}">
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

        $('.market-item')
            .first()
            .addClass('bg-blue-100')
            .removeClass('bg-white hover:bg-gray-100');
    }

    function updateChart(timeframe, item) {
        try {
            const categoryData = getCurrentCategoryData();
            const itemBars = categoryData[timeframe]?.bars[item];

            if (!itemBars || itemBars.length < 3) {
                initialiseChart([], timeframe);
                return;
            }

            initialiseChart(itemBars, timeframe);

            $('.market-item')
                .removeClass('bg-blue-100')
                .addClass('bg-white hover:bg-gray-100');
            $(`.market-item[data-item="${item}"]`)
                .addClass('bg-blue-100')
                .removeClass('bg-white hover:bg-gray-100');
        } catch (error) {
            console.error('Error updating chart data:', error);
        }
    }

    function fetchMarketData(type) {
        return $.ajax({
            url: `/api/markets/${type}/movers`,
            type: 'GET',
            async: false,
            error: function (error) {
                console.error('Error Fetching Market Data:', error);
            },
        }).responseJSON.data;
    }

    const firstTimeframe = Object.keys(stockData)[0];
    populateMarketItems(stockData, firstTimeframe);
    updateChart(firstTimeframe, marketItemOrder[0]);

    $('.category-tab').on('click', function () {
        $('.category-tab')
            .removeClass('border-b-2 border-blue-600 text-blue-600')
            .addClass('text-gray-600 hover:text-gray-800');

        $(this)
            .addClass('border-b-2 border-blue-600 text-blue-600')
            .removeClass('text-gray-600 hover:text-gray-800');

        currentCategory = $(this).data('category');
        const currentData = getCurrentCategoryData();
        marketItemOrder = [];

        populateMarketItems(currentData, currentTimeframe);
        const firstItem = marketItemOrder[0];
        updateChart(currentTimeframe, firstItem);
    });

    $(document).on('click', '.market-item', function () {
        const selectedItem = $(this).data('item');
        updateChart(currentTimeframe, selectedItem);
    });

    $('.timeframe-button').on('click', function () {
        const newTimeframe = $(this).data('timeframe');
        if (newTimeframe === currentTimeframe) return;

        $('.timeframe-button')
            .removeClass('bg-blue-100 text-blue-600')
            .addClass('text-gray-600 hover:bg-gray-100');
        $(this)
            .addClass('bg-blue-100 text-blue-600')
            .removeClass('text-gray-600 hover:bg-gray-100');

        currentTimeframe = newTimeframe;
        const selectedItem = $('.market-item.bg-blue-100').data('item');

        populateMarketItems(getCurrentCategoryData(), currentTimeframe);
        updateChart(currentTimeframe, selectedItem);
    });
});
