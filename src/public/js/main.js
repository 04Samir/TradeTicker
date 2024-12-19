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
import { initChartEvents } from './scripts/viewer.js';

$(function () {
    initTheme();
    initSearchEvents();
    initModalEvents();
    initUserEvents();
    initMenuEvents();
    initChartEvents();

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
        } else {
            location.href = `${window.BASE_PATH}/@me`;
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
        $('#auth-form-alert').addClass('hidden').removeClass('flex');
        $('#auth-form-error').text('');

        $.ajax({
            url: URL,
            type: METHOD,
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function (data) {
                saveAccessToken(data.access_token);
                refreshUI(true);
                loggedIn = true;
                const redirect = new URLSearchParams(
                    window.location.search,
                ).get('redirect');
                location.href = redirect || `${window.BASE_PATH}/@me`;
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

    $('#symbol-watchlist-toggle').on('click', function () {
        if (!loggedIn) {
            $('#auth-form-alert').removeClass('hidden').addClass('flex');
            $('#user-button').trigger('click');
        }

        const symbol = $(this).data('ticker');
        const URL = `${window.BASE_PATH}/api/@me/watchlist/${symbol}`;
        const METHOD = 'PUT';

        $.ajax({
            url: URL,
            type: METHOD,
            contentType: 'application/json',
            success: function (data) {
                $('#symbol-watchlist-toggle').empty();

                if (data.code === 200) {
                    $('#symbol-watchlist-toggle').append(`
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                            <path stroke-linecap="rou</svg>nd" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                        </svg>
                    `);
                } else if (data.code === 201) {
                    $('#symbol-watchlist-toggle').append(`
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
                            <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
                        </svg>
                    `);
                } else {
                    console.error(data);
                }
            },
            error: function (xhr) {
                console.log(xhr.responseJSON?.error?.message);
            },
        });
    });
});
