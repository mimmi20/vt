import Chart, { TooltipItem } from 'chart.js/auto';
import { createPopper } from '@popperjs/core/lib/popper-lite.js';
import preventOverflow from '@popperjs/core/lib/modifiers/preventOverflow.js';
import flip from '@popperjs/core/lib/modifiers/flip.js';
import Rentenluecke from './scripts/rentenluecke';
import * as LZZ from './scripts/lzz';
import * as KRV from './scripts/krv-table';
import VorsorgeList from './vorsorge-list';

customElements.define('vorsorge-list', VorsorgeList);

class RL extends HTMLElement {
    private root: ShadowRoot;
    private chartObject: Chart<'doughnut'> | null = null;

    constructor() {
        super();

        this.root = this.attachShadow({ mode: 'closed' });
    }

    connectedCallback() {
        this.root.innerHTML = this.render();

        const forms = this.root.querySelectorAll<HTMLFormElement>('.needs-validation');
        const vorsorgeLists = this.root.querySelectorAll<VorsorgeList>('vorsorge-list');

        let bestehendeVorsorge = 0;
        let erwarteteRente = 0;
        let rentenluecke = 0;

        vorsorgeLists.forEach((vorsorgeList: VorsorgeList): void => {
            vorsorgeList.addEventListener('pension.added', (event: CustomEvent<PensionInfo>): void => {
                bestehendeVorsorge = event.detail.summary;
            });
        });

        forms.forEach((form: HTMLFormElement): void => {
            form.addEventListener(
                'submit',
                (event: SubmitEvent): void => {
                    event.preventDefault();
                    event.stopPropagation();

                    const valid = form.checkValidity();

                    form.classList.add('was-validated');

                    vorsorgeLists.forEach((vorsorgeList: VorsorgeList) => {
                        vorsorgeList.classList.add('was-validated');
                    });

                    if (valid) {
                        const data: FormData = new FormData(form),
                            state: FormDataEntryValue | null = data.get('state'),
                            stkl: FormDataEntryValue | null = data.get('stkl'),
                            netto: FormDataEntryValue | null = data.get('netto'),
                            anzahl: FormDataEntryValue | null = data.get('anzahl'),
                            geb: FormDataEntryValue | null = data.get('geb'),
                            rente: FormDataEntryValue | null = data.get('rente'),
                            alter: FormDataEntryValue | null = data.get('alter'),
                            inflationsrate: FormDataEntryValue | null = data.get('inflationsrate'),
                            inflationAn: FormDataEntryValue | null = data.get('inflationAn');

                        if (null !== state && null !== stkl && null !== netto) {
                            const calculationResult = Rentenluecke.calculate(
                                !(state instanceof File) ? state.toString() || '' : '',
                                !(stkl instanceof File) ? parseInt(stkl.toString(), 10) : 0,
                                !(netto instanceof File) ? parseInt(netto.toString(), 10) : 0,
                                !(anzahl instanceof File) ? parseInt((anzahl || 0).toString(), 10) : 0,
                                !(geb instanceof File) ? parseInt((geb || 0).toString(), 10) : 0,
                                !(rente instanceof File) ? parseInt((rente || 0).toString(), 10) : 0,
                                !(alter instanceof File) ? parseInt((alter || 0).toString(), 10) : 0,
                                !(inflationsrate instanceof File) ? parseFloat((inflationsrate || 0.0).toString()) : 0,
                                !(inflationAn instanceof File) ? !!(inflationAn || false) : false,
                                LZZ.LZZ_JAHR,
                                KRV.KRV_TABELLE_ALLGEMEIN,
                                true, // kinderlos u. über 23J.
                                1, // Kirchensteuer berechnen
                                0.0, // Anzahl Kinderfreibeträge
                            );

                            if (!calculationResult.valid) {
                                return;
                            }

                            const monatsBedarf = calculationResult.monatsBedarf || 0,
                                monatsRente = calculationResult.monatsRente || 0,
                                kv = calculationResult.kv || 0,
                                steuer = calculationResult.steuer || 0;

                            erwarteteRente = calculationResult.nettoRente || 0;

                            let rentenluecke = monatsBedarf - (erwarteteRente + bestehendeVorsorge);

                            if (rentenluecke <= 0) {
                                rentenluecke = 0;
                            }

                            const resultData = {
                                type: 'rentenluecke',
                                monatsBedarf: monatsBedarf,
                                monatsRente: monatsRente,
                                kv: kv,
                                steuer: steuer,
                            };

                            document.dispatchEvent(
                                new CustomEvent('rl.calculated', {
                                    detail: resultData,
                                    bubbles: true, // Whether the event will bubble up through the DOM or not
                                    cancelable: true, // Whether the event may be canceled or not
                                }),
                            );

                            const chart = this.root.getElementById('js-doughnut-chart');

                            if (null === chart || !(chart instanceof HTMLCanvasElement)) {
                                return;
                            }

                            this.updateChart(erwarteteRente, bestehendeVorsorge, rentenluecke);

                            const pensionGapAmount = this.root.getElementById('pension-gap-amount');
                            const monthlyRequirementAmount = this.root.getElementById('monthly-requirement-amount');
                            const pensionNetAmount = this.root.getElementById('future-net-pension-amount');
                            const pensionActualAmount = this.root.getElementById('actual-pension-amount');

                            if (null !== pensionGapAmount && pensionGapAmount instanceof HTMLOutputElement) {
                                pensionGapAmount.value = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(rentenluecke);
                            }

                            if (null !== monthlyRequirementAmount && monthlyRequirementAmount instanceof HTMLOutputElement) {
                                monthlyRequirementAmount.value = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(monatsBedarf);
                            }

                            if (null !== pensionNetAmount && pensionNetAmount instanceof HTMLOutputElement && null !== pensionNetAmount.parentElement) {
                                if (erwarteteRente > 0) {
                                    pensionNetAmount.value = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(erwarteteRente);
                                    pensionNetAmount.parentElement.classList.remove('d-none');
                                } else {
                                    pensionNetAmount.parentElement.classList.add('d-none');
                                }
                            }

                            if (null !== pensionActualAmount && pensionActualAmount instanceof HTMLOutputElement && null !== pensionActualAmount.parentElement) {
                                if (erwarteteRente > 0) {
                                    pensionActualAmount.value = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(bestehendeVorsorge);
                                    pensionActualAmount.parentElement.classList.remove('d-none');
                                } else {
                                    pensionActualAmount.parentElement.classList.add('d-none');
                                }
                            }
                        }
                    }
                },
                false,
            );
        });

        const fields = this.root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('.needs-validation input, .needs-validation select');

        fields.forEach((field: HTMLInputElement | HTMLSelectElement) => {
            field.addEventListener(
                'blur',
                (event: Event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    field.classList.add('was-edited');
                },
                { once: true },
            );
        });

        const gebField = this.root.getElementById('geb');
        const pensionField = this.root.getElementById('rente');

        if (gebField instanceof HTMLInputElement && pensionField instanceof HTMLSelectElement) {
            gebField.addEventListener(
                'blur',
                (): void => {
                    this.checkAge(gebField, pensionField);
                },
                false,
            );
            gebField.addEventListener(
                'change',
                (): void => {
                    this.checkAge(gebField, pensionField);
                },
                false,
            );

            pensionField.addEventListener(
                'blur',
                (): void => {
                    this.checkAge(gebField, pensionField);
                },
                false,
            );
            pensionField.addEventListener(
                'change',
                (): void => {
                    this.checkAge(gebField, pensionField);
                },
                false,
            );
        }

        const pensionsAvailableFields = this.root.querySelectorAll<HTMLInputElement>('.js-pensions-available');
        const pensionsFields = this.root.querySelectorAll<HTMLInputElement>('.pensions-available');

        pensionsAvailableFields.forEach((field: HTMLInputElement): void => {
            field.addEventListener('change', (event: Event): void => {
                event.preventDefault();
                event.stopPropagation();

                if ('ja' === field.value) {
                    pensionsFields.forEach((pensionsField: HTMLInputElement): void => {
                        pensionsField.classList.remove('d-none');
                    });
                }
                if ('nein' === field.value) {
                    pensionsFields.forEach((pensionsField: HTMLInputElement): void => {
                        pensionsField.classList.add('d-none');
                    });
                }
            });
        });

        const tooltipButtons = this.root.querySelectorAll<HTMLButtonElement>('.has-tooltip button');

        tooltipButtons.forEach((button: HTMLButtonElement): void => {
            const tooltipName = button.getAttribute('aria-describedby');

            if (null === tooltipName) {
                return;
            }

            const tooltip = this.root.getElementById(tooltipName);

            if (null === tooltip) {
                return;
            }

            const popperInstance = createPopper(button, tooltip, {
                modifiers: [
                    preventOverflow,
                    flip,
                    {
                        name: 'offset',
                        options: {
                            offset: [0, 8],
                        },
                    },
                ],
                placement: 'left',
            });

            function show(): void {
                if (null === tooltip) {
                    return;
                }

                tooltip.setAttribute('data-show', '');

                // We need to tell Popper to update the tooltip position
                // after we show the tooltip, otherwise it will be incorrect
                void popperInstance.update();
            }

            function hide(): void {
                if (null === tooltip) {
                    return;
                }

                tooltip.removeAttribute('data-show');
            }

            const showEvents = ['mouseenter', 'focus'];
            const hideEvents = ['mouseleave', 'blur'];

            showEvents.forEach((event: string): void => {
                button.addEventListener(event, show);
            });

            hideEvents.forEach((event: string): void => {
                button.addEventListener(event, hide);
            });
        });

        const inflationAn = this.root.getElementById('inflationAn');
        const inflationsRate = this.root.getElementById('inflationsrate');
        const inflationsButtons = this.root.querySelectorAll<HTMLButtonElement>('.inflation-settings');

        if (null !== inflationAn && null !== inflationsRate && inflationAn instanceof HTMLInputElement && inflationsRate instanceof HTMLInputElement) {
            inflationAn.addEventListener(
                'change',
                (event: Event): void => {
                    if (null === event.target || !(event.target instanceof HTMLInputElement) || !(inflationsRate instanceof HTMLInputElement)) {
                        return;
                    }

                    if (event.target.checked) {
                        inflationsButtons.forEach((button: HTMLButtonElement): void => {
                            button.removeAttribute('disabled');
                        });
                    } else {
                        inflationsButtons.forEach((button: HTMLButtonElement): void => {
                            button.setAttribute('disabled', '');
                        });

                        inflationsRate.value = '2.2';
                        inflationsRate.dispatchEvent(
                            new InputEvent('input', {
                                bubbles: false, // Whether the event will bubble up through the DOM or not
                                cancelable: true, // Whether the event may be canceled or not
                            }),
                        );
                    }

                    forms.forEach((form: HTMLFormElement): void => {
                        form.dispatchEvent(
                            new SubmitEvent('submit', {
                                bubbles: false, // Whether the event will bubble up through the DOM or not
                                cancelable: true, // Whether the event may be canceled or not
                            }),
                        );
                    });
                },
                false,
            );
        }

        const layer = this.root.getElementById('inflation-layer');

        inflationsButtons.forEach((button: HTMLButtonElement): void => {
            if (null === layer || !(layer instanceof HTMLDialogElement)) {
                return;
            }

            button.addEventListener(
                'click',
                (event: MouseEvent): void => {
                    event.preventDefault();
                    event.stopPropagation();

                    this.slider();

                    layer.showModal();
                    layer.setAttribute('aria-hidden', 'false');
                },
                false,
            );
        });

        if (null !== inflationsRate && inflationsRate instanceof HTMLInputElement) {
            const sliderTooltips = this.root.querySelectorAll<HTMLOutputElement>('.slider-tooltip');
            const sliderRate = this.root.querySelectorAll<HTMLOutputElement>('.inflation-rate');

            inflationsRate.addEventListener(
                'input',
                (event: Event): void => {
                    event.preventDefault();
                    event.stopPropagation();

                    sliderTooltips.forEach((sliderTooltip: HTMLOutputElement): void => {
                        sliderTooltip.value = inflationsRate.value + '%';
                    });
                    sliderRate.forEach((sliderTooltip: HTMLOutputElement): void => {
                        sliderTooltip.value = inflationsRate.value + '%';
                    });

                    console.log('slider');

                    this.slider();
                },
                false,
            );
        }

        const modalCloseButtons = this.root.querySelectorAll<HTMLButtonElement>('.btn-close');

        modalCloseButtons.forEach((modalCloseButton: HTMLButtonElement): void => {
            if (null === layer || !(layer instanceof HTMLDialogElement)) {
                return;
            }

            modalCloseButton.addEventListener(
                'click',
                (event: MouseEvent): void => {
                    event.preventDefault();
                    event.stopPropagation();

                    layer.close();
                    layer.setAttribute('aria-hidden', 'true');

                    forms.forEach((form: HTMLFormElement): void => {
                        form.dispatchEvent(
                            new SubmitEvent('submit', {
                                bubbles: false, // Whether the event will bubble up through the DOM or not
                                cancelable: true, // Whether the event may be canceled or not
                            }),
                        );
                    });
                },
                false,
            );
        });

        const chart = this.root.getElementById('js-doughnut-chart');

        if (null === chart || !(chart instanceof HTMLCanvasElement)) {
            return;
        }

        if (null === this.chartObject) {
            this.chartObject = new Chart<'doughnut'>(chart, {
                type: 'doughnut',
                options: {
                    locale: 'de-DE',
                    responsive: true,
                    maintainAspectRatio: true,
                    // cutoutPercentage: 93,
                    plugins: {
                        legend: {
                            display: false,
                        },
                        title: {
                            display: true,
                            align: 'center',
                            position: 'bottom',
                            text: `Rentenlücke: ${new Intl.NumberFormat('de-DE', {
                                style: 'currency',
                                currency: 'EUR',
                            }).format(rentenluecke)}`,
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context: TooltipItem<'doughnut'>): string {
                                    let label = context.dataset.label || '';

                                    if (context.parsed !== null) {
                                        if (label) {
                                            label += ': ';
                                        }

                                        label += new Intl.NumberFormat('de-DE', {
                                            style: 'currency',
                                            currency: 'EUR',
                                        }).format(context.parsed);
                                    }

                                    return label;
                                },
                            },
                        },
                    },
                },
                data: {
                    labels: ['zu erwartende Nettorente', 'bestehende Vorsorge', 'Rentenlücke'],
                    datasets: [
                        {
                            data: [erwarteteRente, bestehendeVorsorge, rentenluecke],
                            backgroundColor: ['#2cc1d5', '#005e97', '#ff1f00'],
                            borderColor: ['#ffffff', '#888888', '#000000'],
                            borderWidth: 0,
                            borderAlign: 'inner',
                            weight: 0.1,
                        },
                    ],
                },
            });
        } else {
            this.updateChart(erwarteteRente, bestehendeVorsorge, rentenluecke);
        }
    }

    attributeChangedCallback(/*attrName: string, oldVal: string, newVal: string/**/): void {
        // nothing to do at the moment
        console.log('attributeChangedCallback hook');
    }

    diconnectedCallback(): void {
        // nothing to do at the moment
        console.log('diconnectedCallback hook');
    }

    static get observedAttributes(): string[] {
        return ['class'];
    }

    get class(): string | null {
        return this.getAttribute('class');
    }

    set class(classVal: string | null) {
        if (classVal) {
            this.setAttribute('class', classVal);
        } else {
            this.setAttribute('class', '');
        }
    }

    checkAge(gebField: HTMLInputElement, pensionField: HTMLSelectElement): void {
        const Datum = new Date(),
            actualYear = Datum.getUTCFullYear(),
            invalidAgeMessages = this.root.querySelectorAll<HTMLDivElement>('.invalid-age-feedback');

        if ('' === gebField.value || '' === pensionField.value) {
            invalidAgeMessages.forEach((invalidAgeMessage: HTMLDivElement): void => {
                invalidAgeMessage.style.display = 'none';
            });
            return;
        }

        const birthyear = parseInt(gebField.value, 10),
            pensionAge = parseInt(pensionField.value, 10);

        gebField.setAttribute('min', (actualYear - 1 - pensionAge).toString());
        gebField.checkValidity();

        if (birthyear + pensionAge >= actualYear - 1) {
            invalidAgeMessages.forEach((invalidAgeMessage: HTMLDivElement): void => {
                invalidAgeMessage.style.display = 'none';
            });

            return;
        }

        invalidAgeMessages.forEach((invalidAgeMessage: HTMLDivElement): void => {
            invalidAgeMessage.style.display = 'block';
        });
    }

    getStyle(): string {
        return `
    <style>
        @layer all, media, container;

        @layer container {
            @container rl (max-width: 800px) {
                .calculation-container {
                    grid-template-columns: 1fr;
                    grid-template-areas:
                        'result'
                        'form'
                        'button';
                }
            }
        }

        @layer media {
            /* fallback if container queries are not supported */
            @media (max-width: 800px) {
                .calculation-container {
                    grid-template-columns: 1fr;
                    grid-template-areas:
                        'result'
                        'form'
                        'button';
                }
            }
        }

        @layer all {
            *,*::before,*::after {
                box-sizing: border-box
            }
            .container {
                all: initial;

                container-type: inline-size;
                container-name: rl;
            }
            .calculation-container {
                display: grid;
                grid-template-columns: 1fr 1fr;
                grid-template-rows: min-content;
                grid-template-areas:
                    'form result'
                    'button button';

                gap: 1.5rem;
            }
            .container, .text-container, .calculation-container {
                width: 100%;
            }
            .text-container {
                padding: 1.25rem;
                text-align: left;
            }
            .text-container .headline {
                margin-bottom: 2.9375rem;
                font-size: 1.625rem;
                font-weight: 600;
                color: var(--vt-form-color, #212529);
            }
            .form-container {
                grid-area: form;

                display: grid;
                gap: 1.5rem;
                text-align: start;
            }
            .result-container {
                grid-area: result;

                display: grid;
                gap: 1.5rem;
                grid-template-areas:
                    'head head'
                    'graph inflation'
                    'overview overview';
                grid-auto-rows: min-content;
                grid-template-columns: 6fr 4fr;
            }
            .button-container {
                grid-area: button;
            }
            .form-container .headline, .result-container .headline {
                padding-bottom: 2.1875rem;
                font-size: 1.25rem;
                font-weight: 300;
                color: var(--vt-form-color, #212529);
            }
            .result-container .headline {
                grid-area: head;
                height: fit-content;
            }
            .alert-danger {
                display: none;
                color: var(--vt-danger-text-color, #000000);
                background-color: var(--vt-danger-background-color, #f8d7da);
                border-color: var(--vt-danger-border-color, #f5c2c7);
            }
            .alert-warning {
                display: none;
                color: var(--vt-warning-text-color, #000000);
                background-color: var(--vt-warning-background-color, #fff3cd);
                border-color: var(--vt-warning-border-color, #ffecb5);
            }
            .alert {
                position: relative;
                padding: 1rem 1rem;
                margin-bottom: 1rem;
                border-width: var(--vt-form-border-width, 1px);
                border-style: solid;
                border-radius: var(--vt-form-border-radius, 0.25rem);
                border-color: var(--vt-alert-border-color, #000000);
            }
            .form-floating, .position-relative {
                position: relative;
            }
            :required + label {
                position: relative;
            }
            :required + label::after {
                position: absolute;
                content: ' (erforderlich)';
                color: var(--vt-danger-message-color, #842029);
                padding-left: 0.25rem;
            }
            .optional::after {
                position: absolute;
                content: ' (optional)';
                color: var(--vt-optional-message-color, #00ff00);
                padding-left: 0.25rem;
            }
            .form-control, .form-select {
                display: block;
                width: 100%;
                font-size: 1rem;
                font-weight: 400;
                line-height: 1.5;
                color: var(--vt-form-color, #212529);
                background-color: var(--vt-background-color, #ffffff);
                border-color: var(--vt-form-border-color, #ced4da);
                border-style: solid;
                border-width: var(--vt-form-border-width, 1px);
                border-radius: var(--vt-form-border-radius, 0.25rem);
                -webkit-appearance: none;
                -moz-appearance: none;
                appearance: none;
            }
            .form-control {
                padding: 0.375rem 0.75rem;
                background-clip: padding-box;
                transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
            }
            .form-control:not(:placeholder-shown):not(:focus):invalid, .form-control:out-of-range {
                border-color: var(--vt-danger-border-color, #842029);
            }
            .was-validated .form-control:valid, .form-control.was-edited:valid {
                border-color: var(--vt-form-valid-color, #198754);
                padding-right: calc(1.5em + 0.75rem);
                background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%23198754' d='M2.3 6.73.6 4.53c-.4-1.04.46-1.4 1.1-.8l1.1 1.4 3.4-3.8c.6-.63 1.6-.27 1.2.7l-4 4.6c-.43.5-.8.4-1.1.1z'/%3e%3c/svg%3e");
                background-repeat: no-repeat;
                background-position: right calc(0.375em + 0.1875rem) center;
                background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
            }
            .was-validated .form-control:invalid, .form-control.was-edited:invalid {
                border-color: var(--vt-form-invalid-color, #dc3545);
                padding-right: calc(1.5em + 0.75rem);
                background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
                background-repeat: no-repeat;
                background-position: right calc(0.375em + 0.1875rem) center;
                background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
            }
            .form-select {
                padding: 0.375rem 2.25rem 0.375rem 0.75rem;
                -moz-padding-start: calc(0.75rem - 3px);
                background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e");
                background-repeat: no-repeat;
                background-position: right 0.75rem center;
                background-size: 16px 12px;
                transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
                background-clip: padding-box;
            }
            .was-validated .form-select:valid, .form-select.was-edited:valid {
                padding-right: 4.125rem;
                background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e"),url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%23198754' d='M2.3 6.73.6 4.53c-.4-1.04.46-1.4 1.1-.8l1.1 1.4 3.4-3.8c.6-.63 1.6-.27 1.2.7l-4 4.6c-.43.5-.8.4-1.1.1z'/%3e%3c/svg%3e");
                background-position: right 0.75rem center,center right 2.25rem;
                background-size: 16px 12px,calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
                border-color: var(--vt-form-valid-color, #198754);
            }
            .was-validated .form-select:invalid, .form-select.was-edited:invalid {
                padding-right: 4.125rem;
                background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e"),url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
                background-position: right 0.75rem center,center right 2.25rem;
                background-size: 16px 12px,calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
                border-color: var(--vt-form-invalid-color, #dc3545);
            }
            .was-validated :invalid~.invalid-feedback,
            .was-edited:invalid~.invalid-feedback,
            .was-validated [min][max]:out-of-range~.invalid-min-max-feedback:not(:is(.age-63, .age-65, .age-67)),
            .was-edited[min][max]:out-of-range~.invalid-min-max-feedback:not(:is(.age-63, .age-65, .age-67)),
            .was-validated [min]:not([max]):out-of-range~.invalid-min-feedback,
            .was-edited[min]:not([max]):out-of-range~.invalid-min-feedback,
            .was-validated:has(.form-control:invalid, .form-select:invalid) .alert-warning {
                display: block;
            }
            form:has(.rente [value="63"]:checked) :out-of-range~.invalid-min-max-feedback.age-63 {
                display: block;
            }
            form:has(.rente [value="65"]:checked) :out-of-range~.invalid-min-max-feedback.age-65 {
                display: block;
            }
            form:has(.rente :is([value=""], [value="67"]):checked) :out-of-range~.invalid-min-max-feedback.age-67 {
                display: block;
            }
            .form-floating>.form-control, .form-floating>.form-select {
                padding: 1.625rem 0.75rem 0.625rem;
            }
            .form-floating>legend {
                padding: 0.625rem 0.75rem 0.625rem;
            }
            .form-floating>.form-control, .form-floating>.form-select {
                height: calc(3.5rem + 2px);
                line-height: 1.25;
            }
            .form-floating>.form-control:focus~label, .form-floating>.form-control:not(:placeholder-shown)~label, .form-floating>.form-select~label {
                opacity: .65;
                transform: scale(0.85) translateY(-0.5rem) translateX(0.15rem);
            }
            .form-floating>label {
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                padding: 1rem 0.75rem;
                pointer-events: none;
                transform-origin: 0 0;
                transition: opacity .1s ease-in-out,transform .1s ease-in-out;
            }
            .invalid-feedback, .invalid-min-max-feedback, .invalid-min-feedback, .invalid-age-feedback, .form-text {
                padding: 0.25rem 0.75rem 0.25rem;
                font-size: var(--vt-helptext-fontsize, .875em);
            }
            .invalid-feedback, .invalid-min-max-feedback, .invalid-min-feedback, .invalid-age-feedback {
                display: none;
                width: 100%;
                color: var(--vt-form-invalid-color, #dc3545);
            }
            .form-text {
                color: var(--vt-helptext-color, #6c757d);
            }
            .optional~.form-text, .inline-block~.form-text {
                padding: 0.25rem 0.75rem 0.25rem 0;
            }
            .pensions-available {
            }
            .text-center {
                text-align: center;
            }
            .col-form-label {
                padding-top: calc(0.375rem + 1px);
                padding-bottom: calc(0.375rem + 1px);
                margin-bottom: 0;
                font-size: inherit;
                line-height: 1.5;
            }
            .chartjs-render-monitor {
                animation: chartjs-render-animation 0.001s;
            }
            .form-check, .form-switch {
                display: inline-block;
                margin-right: 1rem;
                min-height: 1.5rem;
                padding-left: 2.5em;
                margin-bottom: 0.125rem;
            }
            .form-check-input[type=radio] {
                border-radius: 50%;
            }
            .form-check .form-check-input, .form-switch .form-check-input {
                float: left;
                margin-left: -1.5em;
            }
            .form-switch .form-check-input {
                width: 2em;
                margin-left: -2.5em;
                background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='rgba%280, 0, 0, 0.25%29'/%3e%3c/svg%3e");
                background-position: left center;
                border-radius: 2em;
                transition: background-position .15s ease-in-out;
            }
            .form-check-input:checked {
                background-color: #0d6efd;
                border-color: #0d6efd;
            }
            .form-switch .form-check-input:checked {
                background-position: right center;
                background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%23fff'/%3e%3c/svg%3e");
            }
            .form-check-input {
                width: 1em;
                height: 1em;
                margin-top: 0.25em;
                vertical-align: top;
                background-color: var(--vt-background-color, #ffffff);
                background-repeat: no-repeat;
                background-position: center;
                background-size: contain;
                border-width: var(--vt-form-border-width, 1px);
                border-style: solid;
                border-color: var(--vt-form-border-color, rgba(0,0,0,.25));
                -webkit-appearance: none;
                -moz-appearance: none;
                appearance: none;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
                print-color-adjust: exact;
            }
            input[type=checkbox], input[type=radio] {
                position: static;
                margin-left: 0;
            }
            .btn:hover {
                text-decoration: none;
            }
            .btn {
                width: max(30%, 100px);
                font-weight: 300;
                font-size: 1.125rem;
                line-height: 1.25;
                background-color: var(--vt-button-background-color, #000000);
                border-color: var(--vt-button-border-color, #000000);
                border-radius: var(--vt-button-border-radius, 0);
                color: var(--vt-button-color, #ffffff);
                display: inline-block;
                text-align: center;
                vertical-align: middle;
                cursor: pointer;
                user-select: none;
                padding: 0.8125rem 0.75rem 0.8125rem;
                transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out;
            }
            .provision-chart-container {
                grid-area: graph;
                width: 100%;
                flex: 0 0 auto
                height: fit-content;
                margin: 0 auto;
                overflow: hidden;
                position: relative;
            }
            .inflation {
                grid-area: inflation;

                display: grid;
                gap: .2rem;
                grid-template-areas:
                    'label label'
                    'switch button';
                grid-auto-flow: row;
                height: fit-content;
            }
            .inflation-label {
                grid-area: label;
                height: fit-content;
            }
            .inflation-switch {
                grid-area: switch;
                height: fit-content;
            }
            .inflation-settings {
                grid-area: button;
                color: #999;
                text-decoration: none;
                background-color: var(--vt-background-color, #ffffff);
                width: fit-content;
                height: fit-content;
                padding: 0;
                border-color: transparent;
            }
            .inflation-settings svg {
                margin: auto;
            }
            .chart-result-list {
                grid-area: overview;
            }
            .list-unstyled {
                padding-left: 0;
                list-style: none;
            }
            .chart-result-list li {
                border-left: 4px solid #ebecee;
                border-top: 1px solid #ebecee;
                padding: 1.25rem 0.3125rem;
                line-height: 1.25rem;
                color: #495057;
            }
            .chart-result-list li.chart-amount-1 {
                color: #2cc1d5;
                border-left-color: #2cc1d5;
            }
            .chart-result-list li.chart-amount-2 {
                color: #005e97;
                border-left-color: #005e97;
            }
            .chart-result-list li.chart-amount-3 {
                color: #ff1f00;
                border-left-color: #ff1f00;
            }
            .chart-result-list li.chart-amount-box .amount {
                font-weight: 700;
                font-size: 1.25rem;
            }
            .modal {
                border: none;
                padding: 0;
                overflow: hidden;
            }
            .modal[open] {
                border: 1px solid rgba(0,0,0,.2);
                border-radius: 0.3rem;
            }
            .modal-content {
                position: relative;
                display: flex;
                flex-direction: column;
                width: 100%;
                pointer-events: auto;
                background-color: #ffffff;
                background-clip: padding-box;
                outline: 0;
            }
            .modal-header, .modal-footer {
                border: none;
            }
            .modal-header {
                display: flex;
                flex-shrink: 0;
                align-items: center;
                justify-content: space-between;
                padding: 1rem 1rem;
            }
            .modal-title {
                margin-bottom: 0;
                line-height: 1.5;
            }
            .btn-close:not(.btn-rente-refresh) {
                box-sizing: content-box;
                width: 1em;
                height: 1em;
                padding: 0.25em 0.25em;
                color: #000000;
                background: rgba(0,0,0,0) url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23000'%3e%3cpath d='M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0 111.414 1.414L9.414 8l6.293 6.293a1 1 0 01-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 01-1.414-1.414L6.586 8 .293 1.707a1 1 0 010-1.414z'/%3e%3c/svg%3e") center/1em auto no-repeat;
                border: 0;
                border-radius: 0.25rem;
                opacity: .5;
            }
            .btn-rente-refresh {
                width: fit-content;
            }
            .modal-body {
                position: relative;
                flex: 1 1 auto;
                padding: 1rem;
            }
            .slider-container {
                width: 100%;
                position: relative;
                margin-top: 1.9375rem;
            }
            .slider-container .slider {
                -webkit-appearance: none;
                width: 100%;
                height: 3px;
                border-radius: 1.5px;
                background: #ebecee;
                outline: none;
                opacity: .75;
                transition: opacity .2s;
            }
            .slider-container .slider-tooltip {
                width: auto;
                height: auto;
                padding: 0.1875rem 0.625rem;
                position: absolute;
                bottom: 1.5625rem;
                left: 50%;
                text-align: center;
                font-size: 0.875rem;
                color: #ffffff;
                white-space: nowrap;
                background-color: #212529;
                border-radius: 0.1875rem;
            }
            .slider-container .slider-tooltip:after {
                content: "";
                width: 0;
                height: 0;
                border-style: solid;
                border-width: 0.375rem 0.40625rem 0 0.40625rem;
                border-color: #212529 rgba(0,0,0,0) rgba(0,0,0,0) rgba(0,0,0,0);
                position: absolute;
                top: 100%;
                left: calc(50% - 0.40625rem);
            }
            .modal-footer {
                display: flex;
                flex-wrap: wrap;
                flex-shrink: 0;
                align-items: center;
                justify-content: flex-end;
                padding: 0.75rem;
            }
            .justify-content-between {
                justify-content: space-between !important;
            }
            .row {
                display: grid;
                grid-template-columns: 2fr 1fr;
                grid-template-rows: min-content;
                grid-template-areas:
                    'label price'
                    'info info';
            }
            .col-8 {
                grid-area: label;
            }
            .col-4 {
                grid-area: price;
            }
            .row .form-text {
                grid-area: info;
            }
            .text-end {
                text-align: end !important;
            }

            .d-none {
                display: none;
            }
            label {
                display: inline-block;
            }
            select {
                word-wrap: normal;
            }
            button, select {
                text-transform: none;
            }
            input, button, select, optgroup, textarea {
                margin: 0;
                font-family: inherit;
                font-size: inherit;
                line-height: inherit;
            }
            p {
                margin-top: 0;
                margin-bottom: 1rem;
            }
            fieldset {
                min-width: 0;
                padding: 0;
                margin: 0;
                border: 0;
            }
            legend {
                float: left;
                width: 100%;
                padding: 0;
                margin-bottom: 0.5rem;
                line-height: inherit;
            }
            button:not(:disabled) {
                cursor: pointer;
            }
        }
    </style>
    `;
    }

    render(): string {
        const Datum = new Date();
        return `
      ${this.getStyle()}
      <div class="container">
        <div class="headline">
          <slot name="header"></slot>
        </div>
        <div class="text-container">
          <slot name="intro"></slot>
        </div>
        <div class="calculation-container">
          <form class="form-container needs-validation" name="renten-form" id="renten-form" accept-charset="utf-8" novalidate>
            <div class="headline text-center">
              <slot name="form-header">Form Header</slot>
            </div>
            <div class="alert alert-danger d-none" role="alert">
              <slot name="alert-danger">Es ist ein Fehler aufgetreten!</slot>
            </div>
            <div class="alert alert-warning" role="alert">
              <slot name="alert-warning">Ihre angegebenen Daten sind nicht korrekt!</slot>
            </div>
            <div class="form-floating">
              <input type="number"
                     name="netto"
                     id="netto"
                     class="form-control"
                     placeholder=" "
                     required
                     autocomplete="off"
                     value=""
                     min="1"
                     aria-describedby="nettoHelpBlock">
              <label class="col-form-label" for="netto">Monatliches Netto</label>
              <div id="nettoHelpBlock" class="form-text">
                Ihr Nettogehalt, bzw. der Netto-Arbeitslohn, ist die Summe, die nach Abzug aller Abgaben und Steuern von Gehalt oder Lohn übrig bleibt und von Ihrem Arbeitgeber an Sie ausgezahlt wird.
              </div>
              <div class="invalid-feedback">Bitte geben Sie Ihr Nettogehalt an</div>
              <div class="invalid-min-feedback">Der Wert muss größer 0 sein.</div>
            </div>
            <div class="form-floating">
              <select name="anzahl" id="anzahl" class="form-select" required aria-describedby="anzahlHelpBlock">
                <option value="">Bitte wählen</option>
                <option value="12">12</option>
                <option value="13">13</option>
                <option value="14">14</option>
              </select>
              <label class="col-form-label" for="anzahl">Anzahl Gehälter je Jahr</label>
              <div id="anzahlHelpBlock" class="form-text">
                Wie viele Gehälter werden Ihnen im Jahr insgesamt ausgezahlt? In vielen Branchen ist ein 13. oder 14. Gehalt üblich.
              </div>
              <div class="invalid-feedback">Bitte geben Sie an, wieviele Monatsgehälter Sie erhalten</div>
            </div>
            <div class="form-floating">
              <select name="stkl" id="stkl" class="form-select" required aria-describedby="stklHelpBlock">
                <option value="">Bitte wählen</option>
                <option value="1">Steuerklasse 1</option>
                <option value="2">Steuerklasse 2</option>
                <option value="3">Steuerklasse 3</option>
                <option value="4">Steuerklasse 4</option>
                <option value="5">Steuerklasse 5</option>
                <option value="6">Steuerklasse 6</option>
              </select>
              <label class="col-form-label" for="stkl">Steuerklasse</label>
              <div id="stklHelpBlock" class="form-text">
                Die Steuerklasse richtet sich in erster Linie nach dem Familienstand: Steuerklasse 1 gilt automatisch für alle ledigen, verwitweten, geschiedenen oder dauernd getrennt lebenden Arbeitnehmer. Alleinerziehende zählt das Finanzamt zur Steuerklasse 2. Verheiratete können je nach Steuerklasse des Ehepartners den Steuerklassen 3 bis 5 angehören. Wer mehr als einen Job hat, fällt ab dem zweiten Job in die Steuerklasse 6.
              </div>
              <div class="invalid-feedback">Bitte wählen Sie Ihre Steuerklasse aus</div>
            </div>
            <div class="form-floating">
              <select name="state" id="state" class="form-select" required aria-describedby="stateHelpBlock">
                <option value="">Bitte wählen</option>
                <option value="Baden-Württemberg">Baden-Württemberg</option>
                <option value="Bayern">Bayern</option>
                <option value="Berlin">Berlin</option>
                <option value="Brandenburg">Brandenburg</option>
                <option value="Bremen">Bremen</option>
                <option value="Hamburg">Hamburg</option>
                <option value="Hessen">Hessen</option>
                <option value="Mecklenburg-Vorpommern">Mecklenburg-Vorpommern</option>
                <option value="Niedersachsen">Niedersachsen</option>
                <option value="Nordrhein-Westfalen">Nordrhein-Westfalen</option>
                <option value="Rheinland-Pfalz">Rheinland-Pfalz</option>
                <option value="Saarland">Saarland</option>
                <option value="Sachsen">Sachsen</option>
                <option value="Sachsen-Anhalt">Sachsen-Anhalt</option>
                <option value="Schleswig-Holstein">Schleswig-Holstein</option>
                <option value="Thüringen">Thüringen</option>
              </select>
              <label class="col-form-label" for="state">Bundesland</label>
              <div id="stateHelpBlock" class="form-text">
                Je nach Bundesland können der Berechnung verschiedene Werte zugrunde liegen.
              </div>
              <div class="invalid-feedback">Bitte wählen Sie das Bundesland aus, in dem Sie leben</div>
            </div>
            <div class="form-floating">
              <input type="number"
                     name="geb"
                     id="geb"
                     class="form-control"
                     placeholder=" "
                     required
                     autocomplete="off"
                     value=""
                     min="${Datum.getUTCFullYear() - 68}"
                     max="${Datum.getUTCFullYear()}"
                     aria-describedby="stateHelpBlock">
              <label class="col-form-label" for="geb">Geburtsjahr</label>
              <div id="gebHelpBlock" class="form-text">
                Das Jahr, in dem Sie geboren wurden, bestimmt unter anderem das Eintrittsalter für die reguläre Altersrente.
              </div>
              <div class="invalid-feedback">Bitte geben Sie Ihr Geburtsjahr an</div>
              <div class="invalid-min-max-feedback age-63">Das Geburtsjahr muss zwischen ${Datum.getUTCFullYear() - 64} und ${Datum.getUTCFullYear()} sein.</div>
              <div class="invalid-min-max-feedback age-65">Das Geburtsjahr muss zwischen ${Datum.getUTCFullYear() - 66} und ${Datum.getUTCFullYear()} sein.</div>
              <div class="invalid-min-max-feedback age-67">Das Geburtsjahr muss zwischen ${Datum.getUTCFullYear() - 68} und ${Datum.getUTCFullYear()} sein.</div>
              <div class="invalid-age-feedback">Sie dürfen nicht bereits länger als 1 Jahr Rente beziehen, damit wir Ihre Rentenlücke berechnen können.</div>
            </div>
            <div class="form-floating">
              <input type="number"
                     name="alter"
                     id="alter"
                     class="form-control"
                     placeholder=" "
                     required
                     autocomplete="off"
                     data-pattern-message="Der Wert muss größer 0 sein."
                     value=""
                     min="12"
                     max="67"
                     aria-describedby="alterHelpBlock">
              <label class="col-form-label" for="alter">Alter bei Berufseinstieg</label>
              <div class="hint-age d-none">Sie dürfen nicht bereits länger als 1 Jahr Rente beziehen, damit wir Ihre Rentenlücke berechnen können.</div>
              <div id="alterHelpBlock" class="form-text">
                In welchem Alter haben Sie begonnen, als Arbeitnehmer eine Tätigkeit gegen Entgelt zu entrichten? Diese Angabe wird benötigt, um zu ermitteln, wie lang Sie bereits in die Rentenversicherung eingezahlt haben. Es zählt bereits der Beginn einer Berufsausbildung.
              </div>
              <div class="invalid-feedback">Bitte geben Sie das Alter an, mit welchem Sie beruflich tätig wurden</div>
              <div class="invalid-min-max-feedback age-63">Das Alter muss zwischen 12 und 63 sein.</div>
              <div class="invalid-min-max-feedback age-65">Das Alter muss zwischen 12 und 65 sein.</div>
              <div class="invalid-min-max-feedback age-67">Das Alter muss zwischen 12 und 67 sein.</div>
            </div>
            <div class="form-floating">
              <select name="rente" id="rente" class="form-select rente" required aria-describedby="renteHelpBlock">
                <option value="">Bitte wählen</option>
                <option value="63">mit vollendetem 63. Lebensjahr</option>
                <option value="65">mit vollendetem 65. Lebensjahr</option>
                <option value="67">mit vollendetem 67. Lebensjahr</option>
              </select>
              <label class="col-form-label" for="rente">Wann möchten Sie in Rente gehen?</label>
              <div id="renteHelpBlock" class="form-text">
                Das gewünschte Renteneintrittsalter hat Einfluss auf die Höhe Ihrer Rente.
              </div>
              <div class="invalid-feedback">Bitte wählen Sie aus, mit welchem Alter Sie in Rente gehen wollen.</div>
            </div>
            <vorsorge-list></vorsorge-list>
          </form>
          <div class="result-container">
            <div class="headline text-center">
              <slot name="ergebnis-header">Ergebnis</slot>
            </div>
            <div class="provision-chart-container">
              <canvas id="js-doughnut-chart" class="chartjs-render-monitor" width="250" height="250" style="display: block; width: 250px; height: 250px;"></canvas>
            </div>
            <div class="inflation">
              <div class="inflation-label position-relative has-tooltip">
                <div class="inflation-legend">Inflation berücksichtigen?</div>
                <div class="position-absolute tooltip-absolute"
                     data-bs-toggle="tooltip"
                     data-bs-placement="left"
                     title=""
                     data-bs-original-title="Die Inflation sorgt dafür, dass Ihre spätere Rente nicht mehr den gleichen Wert haben wird, wie heute. Die Renten werden zwar jährlich angepasst, steigt die Inflation jedoch stärker als die Renten, können Sie sich später von Ihrem Geld weniger kaufen als heute.">
                  <span class="icon-vt icon-attention-o align-top"></span>
                </div>
              </div>
              <div class="form-switch inflation-switch">
                <input type="checkbox" name="inflationAn" id="inflationAn" class="form-check-input" form="renten-form" data-event-type="click" data-event-category="versicherung" data-event-label="rentenluecke" data-event-action="adjust inflation">
                <label class="form-check-label ms-2" for="inflationAn"><output for="inflationsrate" class="inflation-rate">2.2%</output></label>
              </div>
              <button class="btn inflation-settings" disabled>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-gear-fill" viewBox="0 0 16 16">
                  <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
                </svg>
              </button>
              <dialog class="modal" id="inflation-layer" tabindex="-1" aria-labelledby="inflation-layer-label" aria-hidden="true">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title" id="inflation-layer-label">Einstellungen</h5>
                    <button type="button" class="btn-close" aria-label="Close"></button>
                  </div>
                  <div class="modal-body">
                    <label for="inflationsrate">Bitte wählen Sie die angenommene Höhe der Inflation</label>
                    <div class="slider-container">
                      <input type="range" name="inflationsrate" id="inflationsrate" class="slider js-tooltip-slider" min="0" max="12" step="0.1" form="renten-form" value="2.2">
                      <output for="inflationsrate" class="slider-tooltip" style="left: 50%">2.2%</output>
                    </div>
                  </div>
                  <div class="modal-footer">
                    <input type="button" form="renten-form" name="btn-neu-berechnen" class="btn btn-primary btn-close btn-rente-refresh" value="Neu berechnen" data-bs-dismiss="modal" data-event-type="click" data-event-category="versicherung" data-event-label="rentenluecke" data-event-action="recalc with changed inflation">
                  </div>
                </div>
              </dialog>
            </div>
            <ul class="list-unstyled chart-result-list">
              <li class="row justify-content-between monthly-requirement position-relative has-tooltip">
                <span class="col-8">monatlicher Bedarf im Alter</span>
                <output class="col-4 text-end amount pe-3" id="monthly-requirement-amount" name="monthly-requirement-amount">?</output>
                <div id="amount-tooltip" class="form-text">
                  Experten setzen etwa 80 Prozent des letzten Nettoeinkommens als Richtwert
                          für den Finanzbedarf im Alter an, da als Rentner einige Ausgaben wegfallen. Dies
                          ergibt sich z.B. weil kein finanzieller Aufwand für den Arbeitsweg mehr anfällt,
                          manche Versicherungen nicht mehr gezahlt werden müssen oder das Eigenheim abbezahlt
                          ist und man dort mietfrei wohnen kann.
                </div>
              </li>
              <li class="row justify-content-between future-net-pension position-relative has-tooltip chart-amount-box chart-amount-1 d-none">
                <span class="col-8 type">zu erwartende Nettorente</span>
                <output class="col-4 text-end amount pe-3" id="future-net-pension-amount" name="future-net-pension-amount">?</output>
                <div id="rente-tooltip" class="form-text">
                  Auch bei Alterseinkünften werden Sozialabgaben und Steuern fällig. Die Nettorente ist der Geldbetrag, der nach Abzug dieser übrig bleibt.
                </div>
              </li>
              <li class="row justify-content-between actual-pension position-relative has-tooltip chart-amount-box chart-amount-2 d-none">
                <span class="col-8 type">bestehende Vorsorge <sup>*</sup></span>
                <output class="col-4 text-end amount pe-3" id="actual-pension-amount" name="actual-pension-amount">?</output>
                <div id="vorsorge-tooltip" class="form-text">
                  <p>Diese Leistungen erhalten Sie aus Ihrer bestehenden Vorsorge.</p>
                  <p><sup>*</sup> Bitte beachten Sie, dass auch hier in Abhängigkeit von der Art Ihrer Vorsorge eventuell Steuer- und Sozialversicherungsabgaben anfallen.</p>
                </div>
              </li>
              <li class="row justify-content-between pension-gap position-relative has-tooltip chart-amount-box chart-amount-3">
                <span class="col-8 type">Rentenlücke</span>
                <output class="col-4 text-end amount pe-3" id="pension-gap-amount" name="pension-gap-amount">?</output>
                <div id="diff-tooltip" class="form-text">
                  Die Differenz zwischen Ihrer zu erwartenden Rente und dem benötigten Einkommen wird als Rentenlücke bezeichnet.
                </div>
                <div class="no-gap-hint-text mt-3 mx-3 d-none">
                    <strong>Hinweis:</strong> Es konnte keine Rentenlücke ermittelt werden.
                </div>
              </li>
            </ul>
          </div>
          <div class="text-center button-container">
            <button type="submit" name="btn-berechnen" class="btn" form="renten-form">Berechnen</button>
          </div>
        </div>
        <div class="text-container">
          <slot name="outtro"></slot>
        </div>
      </div>
    `;
    }

    updateChart(erwarteteRente: number, bestehendeVorsorge: number, rentenluecke: number): void {
        if (null === this.chartObject) {
            return;
        }

        this.chartObject.data.datasets[0].data = [erwarteteRente, bestehendeVorsorge, rentenluecke];

        if (this.chartObject.options.plugins && this.chartObject.options.plugins.title) {
            this.chartObject.options.plugins.title.text = `Rentenlücke: ${new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'EUR',
            }).format(rentenluecke)}`;
        }

        this.chartObject.update();
    }

    slider(): void {
        const sliderTooltips = this.root.querySelectorAll<HTMLOutputElement>('.slider-tooltip');

        if (sliderTooltips.length === 0) {
            return;
        }

        const sliders = this.root.querySelectorAll<HTMLInputElement>('.js-tooltip-slider');

        sliders.forEach((slider: HTMLInputElement): void => {
            const sliderValue = parseFloat(slider.value),
                sliderMax = parseFloat(slider.max),
                sliderMin = parseFloat(slider.min);

            if (isNaN(sliderValue)) {
                slider.value = '0';
            }

            const sliderTooltip = sliderTooltips[0],
                value = ((sliderValue - sliderMin) * 100) / (sliderMax - sliderMin),
                percentOfRange = isNaN(value) ? 0 : value,
                newPosition = -18 - (15 * percentOfRange) / 100;

            sliderTooltip.style.left = `calc(${percentOfRange}% + (${newPosition}px))`;
        });
    }
}

export default RL;
