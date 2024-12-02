/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
export default {
    endOfLine: 'lf',
    htmlWhitespaceSensitivity: 'strict',
    importOrder: ['^express$', '<THIRD_PARTY_MODULES>', '^[./]'],
    importOrderSeparation: true,
    importOrderSortSpecifiers: true,
    singleQuote: true,
    tabWidth: 4,
    useTabs: false,
    plugins: ['@trivago/prettier-plugin-sort-imports'],
};
