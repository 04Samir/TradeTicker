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

    const data = fetchMarketData();

    function initialiseChart(data, timeframe) {
        const ctx = document.getElementById('market-chart').getContext('2d');
        const parsedData = parseChartData(data);

        if (marketChart) {
            marketChart.destroy();
        }

        const timeUnit = getTimeUnit(timeframe);

        marketChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: parsedData.labels,
                datasets: [
                    {
                        data: parsedData.prices,
                        borderColor: '#FF3B30',
                        backgroundColor: 'rgba(255, 59, 48, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3,
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
                                hour: 'HH:mm',
                                day: 'MMM d',
                                week: 'MMM d',
                                month: 'MMM yyyy',
                                year: 'yyyy',
                            },
                        },
                        grid: { display: false },
                        ticks: {
                            align: 'start',
                            source: 'data',
                            autoSkip: true,
                            maxRotation: 0,
                        },
                        min: parsedData.labels[0] || null,
                        max:
                            parsedData.labels[parsedData.labels.length - 1] ||
                            null,
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
                },
            },
        });
    }

    function parseChartData(bars) {
        const labels = bars.map((bar) => new Date(bar.t));
        const prices = bars.map((bar) => bar.c);

        return { labels, prices };
    }

    function getTimeUnit(timeframe) {
        switch (timeframe) {
            case '1D':
                return 'hour';
            case '1W':
                return 'day';
            case '1M':
                return 'week';
            case '6M':
            case '1Y':
                return 'month';
            case '5Y':
                return 'year';
            default:
                return 'day';
        }
    }

    function getFallbackTimeframe(currentTimeframe) {
        const fallbackOrder = {
            '5Y': '1Y',
            '1Y': '6M',
            '6M': '1M',
            '1M': '1W',
            '1W': '1D',
            '1D': '1D',
        };

        return fallbackOrder[currentTimeframe];
    }

    function populateMarketItems(data) {
        const marketItemsContainer = $('#market-items');
        marketItemsContainer.empty();

        const firstTimeframe = Object.keys(data)[0];
        const stocks = Object.keys(data[firstTimeframe].bars);

        stocks.forEach((stock, index) => {
            const button = $(`
            <button class="stock-item px-4 py-2 rounded-md font-medium ${index === 0 ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}" data-stock="${stock}">
                ${stock}
            </button>
        `);
            marketItemsContainer.append(button);
        });
    }

    function updateChart(category, timeframe, stock) {
        try {
            const categoryData = data[timeframe];
            const stockBars = categoryData?.bars[stock];

            if (!stockBars || stockBars.length < 3) {
                const fallbackTimeframe = getFallbackTimeframe(timeframe);

                if (fallbackTimeframe === timeframe) {
                    initialiseChart([], timeframe);
                    return;
                }
                return updateChart(category, fallbackTimeframe, stock);
            }

            initialiseChart(stockBars, timeframe);
        } catch (error) {
            console.error('Error updating chart data:', error);
        }
    }

    function fetchMarketData() {
        return $.ajax({
            url: '/api/markets/stocks/movers',
            type: 'GET',
            async: false,
            error: function (error) {
                console.error('Error Fetching Market Data:', error);
            },
        }).responseJSON.data;
    }

    const firstTimeframe = Object.keys(data)[0];
    const firstStock = Object.keys(data[firstTimeframe].bars)[0];

    populateMarketItems(data);
    updateChart(currentCategory, currentTimeframe, firstStock);

    $('.category-tab').on('click', function () {
        $('.category-tab')
            .removeClass('bg-blue-100 text-blue-600')
            .addClass('text-gray-600 hover:bg-gray-100');
        $(this)
            .addClass('bg-blue-100 text-blue-600')
            .removeClass('text-gray-600 hover:bg-gray-100');

        currentCategory = $(this).data('category');

        const firstStock = Object.keys(data[Object.keys(data)[0]].bars)[0];
        updateChart(currentCategory, currentTimeframe, firstStock);
    });

    $(document).on('click', '.stock-item', function () {
        $('.stock-item')
            .removeClass('bg-blue-100 text-blue-600')
            .addClass('text-gray-600 hover:bg-gray-100');
        $(this)
            .addClass('bg-blue-100 text-blue-600')
            .removeClass('text-gray-600 hover:bg-gray-100');

        const selectedStock = $(this).data('stock');
        updateChart(
            'Stocks',
            $('.timeframe-button.bg-blue-100').data('timeframe'),
            selectedStock,
        );
    });

    $('.timeframe-button').on('click', function () {
        $('.timeframe-button')
            .removeClass('bg-blue-100 text-blue-600')
            .addClass('text-gray-600 hover:bg-gray-100');
        $(this)
            .addClass('bg-blue-100 text-blue-600')
            .removeClass('text-gray-600 hover:bg-gray-100');

        currentTimeframe = $(this).data('timeframe');
        const selectedStock = $('.stock-item.bg-blue-100').data('stock');
        updateChart(currentCategory, currentTimeframe, selectedStock);
    });
});
