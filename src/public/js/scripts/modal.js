function showModal(modalId) {
    $('body').addClass('overflow-hidden');
    $(`#${modalId}`).removeClass('hidden');

    if (modalId === 'search-modal') {
        $('#search-section').removeClass('max-w-sm').addClass('max-w-2xl');
        $('#search-container').addClass('w-full');
        $('#search-bar').addClass('w-full');
        $('#search-input').removeAttr('size').addClass('w-full').val('');
        $('#search-options').removeClass('hidden').addClass('flex');
        $('#navbar-items').addClass('hidden');
        $('#brand-name').addClass('hidden');
        $('#navbar')
            .removeClass('justify-between')
            .addClass('justify-center')
            .removeClass('px-4 sm:px-6 lg:px-8');
    }
}

function hideModal(modalId) {
    $('body').removeClass('overflow-hidden');
    $(`#${modalId}`).addClass('hidden');

    if (modalId === 'search-modal') {
        $('#search-section').addClass('max-w-sm').removeClass('max-w-2xl');
        $('#search-container').removeClass('w-full');
        $('#search-bar').removeClass('w-full');
        $('#search-input').attr('size', 10).removeClass('w-full').val('');
        $('#search-options').addClass('hidden').removeClass('flex');
        $('#navbar-items').removeClass('hidden');
        $('#brand-name').removeClass('hidden');
        $('#navbar')
            .addClass('justify-between')
            .removeClass('justify-center')
            .addClass('px-4 sm:px-6 lg:px-8');
        $('.search-tab[data-category="All"]').trigger('click');
    }
}

export { showModal, hideModal };
