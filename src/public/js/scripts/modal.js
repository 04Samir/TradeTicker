function showModal(modalId) {
    $('body').addClass('overflow-hidden');
    $(`#${modalId}`).removeClass('hidden');

    if (modalId === 'search-modal') {
        $('#search-container').removeClass('max-w-sm').addClass('max-w-2xl');
        $('#search-bar').addClass('w-full');
        $('#search-input').removeAttr('size').addClass('w-full').val('');
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
        $('#search-container').addClass('max-w-sm').removeClass('max-w-2xl');
        $('#search-bar').removeClass('w-full');
        $('#search-input').attr('size', 10).removeClass('w-full').val('');
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
