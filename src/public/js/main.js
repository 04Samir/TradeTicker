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
});
