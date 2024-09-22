/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard-scss', 'stylelint-config-property-sort-order-smacss'],
  plugins: ['stylelint-plugin-logical-css', 'stylelint-declaration-block-no-ignored-properties', 'stylelint-use-nesting'],
  rules: {
    // rules for scss
    'scss/at-extend-no-missing-placeholder': null, // maybe later
    'scss/at-if-no-null': true,
    'scss/at-mixin-argumentless-call-parentheses': 'always',
    'scss/at-rule-conditional-no-parentheses': true,
    'scss/comment-no-empty': true,
    'scss/dollar-variable-colon-space-after': 'at-least-one-space',
    'scss/dollar-variable-empty-line-before': null,
    'scss/double-slash-comment-empty-line-before': ['always', { except: ['first-nested'], ignore: ['between-comments'] }],
    'scss/function-quote-no-quoted-strings-inside': true,
    'scss/no-global-function-names': true,
    'scss/operator-no-unspaced': null,

    // rules for logical properties and values
    'plugin/use-logical-properties-and-values': null, // maybe later
    'plugin/use-logical-units': null, // maybe later

    'plugin/declaration-block-no-ignored-properties': true,

    'csstools/use-nesting': ['always', { syntax: 'scss', severity: 'warning', disableFix: true }],

    //'order/properties-order': [true, { severity: 'warning', disableFix: true }],

    // general rules
    'alpha-value-notation': null, // maybe later -> 'percentage',
    'at-rule-empty-line-before': ['always', { ignore: ['after-comment', 'first-nested', 'blockless-after-same-name-blockless'], except: ['first-nested'], ignoreAtRules: ['else'] }],
    'color-function-notation': ['legacy', { ignore: ['with-var-inside'] }], // maybe change to 'modern'
    'color-hex-length': 'short',
    'color-named': 'never',
    'color-no-invalid-hex': true,
    'comment-empty-line-before': 'always',
    'comment-whitespace-inside': 'always',
    'declaration-block-no-redundant-longhand-properties': true,
    'declaration-block-single-line-max-declarations': 1,
    'declaration-empty-line-before': 'never',
    'font-family-name-quotes': 'always-where-recommended',
    'font-family-no-missing-generic-family-keyword': true,
    'function-name-case': 'lower',
    'function-url-quotes': 'always',
    'length-zero-no-unit': true,
    'media-feature-range-notation': 'prefix',
    'no-descending-specificity': null, // too much issues
    'no-duplicate-selectors': true,
    'no-invalid-position-at-import-rule': null,
    'number-max-precision': 5,
    'property-no-unknown': true,
    'property-no-vendor-prefix': true,
    'rule-empty-line-before': ['always', { ignore: ['after-comment'], except: ['first-nested'] }],
    'selector-attribute-quotes': 'always',
    'selector-class-pattern': null, // maybe later
    'selector-id-pattern': null, // maybe later
    'selector-max-compound-selectors': null, // maybe later -> [3, { severity: 'warning' }],
    'selector-not-notation': 'simple',
    'selector-pseudo-element-colon-notation': 'single',
    'shorthand-property-no-redundant-values': true,
    'value-keyword-case': ['lower', { ignoreKeywords: ['currentColor', 'optimizeLegibility'], severity: 'warning', disableFix: true }],
    'value-no-vendor-prefix': true,
  },
  reportDescriptionlessDisables: true,
  reportInvalidScopeDisables: true,
  reportNeedlessDisables: true,
  quietDeprecationWarnings: true,
};
