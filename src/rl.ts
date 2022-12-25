
import Chart from 'chart.js/auto';
import { createPopper } from '@popperjs/core/lib/popper-lite.js';
import preventOverflow from '@popperjs/core/lib/modifiers/preventOverflow.js';
import flip from '@popperjs/core/lib/modifiers/flip.js';

class RL extends HTMLElement {
  private root: ShadowRoot;
  constructor() {
    super();

    this.root = this.attachShadow({mode: 'closed'});
  }

  connectedCallback() {
    console.log('connectedCallback hook');
    this.root.innerHTML = this.render();

    const forms = this.root.querySelectorAll<HTMLFormElement>('.needs-validation');

    forms.forEach(form => {
      form.addEventListener('submit', event => {
        event.preventDefault();
        event.stopPropagation();

        form.checkValidity();

        form.classList.add('was-validated');
      }, false);
    });

    const fields = this.root.querySelectorAll<HTMLFormElement>('.needs-validation input, .needs-validation select');

    fields.forEach(field => {
      field.addEventListener('blur', event => {
        event.preventDefault();
        event.stopPropagation();

        field.classList.add('was-edited');
      }, false);
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

      function show() {
        if (null === tooltip) {
          return;
        }

        tooltip.setAttribute('data-show', '');

        // We need to tell Popper to update the tooltip position
        // after we show the tooltip, otherwise it will be incorrect
        popperInstance.update();
      }

      function hide() {
        if (null === tooltip) {
          return;
        }

        tooltip.removeAttribute('data-show');
      }

      const showEvents = ['mouseenter', 'focus'];
      const hideEvents = ['mouseleave', 'blur'];

      showEvents.forEach((event) => {
        button.addEventListener(event, show);
      });

      hideEvents.forEach((event) => {
        button.addEventListener(event, hide);
      });
    });

    const inflationsButtons = this.root.querySelectorAll<HTMLButtonElement>('.inflation-settings');
    const layer = this.root.getElementById('inflation-layer');

    inflationsButtons.forEach((button: HTMLButtonElement): void => {
      if (null === layer || !(layer instanceof HTMLDialogElement)) {
        return;
      }

      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();

        layer.showModal();
        layer.setAttribute('aria-hidden', 'false');


      }, false);
    });

    const inflationsrate = this.root.getElementById('inflationsrate');

    if (null !== inflationsrate && inflationsrate instanceof HTMLInputElement) {
      const sliderTooltips = this.root.querySelectorAll<HTMLOutputElement>('.slider-tooltip');
      const sliderRate = this.root.querySelectorAll<HTMLOutputElement>('.inflation-rate');

      inflationsrate.addEventListener('input', event => {
        event.preventDefault();
        event.stopPropagation();

        sliderTooltips.forEach(sliderTooltip => {
          sliderTooltip.value = inflationsrate.value + '%';
        });
        sliderRate.forEach(sliderTooltip => {
          sliderTooltip.value = inflationsrate.value + '%';
        });
      }, false);
    }

    const modalCloseButtons = this.root.querySelectorAll<HTMLButtonElement>('.btn-close');

    modalCloseButtons.forEach(modalCloseButton => {
      if (null === layer || !(layer instanceof HTMLDialogElement)) {
        return;
      }

      modalCloseButton.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();

        layer.close();

        forms.forEach(form => {
          form.dispatchEvent(
              new SubmitEvent('submit')
          );
        });
      }, false);
    });

    const erwarteteRenteProzent = 7;
    const bestehendeVorsorgeProzent = 2;
    const rentenlueckeProzent = 100;
    const chart = this.root.getElementById('js-doughnut-chart');

    if (null === chart || !(chart instanceof HTMLCanvasElement)) {
      return;
    }

    new Chart(
        chart,
        {
          type: 'doughnut',
          options: {
            responsive: true,
            maintainAspectRatio: true,
            // @ts-ignore
            cutoutPercentage: 93
          },
          data: {
            datasets: [{
              data: [erwarteteRenteProzent, bestehendeVorsorgeProzent, rentenlueckeProzent],
              backgroundColor: ['rgb(44, 193, 213)', 'rgb(0, 94, 151)', 'rgb(255, 30, 0)'],
              borderColor: ['#ffffff', '#888', '#000'],
              borderWidth: 0,
              borderAlign: 'inner',
              weight: 0.1
            }]
          }
        }
    );
  }

  attributeChangedCallback(/*attrName: string, oldVal: string, newVal: string/**/) {
    // nothing to do at the moment
    console.log('attributeChangedCallback hook');
  }

  diconnectedCallback() {
    // nothing to do at the moment
    console.log('diconnectedCallback hook');
  }

  static get observedAttributes() {
    return ['class'];
  }

  get class() {
    return this.getAttribute('class');
  }

  set class(classVal: string|null) {
    if (classVal) {
      this.setAttribute('class', classVal);
    } else {
      this.setAttribute('class', '');
    }
  }

  getStyle() {
    return `
    <style>
        *,*::before,*::after {
            box-sizing: border-box
        }
        .container {
            all: initial;
        }
        .text-container, .calculation-container {
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
        .calculation-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: min-content;
            grid-template-areas:
                'form result'
                'button button';
            
            gap: 1.5rem;
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
        .was-validated [min][max]:out-of-range~.invalid-min-max-feedback, 
        .was-edited[min][max]:out-of-range~.invalid-min-max-feedback,
        .was-validated [min]:not([max]):out-of-range~.invalid-min-feedback,
        .was-edited[min]:not([max]):out-of-range~.invalid-min-feedback,
        .was-validated:has(.form-control:invalid, .form-select:invalid) .alert-warning {
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
        .invalid-feedback, .invalid-min-max-feedback, .invalid-min-feedback, .form-text {
            padding: 0.25rem 0.75rem 0.25rem;
            font-size: var(--vt-helptext-fontsize, .875em);
        }
        .invalid-feedback, .invalid-min-max-feedback, .invalid-min-feedback {
            display: none;
            width: 100%;
            color: var(--vt-form-invalid-color, #dc3545);
        }
        .form-text {
            color: var(--vt-helptext-color, #6c757d);
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
            width: 10.9375rem;
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
            margin-top: 0.9375rem;
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
            bottom: 2.5625rem;
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
            grid-auto-columns: 66.66666667% 25% 8.33333333%;
            grid-template-areas:
                'label price help'
                'info info info';
        }
        .col-8 {
            grid-area: label;
        }
        .col-3 {
            grid-area: price;
        }
        .col-1 {
            grid-area: help;
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
    </style>
    `;
  }

  render() {
    const Datum = new Date();
    return `
      ${this.getStyle()}
      <div class="container">
        <h1 class="headline">Rentenlückenrechner</h1>
        <div class="text-container">
          <slot name="intro">
            <p>Sie fragen sich, wie hoch Ihre Rente später ausfällt und ob Ihnen das Geld zum Leben reichen wird?</p>
            <p>Die Differenz zwischen der zu erwartenden Rente und dem heutigen Einkommen bezeichnet man als Rentenlücke oder auch Versorgungslücke. Mit unserem Rentenrechner finden Sie heraus, wie groß diese Lücke ist!</p>
            <p>Die Berechnung soll Ihnen helfen, Ihre zukünftige finanzielle Situation besser einzuschätzen. Die ermittelte Rentenlücke ist eine erste Orientierung dafür, wie viel Sie zusätzlich zur gesetzlichen Rente vorsorgen müssen, um auch im Alter Ihren Lebensstandard zu halten. So können Sie Ihre private Altersvorsorge besser planen!</p>
          </slot>
        </div>
        <div class="calculation-container">
          <form class="form-container needs-validation" name="renten-form" id="renten-form" accept-charset="utf-8" novalidate>
            <div class="headline text-center">Rentenlücke berechnen</div>
            <div class="alert alert-danger d-none" role="alert">
              Es ist ein Fehler aufgetreten!
            </div>
            <div class="alert alert-warning" role="alert">
              Ihre angegebenen Daten sind nicht korrekt!
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
              <label class="col-form-label" for="netto">Monatliches Netto </label>    
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
                     min="${Datum.getUTCFullYear() - 120}"
                     max="${Datum.getUTCFullYear()}"
                     aria-describedby="stateHelpBlock">                            
              <label class="col-form-label" for="geb">Geburtsjahr</label>       
              <div id="gebHelpBlock" class="form-text">
                Das Jahr, in dem Sie geboren wurden, bestimmt unter anderem das Eintrittsalter für die reguläre Altersrente.
              </div>
              <div class="invalid-feedback">Bitte geben Sie Ihr Geburtsjahr an</div>
              <div class="invalid-min-max-feedback">Das Jahr muss zwischen ${Datum.getUTCFullYear() - 120} und ${Datum.getUTCFullYear()} sein.</div>
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
                     max="100"
                     aria-describedby="alterHelpBlock">                            
              <label class="col-form-label" for="alter">Alter bei Berufseinstieg</label>                            
              <div class="hint-age d-none">Sie dürfen nicht bereits länger als 1 Jahr Rente beziehen, damit wir Ihre Rentenlücke berechnen können.</div>       
              <div id="alterHelpBlock" class="form-text">
                In welchem Alter haben Sie begonnen, als Arbeitnehmer eine Tätigkeit gegen Entgelt zu entrichten? Diese Angabe wird benötigt, um zu ermitteln, wie lang Sie bereits in die Rentenversicherung eingezahlt haben. Es zählt bereits der Beginn einer Berufsausbildung.
              </div>
              <div class="invalid-feedback">Bitte geben Sie das Alter an, mit welchem Sie beruflich tätig wurden</div>
              <div class="invalid-min-max-feedback">Das Alter muss zwischen 12 und 100 sein.</div>
            </div>
            <div class="form-floating">
              <select name="rente" id="rente" class="form-select" required aria-describedby="renteHelpBlock">
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
            <fieldset class="form-floating">
              <legend class="optional">Besteht bereits eine Vorsorge?</legend>
              <div class="form-check">
                <input type="radio" name="vorsorgevorhanden" id="vorsorgevorhanden_ja" class="form-check-input" value="ja">
                <label class="form-check-label" for="vorsorgevorhanden_ja">ja</label>
              </div>
              <div class="form-check">
                <input type="radio" name="vorsorgevorhanden" id="vorsorgevorhanden_nein" class="form-check-input" value="nein">
                <label class="form-check-label" for="vorsorgevorhanden_nein">nein</label>
              </div>
              <div class="added-pension-wrapper my-4 d-none">
                <div class="added-pension">
                  <div class="added-pension-headline">Bereits bestehende Vorsorgen:</div>
                  <div class="added-pension-content"></div>
                  <div class="culmulated-pension d-none"><span></span> €</div>
                </div>
              </div>
              <div class="text-start js-more-pension d-none">
                <div><label class="mb-2" for="weiterevorsorge_ja">Besteht eine weitere Vorsorge?</label></div>
                <div>
                  <label class="form-radio me-4" for="weiterevorsorge_ja"><input type="radio" name="weiterevorsorge" id="weiterevorsorge_ja" class="form-radio-input me-1" value="ja">ja</label>
                  <label class="form-radio" for="weiterevorsorge_nein"><input type="radio" name="weiterevorsorge" id="weiterevorsorge_nein" class="form-radio-input me-1" value="nein">nein</label>
                </div>
              </div>
              <div class="text-start position-relative js-pension-type js-collapse-pension-amount form-floating d-none">
                <div class="position-absolute tooltip-absolute" 
                     data-bs-toggle="tooltip" 
                     data-bs-placement="left" 
                     title="" 
                     data-bs-original-title="Betreiben Sie die Altersvorsorge über Ihren Arbeitgeber oder haben Sie privat Verträge abgeschlossen?">
                  <span class="icon-vt icon-attention-o"></span>
                </div>
                <div><label class="mb-2" for="vorsorgeart_betrieblich">Ist die Vorsorge betrieblich oder privat?</label></div>
                <div>
                  <label class="form-radio me-4" for="vorsorgeart_betrieblich"><input type="radio" name="vorsorgeart_1" id="vorsorgeart_betrieblich" class="form-radio-input me-1 js-initial-required form-control-danger" value="betrieblich">betrieblich</label>
                  <label class="form-radio" for="vorsorgeart_privat"><input type="radio" name="vorsorgeart_1" id="vorsorgeart_privat" class="form-radio-input me-1 js-initial-required" value="privat">privat</label>
                </div>
              </div>
              <div class="js-pension-amount form-floating d-none">
                  <input type="number" name="vorsorgebetrag_1" id="vorsorgebetrag" class="form-control js-additional-pension js-initial-required" placeholder="Höhe der monatlichen Rente aus dieser Vorsorge in Euro" data-pattern-message="Der Wert muss größer 0 sein." value="">                            
                  <label class="col-form-label" for="vorsorgebetrag">Höhe der monatlichen Rente aus dieser Vorsorge</label>                        
              </div>
              <div class="text-start js-collapse-more-pension d-none">
                <a href="#" class="js-add-insurance btn btn-sm btn-outline-primary js-init-edit-button">weitere Vorsorge hinzufügen</a>
              </div>
            </fieldset>      
            <div id="askHelpBlock" class="form-text">
              Bereits bestehende Altersvorsorgeverträge verringern Ihre Rentenlücke.
            </div>
          </form>
          <div class="result-container">
            <div class="headline text-center">Ergebnis</div>
            <div class="provision-chart-container">
              <div class="chartjs-size-monitor">
                <div class="chartjs-size-monitor-expand">
                  <div class=""></div>
                </div>
                <div class="chartjs-size-monitor-shrink">
                  <div class=""></div>
                </div>
              </div>
              <div class="provision-chart-sum">
                <span class="provision-chart-legend">Rentenlücke</span>
                <span class="provision-chart-amount">?</span>
              </div>
              <canvas id="js-doughnut-chart" class="provision-chart chartjs-render-monitor" width="250" height="250" style="display: block; width: 250px; height: 250px;"></canvas>
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
                <label class="form-check-label ms-2" for="inflationAn"><output for="inflationsrate" class="inflation-rate">0.0%</output></label>                            
              </div>
              <button class="btn inflation-settings">
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
                      <output for="inflationsrate" class="slider-tooltip">0.0%</output>
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
                <output class="col-3 text-end amount pe-3" id="monthly-requirement-amount" name="monthly-requirement-amount">?</output>
                <span class="col-1"></span>
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
                <output class="col-3 text-end amount pe-3" id="future-net-pension-amount" name="future-net-pension-amount">?</output>
                <span class="col-1"></span>
                <div id="rente-tooltip" class="form-text">
                  Auch bei Alterseinkünften werden Sozialabgaben und Steuern fällig. Die Nettorente ist der Geldbetrag, der nach Abzug dieser übrig bleibt.
                </div>
              </li>
              <li class="row justify-content-between actual-pension position-relative has-tooltip chart-amount-box chart-amount-2 d-none">
                <span class="col-8 type">bestehende Vorsorge</span>
                <output class="col-3 text-end amount pe-3" id="actual-pension-amount" name="actual-pension-amount">?</output>
                <span class="col-1"></span>
                <span class="additional-pension-hint">*</span>
                <div id="vorsorge-tooltip" class="form-text">
                  Diese Leistungen erhalten Sie aus Ihrer bestehenden Vorsorge.
                </div>
              </li>
              <li class="row justify-content-between pension-gap position-relative has-tooltip chart-amount-box chart-amount-3">
                <span class="col-8 type">Rentenlücke</span>
                <output class="col-3 text-end amount pe-3" id="pension-gap-amount" name="pension-gap-amount">?</output>
                <span class="col-1"></span>
                <div id="diff-tooltip" class="form-text">
                  Die Differenz zwischen Ihrer zu erwartenden Rente und dem benötigten Einkommen wird als Rentenlücke bezeichnet.
                </div>
                <div class="no-gap-hint-text mt-3 mx-3 d-none">
                    <strong>Hinweis:</strong> Es konnte keine Rentenlücke ermittelt werden.
                </div>
              </li>
            </ul>
            <div class="additional-pension-hint-text mt-3 mt-md-0 d-none">
              * Bitte beachten Sie, dass auch hier in Abhängigkeit von der Art Ihrer Vorsorge eventuell Steuer- und Sozialversicherungsabgaben anfallen.
            </div>
          </div>
          <div class="text-center button-container">
            <button type="submit" name="btn-berechnen" class="btn" form="renten-form">Berechnen</button>
          </div>
        </div>
        <div class="text-container">
          <slot name="outtro">
            <p>Private Altersvorsorge ist wichtig, wenn Sie Ihren Lebensstandard im Alter in etwa auf gleichem Niveau halten möchten. Im besten Fall können Sie Ihre Rentenlücke durch eine private Altersvorsorge komplett schließen oder zumindest minimieren!</p>
            <p>Bitte beachten Sie, dass diese Beispielrechnung keine persönliche Beratung ersetzen kann!</p>
            <p>Es gibt eine Menge Faktoren, die beeinflussen, wie hoch die Rente am Ende wirklich ausfällt. Diese sind nicht immer einzuschätzen. Hier handelt es sich beispielsweise um Inflation, Steuern, aber auch Zinsentwicklungen mit Auswirkungen auf Sparanlagen. Auch verschiedene Lebensereignisse können Auswirkungen haben, wie ein Jobwechsel, Kinder oder Scheidung.</p>
            <p>Wir weisen Sie darauf hin, dass die Ergebnisse der Berechnungen lediglich eine vereinfachte und abstrahierte Schätzung darstellt, die als Orientierungshilfe dienen soll. Die modellhafte Rückrechnung auf ein jährliches Bruttoeinkommen basiert auf den Vorgaben des Bundesfinanzministeriums. Der ermittelte monatliche Rentenwert wurde mittels eines speziellen Näherungsverfahrens auf Basis der gemachten Angaben und auf Grundlage der derzeitigen gesetzlichen Rahmenbedingungen berechnet. Um die Handhabung für den Nutzer zu vereinfachen, werden u.a. Annahmen zum Krankenkassenstatus und der Kirchenzugehörigkeit getroffen, die auf statistischen Werten des Bundesgesundheitsministeriums und des Statistischen Bundesamtes beruhen.</p>
            <p>Bitte beachten Sie, dass die in der Berechnung abgefragten einzelnen Faktoren lediglich einen Ausschnitt Ihrer Situation zum aktuellen Zeitpunkt darstellen. Auch künftige gesetzliche Entwicklungen können hier nicht berücksichtigt werden. Da die Höhe der monatlichen gesetzlichen Erwerbsminderungsrente von vielen verschiedenen individuellen Faktoren abhängt, kann Ihre tatsächliche Rente niedriger, aber auch höher ausfallen.</p>
            <p>Einen Anspruch kann Ihnen aus keiner der hier gemachten Berechnungen abgeleitet werden. Für die Richtigkeit, Aktualität und Vollständigkeit der Rechenergebnisse übernimmt Jung, DMS. &amp; Cie. keine Haftung.</p>
          </slot>
        </div>
      </div>
    `;
  }
}

export default RL;
