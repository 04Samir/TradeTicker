function updateSearchResults(category) {
    const data = {
        indices: [
            {
                symbol: 'DJI',
                name: 'Dow Jones Industrial Average',
                market: 'USA',
            },
            { symbol: 'SPX', name: 'S&P 500', market: 'USA' },
            { symbol: 'IXIC', name: 'NASDAQ Composite', market: 'USA' },
        ],
        stocks: [
            { symbol: 'AAPL', name: 'Apple Inc.', market: 'NASDAQ' },
            { symbol: 'GOOGL', name: 'Alphabet Inc.', market: 'NASDAQ' },
            { symbol: 'AMZN', name: 'Amazon.com Inc.', market: 'NASDAQ' },
        ],
        etfs: [
            {
                symbol: 'SPY',
                name: 'SPDR S&P 500 ETF Trust',
                market: 'NYSEARCA',
            },
            {
                symbol: 'IVV',
                name: 'iShares Core S&P 500 ETF',
                market: 'NYSEARCA',
            },
            { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', market: 'NYSEARCA' },
        ],
        crypto: [
            { symbol: 'BTC', name: 'Bitcoin', market: 'Crypto' },
            { symbol: 'ETH', name: 'Ethereum', market: 'Crypto' },
            { symbol: 'BNB', name: 'Binance Coin', market: 'Crypto' },
        ],
        forex: [
            { symbol: 'EUR/USD', name: 'Euro/US Dollar', market: 'Forex' },
            {
                symbol: 'GBP/USD',
                name: 'British Pound/US Dollar',
                market: 'Forex',
            },
            {
                symbol: 'USD/JPY',
                name: 'US Dollar/Japanese Yen',
                market: 'Forex',
            },
        ],
        futures: [
            { symbol: 'ES', name: 'E-mini S&P 500', market: 'CME' },
            { symbol: 'NQ', name: 'E-mini NASDAQ-100', market: 'CME' },
            { symbol: 'CL', name: 'Crude Oil', market: 'NYMEX' },
        ],
        bonds: [
            { symbol: 'US10Y', name: 'US 10-Year Treasury', market: 'Bonds' },
            { symbol: 'US30Y', name: 'US 30-Year Treasury', market: 'Bonds' },
            { symbol: 'US2Y', name: 'US 2-Year Treasury', market: 'Bonds' },
        ],
    };

    let results = [];
    if (category === 'All') {
        results = Object.keys(data).reduce(function (acc, key) {
            return acc.concat(data[key]);
        }, []);
    } else {
        results = data[category.toLowerCase()];
    }

    const current = $('#search-input').val().trim();
    if (current) {
        results = results.filter(function (item) {
            return (
                item.symbol.toLowerCase().includes(current.toLowerCase()) ||
                item.name.toLowerCase().includes(current.toLowerCase())
            );
        });
    }

    $('#search-results').empty();
    if (results.length === 0) {
        $('#search-results').append(
            '<p class="text-center font-medium">No Symbols Match your Criteria!</p>',
        );
    } else {
        results.forEach(function (item) {
            const resultItem = `
                <a href="/symbol/${item.symbol}" class="block">
                    <div class="p-3 hover:bg-gray-50 rounded-md cursor-pointer">
                        <div class="flex items-center justify-between">
                            <div>
                                <span class="font-medium">${item.symbol}</span>
                                <span class="ml-2 text-gray-500">${item.name}</span>
                            </div>
                            <span class="text-gray-500">${item.market}</span>
                        </div>
                    </div>
                </a>
            `;
            $('#search-results').append(resultItem);
        });
    }
}

function initialiseSearchEvents() {
    $('#search-bar').on('submit', function (event) {
        const query = $('#search-input').val().trim();
        if (query !== '') {
            window.location.href = `/search?q=${encodeURIComponent(query)}`;
        } else {
            event.preventDefault();
        }
    });

    $('#search-icon').on('click', function (event) {
        event.preventDefault();

        const query = $('#search-input').val().trim();
        if (query !== '') {
            window.location.href = `/search?q=${encodeURIComponent(query)}`;
        }
    });

    $('#search-input').on('input', function () {
        const category = $('.search-tab.text-blue-600').data('category');
        updateSearchResults(category);
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

        const category = $(this).data('category');
        updateSearchResults(category);
    });
}

export { updateSearchResults, initialiseSearchEvents };
