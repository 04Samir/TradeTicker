import { hideModal, showModal } from './scripts/modal.js';
import {
    initialiseSearchEvents,
    updateSearchResults,
} from './scripts/search.js';

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

    $('#search-input').on('click', function (event) {
        if (event.isDefaultPrevented()) return;

        showModal('search-modal');
        updateSearchResults();

        const focusedInput = $('#search-input');
        if (focusedInput.length > 0) {
            focusedInput.trigger('focus');
        }
    });

    $(document).on('click', function (event) {
        if (!$(event.target).closest('#menu-button, #menu-dropdown').length) {
            $('#menu-dropdown').addClass('hidden');
        }
    });

    initialiseSearchEvents();
});
