
class VorsorgeList extends HTMLElement {
  private root: ShadowRoot;
  private pensions:Array<{ id: number; amount: number; type: string; }> = [];
  private pensionExsists: boolean = false;

  constructor() {
    super();

    this.root = this.attachShadow({mode: 'closed'});
  }

  connectedCallback() {
    this.root.innerHTML = this.render();

    const pensionsAvailableFields = this.root.querySelectorAll<HTMLInputElement>('.js-pensions-available');
    const pensionsFields = this.root.querySelectorAll<HTMLInputElement>('.pensions-available');
    const addButtons = this.root.querySelectorAll<HTMLTableSectionElement>('.js-add-button');

    pensionsAvailableFields.forEach(field => {
      field.addEventListener('change', event => {
        event.preventDefault();
        event.stopPropagation();

        this.pensionExsists = field.checked;

        if (field.checked) {
          pensionsFields.forEach(pensionsField => {
            pensionsField.classList.remove('d-none');
          });
        } else {
          pensionsFields.forEach(pensionsField => {
            pensionsField.classList.add('d-none');
          });

          this.pensions = [];

          this.renderTable();
        }
      });
    });
    pensionsFields.forEach(pensionsField => {
      if (this.pensionExsists) {
        pensionsField.classList.remove('d-none');
      } else {
        pensionsField.classList.add('d-none');
      }
    });
    addButtons.forEach(addButton => {
      addButton.addEventListener('click', () => {
        const vorsorgeart = this.root.querySelectorAll<HTMLInputElement>('[name="vorsorgeart"]:checked');
        const vorsorgebetrag = this.root.querySelectorAll<HTMLInputElement>('[name="vorsorgebetrag"]');

        if (vorsorgeart.length === 0 || vorsorgebetrag.length === 0) {
          return;
        }

        this.pensions.push({id: this.pensions.length, amount: parseInt(vorsorgebetrag[0].value, 10), type: vorsorgeart[0].value});

        this.renderTable();

        let summaryPension = 0;

        this.pensions.forEach(pension => {
          summaryPension += pension.amount;
        });

        this.dispatchEvent(
          new CustomEvent<PensionInfo>(
            'pension.added',
            {
              'detail': {
                summary: summaryPension,
                bubbles: true, // Whether the event will bubble up through the DOM or not
                cancelable: false, // Whether the event may be canceled or not
              }
            }
          )
        );
      }, false);
    });

    this.renderTable();
  }

  attributeChangedCallback(attrName: string, oldVal: string|null, newVal: string|null) {
    if ('class' === attrName) {
      const bases = this.root.querySelectorAll<HTMLInputElement>('.list-base');

      bases.forEach(base => {
        if (null !== oldVal) {
          base.classList.remove(oldVal);
        }

        if (null !== newVal) {
          base.classList.add(newVal);
        }
      });
    }
  }

  diconnectedCallback() {
    // nothing to do at the moment
  }

  static get observedAttributes(): Array<string> {
    return ['class'];
  }

  get class(): string|null {
    return this.getAttribute('class');
  }

  set class(classVal: string|null) {
    if (classVal) {
      this.setAttribute('class', classVal);
    } else {
      this.setAttribute('class', '');
    }
  }

  private renderTable(): void {
    const pensionsAvailable = this.root.querySelectorAll<HTMLTableSectionElement>('.js-pensions-rows-available');
    const noPensionsAvailable = this.root.querySelectorAll<HTMLTableSectionElement>('.js-no-pensions-rows-available');

    noPensionsAvailable.forEach(tfoot => {
      if (this.pensions.length) {
        tfoot.classList.add('d-none');
      } else {
        tfoot.classList.remove('d-none');
      }
    });
    pensionsAvailable.forEach(tbody => {
      tbody.innerHTML = '';

      if (this.pensions.length) {
        tbody.classList.remove('d-none');

        this.pensions.forEach(pension => {
          tbody.innerHTML += `<tr class="added-pension-item row row-nowrap" data-id="${pension.id}"><td class="added-pension-type col-8 pe-0">${pension.type}</td><td class="added-pension-amount col-4 text-end position-relative">${new Intl.NumberFormat('de-DE', {style: 'currency', currency: 'EUR'}).format(pension.amount)}</td></tr>`;
        });
      } else {
        tbody.classList.add('d-none');
      }
    });


  }

  private getStyle(): string {
    return `
    <style>
        *,*::before,*::after {
            box-sizing: border-box
        }
        .form-floating, .position-relative {
            position: relative;
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
        .optional~.form-text, .inline-block~.form-text {
            padding: 0.25rem 0.75rem 0.25rem 0;
        }
        .added-pension {
            margin-bottom: 0.625rem;
            padding: 0;
            background: #fff;
            text-align: left;
            font-weight: 300;
        }
        .added-pension .added-pension-headline {
            padding-bottom: 0.625rem;
        }
        .added-pension .added-pension-item:last-child {
            border-bottom: 1px solid #ebecee;
        }
        .added-pension .added-pension-item {
            margin: 0 1.875rem 0 0;
            padding: 0.625rem 0.3125rem;
            border-left: 4px solid #ebecee;
            border-top: 1px solid #ebecee;
            border-right: 1px solid #ebecee;
            line-height: 1.25rem;
            color: #495057;
            font-size: 0.875rem;
            display: flex;
            flex-direction: row;
            align-items: center;
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
        .form-check-inline {
            display: inline-block;
            margin-right: 1rem;
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
        .button-box {
            padding-top: 1.5rem;
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
        .justify-content-between {
            justify-content: space-between !important;
        }
        .text-end {
            text-align: end !important;
        }
        .pe-0 {
            padding-right: 0 !important;
        }
        .col-8 {
            flex: 0 0 auto;
            width: 66.66666667%;
        }
        .col-4 {
            flex: 0 0 auto;
            width: 33.33333333%;
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
        fieldset > * {
            flex-shrink: 0;
            width: 100%;
            max-width: 100%;
        }
        legend {
            float: left;
            width: 100%;
            padding: 0;
            margin-bottom: 0.5rem;
            line-height: inherit;
        }
        table {
            width: 100%;
        }
        caption {
            display: table-caption;
            text-align: start;
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

  private render(): string {
    return `
      ${this.getStyle()}
      <div class="list-base">
        <div class="row">
          <div class="form-switch inflation-switch">
            <input type="checkbox" name="vorsorgevorhanden" id="vorsorgevorhanden" class="form-check-input js-pensions-available" aria-describedby="askHelpBlock"${this.pensionExsists ? ' checked' : ''}>
            <label class="form-check-label ms-2 optional" for="vorsorgevorhanden">Besteht bereits eine Vorsorge?</label>
            <div id="askHelpBlock" class="form-text">
              Bereits bestehende Altersvorsorgeverträge verringern Ihre Rentenlücke.
            </div>
          </div>
        </div>
        <div class="pensions-available added-pension-wrapper my-4 d-none">
          <table class="added-pension">
            <caption class="added-pension-headline">Bereits bestehende Vorsorgen:</caption>
            <tbody class="js-pensions-rows-available added-pension-content d-none">
              <tr class="added-pension-item row row-nowrap"></tr>
            </tbody>
            <tfoot class="js-no-pensions-rows-available added-pension-content d-none">
              <tr class="added-pension-item row row-nowrap">
                <td colspan="2">Es wurden noch keine Vorsorgen eingegeben</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <fieldset class="pensions-available d-none">
          <legend class="mb-2 has-tooltip row row-nowrap">
            <div class="inline-block">Ist die Vorsorge betrieblich oder privat?</div>
            <div class="form-text">Betreiben Sie die Altersvorsorge über Ihren Arbeitgeber oder haben Sie privat Verträge abgeschlossen?</div>
          </legend>
          <div class="row row-nowrap">
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="vorsorgeart" id="vorsorgeart_betrieblich" value="betrieblich">
              <label class="form-check-label" for="vorsorgeart_betrieblich">betrieblich</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="vorsorgeart" id="vorsorgeart_privat" value="privat">
              <label class="form-check-label" for="vorsorgeart_privat">privat</label>
            </div>
          </div>
          <div class="js-pension-amount form-floating">
            <input type="number" name="vorsorgebetrag" id="vorsorgebetrag" class="form-control" placeholder=" " aria-label="Höhe der monatlichen Rente aus dieser Vorsorge in Euro" min="1" value="" required>
            <label class="col-form-label" for="vorsorgebetrag">Höhe der monatlichen Rente aus dieser Vorsorge</label>
            <div class="invalid-feedback">Bitte geben Sie Ihr Nettogehalt an</div>
            <div class="invalid-min-feedback">Der Wert muss größer 0 sein.</div>
          </div>
        </fieldset>
        <div class="pensions-available text-start d-none button-box">
          <button class="btn btn-sm btn-outline-primary js-add-button">Vorsorge hinzufügen</button>
        </div>
      </div>
    `;
  }
}

export default VorsorgeList;
