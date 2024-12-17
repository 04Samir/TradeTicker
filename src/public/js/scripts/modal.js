function showModal(modalId) {
    $('body').addClass('overflow-hidden');
    $(`#${modalId}`)
        .removeClass('hidden')
        .find('.modal-content')
        .removeClass('scale-95 opacity-0')
        .addClass('scale-100 opacity-100');

    if (modalId === 'search-modal') {
        $('#search-section').removeClass('max-w-sm').addClass('max-w-2xl');
        $('#search-container').addClass('w-full');
        $('#search-bar').addClass('w-full');
        $('#search-input').removeAttr('size').addClass('w-full').val('');
        $('#search-options').removeClass('hidden').addClass('flex');
        $('#navbar-items').addClass('hidden');
        $('#brand-name').addClass('hidden');
        $('#nav-body')
            .removeClass('justify-between')
            .addClass('justify-center')
            .removeClass('px-4 sm:px-6 lg:px-8');
    }
}

function hideModal(modalId) {
    $('body').removeClass('overflow-hidden');
    $(`#${modalId}`)
        .addClass('hidden')
        .find('.modal-content')
        .addClass('scale-95 opacity-0')
        .removeClass('scale-100 opacity-100');

    if (modalId === 'search-modal') {
        $('#search-section').addClass('max-w-sm').removeClass('max-w-2xl');
        $('#search-container').removeClass('w-full');
        $('#search-bar').removeClass('w-full');
        $('#search-input').attr('size', 10).removeClass('w-full').val('');
        $('#search-options').addClass('hidden').removeClass('flex');
        $('#navbar-items').removeClass('hidden');
        $('#brand-name').removeClass('hidden');
        $('#nav-body')
            .addClass('justify-between')
            .removeClass('justify-center')
            .addClass('px-4 sm:px-6 lg:px-8');
        $('.search-tab[data-category="All"]').trigger('click');
    }
}

function initModalEvents() {
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
}

export { hideModal, initModalEvents, showModal };
