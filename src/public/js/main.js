import { initMenuEvents } from './scripts/menu.js';
import { initModalEvents, showModal } from './scripts/modal.js';
import { initSearchEvents, updateSearchResults } from './scripts/search.js';
import { initTheme, isDarkMode } from './scripts/theme.js';
import {
    checkLoginState,
    initUserEvents,
    refreshUI,
    saveAccessToken,
} from './scripts/user.js';
import { initChart } from './scripts/viewer.js';

$(function () {
    initTheme();
    initSearchEvents();
    initModalEvents();
    initUserEvents();
    initMenuEvents();

    let loggedIn = checkLoginState();
    let darkMode = isDarkMode();

    $('#search-input').on('click', function (event) {
        if (event.isDefaultPrevented()) return;

        showModal('search-modal');
        updateSearchResults();

        const focusedInput = $('#search-input');
        if (focusedInput.length > 0) {
            focusedInput.trigger('focus');
        }
    });

    $('#user-button').on('click', function () {
        if (!loggedIn) {
            showModal('user-modal');
            $('#h-captcha-policies').toggleClass('hidden');
        } else {
            location.href = '/@me';
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
        $('#auth-form-error').text('');

        $.ajax({
            url: URL,
            type: METHOD,
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function (response) {
                saveAccessToken(response.access_token);
                refreshUI(true);
                loggedIn = true;
                const redirect = new URLSearchParams(
                    window.location.search,
                ).get('redirect');
                location.href = redirect || '/@me';
            },
            error: function (xhr) {
                $('#auth-form-error').text(xhr.responseJSON?.error?.message);
            },
        });
    });

    if ($('#hero-header').length > 0) {
        $(window).on('scroll', function () {
            const navbar = $('#navbar');
            if ($(this).scrollTop() > 10) {
                navbar.addClass('shadow-sm border-gray-500');
            } else {
                navbar.removeClass('shadow-sm border-gray-500');
            }
        });
    } else {
        $('#navbar').addClass('shadow-sm border-gray-500');
    }

    if ($('.h-captcha').length > 0) {
        let activeCaptcha = null;

        $('.h-captcha').each(function () {
            $(this).attr(
                'data-sitekey',
                '05ae038c-9720-4558-87f0-096e94c40c6e',
            );
            $(this).attr('data-theme', darkMode ? 'dark' : 'light');
            $(this).attr('data-size', 'invisible');
            $(this).attr('data-tabindex', -1);
            $(this).attr('data-callback', 'onCaptchaSubmit');
            $(this).attr('data-expired-callback', 'onCaptchaExpire');
            $(this).attr('data-chalexpired-callback', 'onCaptchaExpire');
            $(this).attr('data-close-callback', 'onCaptchaClose');
            $(this).attr('data-error-callback', 'onCaptchaError');
        });

        $('.h-captcha').on('click', function () {
            activeCaptcha = $(this).closest('form').attr('id');
        });

        function onCaptchaSubmit(token) {
            $(`#${activeCaptcha}`)
                .append(
                    `<input type="hidden" name="captcha" value="${token}" />`,
                )
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
    }

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

            const timeframes = Object.keys(categoryData || {});
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
            const marketItemsContainer = $('#market-items');
            marketItemsContainer.empty();

            const items = Object.keys(data[timeframe]?.bars || {}).sort();

            if (
                !marketItemOrder.length ||
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

            initChart(
                marketData[currentCategory],
                currentTimeframe,
                marketItemOrder[0],
            );
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
            initChart(
                marketData[currentCategory],
                currentTimeframe,
                selectedItem,
            );
        });

        $(document).on('click', '.market-item', function () {
            const selectedItem = $(this).data('item');
            if (selectedItem === $('.market-item.bg-blue-100').data('item'))
                return;

            initChart(
                marketData[currentCategory],
                currentTimeframe,
                selectedItem,
            );
        });

        $('#market-chart-type-toggle').on('click', function () {
            alert('Coming Soon!');
        });
    }
});
