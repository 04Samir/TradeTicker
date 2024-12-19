function updateSearchResults() {
    const current = $('#search-input').val().trim();
    const category = $('.search-tab.border-blue-500').data('category');

    if (!current) {
        $('#search-results').html(`
            <p class="text-center font-medium text-gray-500 py-3">
                Type Something to Search!
            </p>
        `);
        return;
    }

    $.ajax({
        url: `/search`,
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
        data: { query: current },
        success: function (data) {
            let results = [];

            if (category === 'All') {
                results = data.quotes;
            } else {
                results = data.quotes.filter(function (item) {
                    return item.category === category;
                });
            }

            if (!results || results.length === 0) {
                $('#search-results').html(`
                    <p class="text-center font-medium text-gray-500 py-3">
                        No Symbols Match your Criteria!
                    </p>
                `);
            } else {
                $('#search-results').empty();
                results.forEach(function (item) {
                    const resultItem = `
                        <a href="/symbol/${item.symbol}" class="block">
                            <div class="p-3 hover:bg-gray-50 rounded-md cursor-pointer">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <span class="font-medium">${item.symbol}</span>
                                        <span class="ml-2 text-gray-500">${item.shortname}</span>
                                    </div>
                                    <span class="text-gray-500">${item.exchDisp}</span>
                                </div>
                            </div>
                        </a>
                    `;
                    $('#search-results').append(resultItem);
                });
            }
        },
        error: function (xhr) {
            console.error(xhr.responseJSON?.error?.message);
            $('#search-results').html(`
                <p class="text-center font-medium text-red-500 py-3">
                    Something Went Wrong! Please Try Again Later.
                </p>
            `);
        },
    });
}

$('#search-input').on('input', function () {
    updateSearchResults();
});

function initSearchEvents() {
    $('#search-container').on('submit', function (event) {
        const query = $('#search-input').val().trim();
        if (query !== '') {
            window.location.href = `/search?query=${encodeURIComponent(query)}`;
        } else {
            event.preventDefault();
        }
    });

    $('#search-icon').on('click', function (event) {
        event.preventDefault();

        const query = $('#search-input').val().trim();
        if (query !== '') {
            window.location.href = `/search?query=${encodeURIComponent(query)}`;
        }
    });

    $('#search-input').on('input', function () {
        updateSearchResults();
    });

    $('#search-clear').on('click', function () {
        $('#search-input').val('');
        updateSearchResults();
    });

    $('#search-close').on('click', function () {
        const event = jQuery.Event('keydown');
        event.key = 'Escape';
        $(document).trigger(event);
    });

    $('.search-tab').on('click', function (event) {
        event.preventDefault();
        $('.search-tab')
            .removeClass('border-blue-500 text-blue-600')
            .addClass(
                'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            );
        $(this)
            .addClass('border-blue-500 text-blue-600')
            .removeClass(
                'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            );

        updateSearchResults();
    });

    $('.filter-button').on('click', function () {
        const category = $(this).data('category');

        $('.filter-button')
            .removeClass('bg-blue-600 text-white hover:bg-blue-700')
            .addClass('bg-gray-200 text-gray-800 hover:bg-blue-100');

        $(this)
            .removeClass('bg-gray-200 text-gray-800 hover:bg-blue-100')
            .addClass('bg-blue-600 text-white hover:bg-blue-700');

        if (category === 'All') {
            $('.filter-item').show();
        } else {
            $('.filter-item')
                .hide()
                .filter(`[data-category="${category}"]`)
                .show();
        }
    });

    $('.filter-button[data-category="All"]').trigger('click');
}

export { initSearchEvents, updateSearchResults };
