import { hideModal, showModal } from './scripts/modal.js';
import {
    initialiseSearchEvents,
    updateSearchResults,
} from './scripts/search.js';
import { disableDarkMode, enableDarkMode } from './scripts/theme.js';

$(function () {
    $('.modal-backdrop').on('click', function () {
        hideModal($(this).closest('.modal').attr('id'));

        if ($(this).closest('.modal').attr('id') === 'user-modal') {
            $('#h-captcha-policies').toggleClass('hidden');
        }
    });

    $(document).on('keydown', function (event) {
        if (event.key === 'Escape') {
            $('.modal:not(.hidden)').each(function () {
                hideModal($(this).attr('id'));

                if ($(this).attr('id') === 'user-modal') {
                    $('#h-captcha-policies').toggleClass('hidden');
                }

                const focusedInput = $('input:focus');
                if (focusedInput.length > 0) {
                    focusedInput.trigger('blur');
                }
            });
        }
    });

    if (localStorage.getItem('theme') === null) {
        localStorage.setItem(
            'theme',
            window.matchMedia &&
                window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light',
        );
    }
    let darkMode = localStorage.getItem('theme') === 'dark';

    let loggedIn = false;

    function saveAccessToken(token) {
        localStorage.setItem('access_token', token);
    }

    function getAccessToken() {
        return localStorage.getItem('access_token');
    }

    function refreshUI(isLoggedIn) {
        if (isLoggedIn) {
            $('#user-button').html(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-gray-600">
                    <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
                </svg>
            `);
        } else {
            $('#user-button').html(`
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-gray-600">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
            `);
        }
        loggedIn = isLoggedIn;
    }

    function checkLoginState() {
        const token = getAccessToken();
        if (token) {
            $.ajax({
                url: '/api/auth/@me',
                type: 'GET',
                headers: { Authorization: `Bearer ${token}` },
                success: function () {
                    refreshUI(true);
                },
                error: function () {
                    refreshAccessToken();
                },
            });
        } else {
            refreshUI(false);
        }
    }

    function refreshAccessToken() {
        $.ajax({
            url: '/api/auth/refresh',
            type: 'POST',
            success: function (response) {
                if (response.access_token) {
                    saveAccessToken(response.access_token);
                    refreshUI(true);
                } else {
                    refreshUI(false);
                }
            },
            error: function () {
                localStorage.removeItem('access_token');
                refreshUI(false);
            },
        });
    }

    $('.h-captcha').each(function () {
        $(this).attr('data-sitekey', '05ae038c-9720-4558-87f0-096e94c40c6e');
        $(this).attr('data-theme', darkMode ? 'dark' : 'light');
        $(this).attr('data-size', 'invisible');
        $(this).attr('data-tabindex', -1);
        $(this).attr('data-callback', 'onCaptchaSubmit');
        $(this).attr('data-expired-callback', 'onCaptchaExpire');
        $(this).attr('data-chalexpired-callback', 'onCaptchaExpire');
        $(this).attr('data-close-callback', 'onCaptchaClose');
        $(this).attr('data-error-callback', 'onCaptchaError');
    });

    let activeCaptcha;

    $('.h-captcha').on('click', function () {
        activeCaptcha = $(this).closest('form').attr('id');
    });

    function onCaptchaSubmit(token) {
        $(`#${activeCaptcha}`)
            .append(`<input type="hidden" name="captcha" value="${token}" />`)
            .trigger('submit');

        activeCaptcha = null;
    }
    window.onCaptchaSubmit = onCaptchaSubmit;

    function onCaptchaExpire() {
        activeCaptcha = null;
    }
    window.onCaptchaExpire = onCaptchaExpire;

    function onCaptchaClose() {
        activeCaptcha = null;
    }
    window.onCaptchaClose = onCaptchaClose;

    function onCaptchaError() {
        activeCaptcha = null;
    }
    window.onCaptchaError = onCaptchaError;

    $('#user-button').on('click', function () {
        if (!loggedIn) {
            showModal('user-modal');
            $('#h-captcha-policies').toggleClass('hidden');
        } else {
            location.href = '/@me';
        }
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
                saveAccessToken(response.access_token);
                refreshUI(true);
                location.reload();
            },
            error: function (xhr, status, error) {
                console.log(
                    `${formId}: ${status} -> ${JSON.stringify(xhr.responseJSON?.error, null, 4)}`,
                );
                alert(error || 'An Error Occurred.');
            },
        });
    });
    checkLoginState();

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

    if (darkMode) {
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
    let currentCategory;
    let currentTimeframe;
    let marketItemOrder = [];

    const marketData = {};
    const marketTypes = ['stocks', 'crypto'];

    marketTypes.forEach((type) => {
        marketData[type] = fetchMarketData(type);
    });

    function populateDynamicContent() {
        const categoriesContainer = $('#market-categories');
        categoriesContainer.empty();
        marketTypes.forEach((type, index) => {
            const categoryHTML = `
            <div class="category-tab pb-2 px-4 text-base font-medium cursor-pointer ${index === 0 ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}" data-category="${type}">
                ${type.charAt(0).toUpperCase() + type.slice(1)}
            </div>`;
            categoriesContainer.append(categoryHTML);
        });

        currentCategory = marketTypes[0];
        populateTimeframes(marketData[currentCategory]);
    }

    function populateTimeframes(categoryData) {
        const timeframesContainer = $('#market-timeframes');
        timeframesContainer.empty();

        const timeframes = Object.keys(categoryData || {});
        timeframes.forEach((frame, index) => {
            const timeframeHTML = `
                <button class="timeframe-button px-3 py-1 rounded-md text-sm font-medium ${
                    index === 0
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100'
                }" data-timeframe="${frame}">
                    ${frame}
                </button>
            `;
            timeframesContainer.append(timeframeHTML);
        });

        currentTimeframe = timeframes[0];
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

    function updateChart(timeframe, item) {
        try {
            const itemBars = marketData[currentCategory][timeframe]?.bars[item];

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

    populateDynamicContent();
    populateMarketItems(marketData[currentCategory], currentTimeframe);
    updateChart(currentTimeframe, marketItemOrder[0]);

    $(document).on('click', '.category-tab', function () {
        const selectedCategory = $(this).data('category');
        if (selectedCategory === currentCategory) return;

        $('.category-tab')
            .removeClass('border-b-2 border-blue-600 text-blue-600')
            .addClass('text-gray-600 hover:text-gray-800');
        $(this)
            .addClass('border-b-2 border-blue-600 text-blue-600')
            .removeClass('text-gray-600 hover:text-gray-800');

        currentCategory = selectedCategory;
        marketItemOrder = [];

        populateTimeframes(marketData[currentCategory]);
        populateMarketItems(marketData[currentCategory], currentTimeframe);
        updateChart(currentTimeframe, marketItemOrder[0]);
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

        populateMarketItems(marketData[currentCategory], currentTimeframe);
        updateChart(currentTimeframe, selectedItem);
    });

    $(document).on('click', '.market-item', function () {
        const selectedItem = $(this).data('item');
        if (selectedItem === $('.market-item.bg-blue-100').data('item')) return;

        updateChart(currentTimeframe, selectedItem);
    });

    $('#market-chart-type-toggle').on('click', function () {
        alert('Not Implemented!');
    });
});
