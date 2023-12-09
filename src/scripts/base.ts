/**
 *
 * @return {*}
 */
export function initFilterDigits(): void {
    const fields = document.querySelectorAll('.js-filter-digits');
    const func = function (element: HTMLInputElement | HTMLTextAreaElement, event: Event) {
        let eventType = event.type,
            elementVal = element.value;

        if (eventType === 'keyup' || eventType === 'keydown' || eventType === 'onpropertychange' || eventType === 'input') {
            if (event instanceof KeyboardEvent) {
                const keyCodes = [32, 36, 37, 39, 8, 9, 46, 16],
                    eventKeyCode = event.keyCode,
                    isKeyCode = keyCodes.indexOf(eventKeyCode);

                if (isKeyCode === -1) {
                    setValueOldLength(element);

                    const keyupPattern = /[^0-9]/g;

                    if (elementVal.match(keyupPattern) !== null) {
                        element.setAttribute('value', elementVal.replace(keyupPattern, ''));
                        setCursorPosition(element);
                    }
                }
            }
        }

        if (eventType === 'blur' && isValueChange(element, event)) {
            const trimText = elementVal.replace(/[^0-9]*/g, '');

            element.setAttribute('value', trimText);
            element.dispatchEvent(
                new Event('change', {
                    bubbles: true, // Whether the event will bubble up through the DOM or not
                    cancelable: true, // Whether the event may be canceled or not
                }),
            );
        }
    };

    fields.forEach(function (el) {
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            el.addEventListener('keyup', function (event) {
                func(el, event);
            });
            el.addEventListener('blur', function (event) {
                func(el, event);
            });
            el.addEventListener('keydown', function (event) {
                func(el, event);
            });
        }
    });
}

/**
 *
 * @param element
 */
export function setValueOldLength(element: HTMLInputElement | HTMLTextAreaElement): void {
    const elementValue = element.getAttribute('value') || '',
        selectionStart = element.selectionStart || 0,
        selectionEnd = element.selectionEnd || 0;

    element.setAttribute('data-old-value-length', elementValue.length.toString());
    element.setAttribute('data-filter-start-pos', selectionStart.toString());
    element.setAttribute('data-filter-end-pos', selectionEnd.toString());
}

/**
 *
 * @param element
 * @param event
 * @return {boolean}
 */
export function isValueChange(element: HTMLInputElement | HTMLTextAreaElement, event: Event): boolean {
    const eventType = event.type,
        elementValue = element.value,
        dataOldValue = element.getAttribute('data-filter-old-value');

    if (eventType === 'blur' && elementValue !== dataOldValue) {
        element.setAttribute('data-filter-old-value', elementValue);
        return true;
    }

    return false;
}

/**
 *
 * @param element
 */
export function setCursorPosition(element: HTMLInputElement | HTMLTextAreaElement): void {
    const startPos = parseInt(element.getAttribute('data-filter-start-pos') || '', 10),
        endPos = parseInt(element.getAttribute('data-filter-end-pos') || '', 10),
        value = element.getAttribute('value') || '',
        valueLengthAfterReplace = parseInt(element.getAttribute('data-old-value-length') || '', 10) - value.length;

    element.setSelectionRange(startPos - valueLengthAfterReplace, endPos - valueLengthAfterReplace);
}

/**
 *
 * @param unescapeStr
 * @returns {string}
 */
export function escapeHtml(unescapeStr: string): string {
    return escape(unescapeStr);
}

export function convertToFieldCurrency(value: number): string {
    return String(value.toFixed(0)).replace(/\./g, ',');
}

export function isVisible(elem: HTMLElement): boolean {
    return elem.offsetWidth > 0 || elem.offsetHeight > 0 || elem.getClientRects().length > 0;
}

export function validate(elementNative: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLFormElement): boolean {
    if (!elementNative.checkValidity()) {
        elementNative.reportValidity();
    }

    return elementNative.checkValidity();
}

/**
 *
 * @param str
 * @returns {*}
 */
export function camelize(str: string): string {
    let separator = '-',
        match = str.indexOf(separator);
    while (match !== -1) {
        let last = match === str.length - 1,
            next = last ? '' : str[match + 1],
            upnext = next.toUpperCase(),
            sepSubstr = last ? separator : separator + next;
        str = str.replace(sepSubstr, upnext);
        match = str.indexOf(separator);
    }
    return str;
}
