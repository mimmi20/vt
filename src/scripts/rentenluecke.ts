
import * as STATES from './states';
import * as CONFIG from './calc.config';
import BruttoCalculation from './brutto-calc.2021';
import BaseCalculation from './base-calc.2021';
import KstCalculation from './kst-calc.2021';
import {escapeHtml} from "./base";

export default class Rentenluecke {
    public static setRateVal(setChecked: boolean): string {
        const inflationRate = document.querySelectorAll<HTMLElement>('#inflationsrate'),
            inflationActiv = document.querySelectorAll<HTMLElement>('#inflationAn');

        let rateVal = '0.0';

        if (!inflationRate.length || !inflationActiv.length || !(inflationActiv[0] instanceof HTMLInputElement) || !(inflationRate[0] instanceof HTMLInputElement)) {
            console.error('could not detect inflation');
            return rateVal;
        }

        if (setChecked) {
            inflationActiv[0].setAttribute('checked', 'checked');
        } else {
            inflationActiv[0].removeAttribute('checked');
        }

        if (inflationActiv[0].hasAttribute('checked') && inflationActiv[0].getAttribute('checked')) {
            rateVal = inflationRate[0].value || rateVal;
        }

        return rateVal;
    }

    public static handleSlider(el: HTMLInputElement): void {
        const tooltips = document.querySelectorAll<HTMLDivElement>('.js-slider-tooltip');

        if (tooltips.length === 0) {
            return;
        }

        const sliderValue = parseFloat(el.value),
            sliderMax = parseFloat(el.max),
            sliderMin = parseFloat(el.min);

        if (isNaN(sliderValue)) {
            el.value = '0';
        }

        const tooltip = tooltips[0],
            value = ((sliderValue - sliderMin) * 100) / (sliderMax - sliderMin),
            percentOfRange = isNaN(value) ? 0 : value,
            newPosition = -18 - (15 * percentOfRange) / 100;

        tooltip.innerHTML = '<span>' + sliderValue.toFixed(1) + '%' + '</span>';
        tooltip.style.left = `calc(${percentOfRange}% + (${newPosition}px))`;
    }

    public static calculate(
        state: string,
        taxClass: number,
        netto: number,
        anzahl: number,
        geburtsjahr: number,
        rente: number,
        alterBerufseinstieg: number,
        inflationsrate: number,
        inflationAn: boolean,
        lzz: number,
        stTabelle: number,
        pvz: boolean,
        r: number,
        zkf: number
    ) {
        /* Variables */

        const wunschBrutto = netto * anzahl,
            monatsBedarf = netto * 0.8,
            anzahlJahre = rente - alterBerufseinstieg,
            einzahlDauer = rente - new Date().getFullYear() + geburtsjahr,
            bruttoCalc = new BruttoCalculation();

        // calculation
        const result = bruttoCalc.calculate(state, taxClass, wunschBrutto, lzz, stTabelle, pvz, r, zkf);

        let regelaltersgrenze, rentenwert, jahresEntgeltpunkte, zugangsfaktor, rentensteuerAnteil;

        if (geburtsjahr < 1947) {
            regelaltersgrenze = 65;
        } else if (geburtsjahr < 1964) {
            regelaltersgrenze = 66;
        } else {
            regelaltersgrenze = 67;
        }

        if (STATES.isStateWest(state)) {
            rentenwert = CONFIG.RENTENWERT_WEST;
            jahresEntgeltpunkte = result.brutto / CONFIG.AVERAGE_YEARLY_INCOME_WEST;
        } else if (STATES.isStateEast(state)) {
            rentenwert = CONFIG.RENTENWERT_OST;
            jahresEntgeltpunkte = result.brutto / CONFIG.AVERAGE_YEARLY_INCOME_EAST;
        } else {
            // error
            console.error('invalid state: ' + state);

            return {
                valid: false,
                monatsBedarf: 0,
                monatsRente: 0,
                nettoRente: 0,
                kv: 0,
                steuer: 0
            };
        }

        if (inflationAn && inflationsrate > 0.0) {
            rentenwert *= Math.pow(1 + CONFIG.RENTEN_FAKTOR_BEREINIGUNG, einzahlDauer);
        }

        const entgeltpunkte = anzahlJahre * jahresEntgeltpunkte;
        const alterDiff = regelaltersgrenze - rente;

        if (alterDiff === 0) {
            zugangsfaktor = 1;
        } else if (alterDiff === 2) {
            zugangsfaktor = 0.93;
        } else if (alterDiff === 4) {
            zugangsfaktor = 0.86;
        } else if (alterDiff === -2) {
            zugangsfaktor = 1.12;
        } else if (alterDiff === -4) {
            zugangsfaktor = 1.24;
        } else {
            // error
            console.error('invalid age diff', regelaltersgrenze, rente);

            return {
                valid: false,
                monatsBedarf: 0,
                monatsRente: 0,
                nettoRente: 0,
                kv: 0,
                steuer: 0
            };
        }

        const monatsRente = entgeltpunkte * zugangsfaktor * rentenwert * CONFIG.RENTEN_TYP_FAKTOR;
        const jahrRenteneintritt = geburtsjahr + rente;

        if (jahrRenteneintritt >= 2040) {
            rentensteuerAnteil = 1;
        } else if (jahrRenteneintritt >= 2020) {
            rentensteuerAnteil = 1 - (2040 - jahrRenteneintritt) / 100;
        } else {
            // error
            console.error('invalid pension start');

            return {
                valid: false,
                monatsBedarf: 0,
                monatsRente: 0,
                nettoRente: 0,
                kv: 0,
                steuer: 0
            };
        }

        const baseCalc = new BaseCalculation(),
            kstCalc = new KstCalculation();
        baseCalc.calculate(state, taxClass, monatsRente * 12 * rentensteuerAnteil, lzz, stTabelle, pvz, r, zkf);

        const steuer = baseCalc.getLstlzz() / 100 / 12,
            kst = kstCalc.calculate(state, baseCalc.getBk()) / 12,
            kv = monatsRente * CONFIG.KV_FAKTOR_RENTE;
        let nettoRente = monatsRente - kv - steuer - kst;

        if (inflationAn && inflationsrate > 0.0) {
            nettoRente *= Math.pow(1 + inflationsrate / 100, -1 * einzahlDauer);
        }

        return {
            valid: true,
            monatsBedarf: Math.round(monatsBedarf * 100) / 100,
            monatsRente: Math.round(monatsRente * 100) / 100,
            nettoRente: Math.round(nettoRente * 100) / 100,
            kv: Math.round(kv * 100) / 100,
            steuer: Math.round((steuer + kst) * 100) / 100,
        };
    }

    /**
     *
     * @param bedarf
     * @param monatsRenteMinusSteuerUndVersicherung
     * @param bestehendeVorsorge
     */
    public static updateChart(bedarf: number, monatsRenteMinusSteuerUndVersicherung: number, bestehendeVorsorge: number): void {
        const chartBackground = document.querySelectorAll<HTMLElement>('.circle-chart__background');

        if (!chartBackground.length) {
            console.error('no charts found');
            return;
        }

        const erwarteteRenteProzent = (monatsRenteMinusSteuerUndVersicherung * 100) / bedarf;
        const chartVorsorge = document.querySelectorAll<HTMLElement>('.circle-chart__circle_vorsorge');

        if (bestehendeVorsorge > 0 && chartVorsorge.length) {
            let bestehendeVorsorgeProzent = (bestehendeVorsorge * 100) / bedarf;

            if (erwarteteRenteProzent + bestehendeVorsorgeProzent > 100) {
                bestehendeVorsorgeProzent = 100 - erwarteteRenteProzent;
            }

            chartVorsorge[0].style.cssText += `--percentage_pension: ${erwarteteRenteProzent}; --percentage_vorsorge: ${bestehendeVorsorgeProzent};`;
        }

        const chartPension = document.querySelectorAll<HTMLElement>('.circle-chart__circle_pension');

        if (chartPension.length) {
            chartPension[0].style.cssText += `--percentage_pension: ${erwarteteRenteProzent};`;
        }
    }
}

export function setRateVal(event: Event) {
    if (null === event.target || !(event.target instanceof HTMLInputElement)) {
        return;
    }

    const inflationRates = document.querySelectorAll<HTMLInputElement>('#inflationsrate');
    const inflationRate  = inflationRates[0];

    const inflationValTexts = document.querySelectorAll<HTMLSpanElement>('.js-inflation-rate');
    const inflationValText  = inflationValTexts[0];

    let rateVal = Number(0.0);

    if (event.target.checked) {
        rateVal = Number(inflationRate.value);
    }

    inflationValText.innerHTML = escapeHtml(rateVal.toString(10));

    const forms = document.querySelectorAll<HTMLFormElement>('#renten-form');

    forms.forEach(function (el) {
        el.dispatchEvent(
            new SubmitEvent('submit', {
                bubbles: true, // Whether the event will bubble up through the DOM or not
                cancelable: true, // Whether the event may be canceled or not
            })
        );
    });
}

export function slider() {
    const sliders = document.querySelectorAll<HTMLInputElement>('.js-tooltip-slider');

    sliders.forEach((slider) => {
        Rentenluecke.handleSlider(slider);
    });
}

export function showModal(event: Event) {
    if (null === event.target || !(event.target instanceof HTMLAnchorElement)) {
        return;
    }

    const favDialog = document.getElementById('inflation-layer');

    if (!(favDialog instanceof HTMLDialogElement)) {
        return;
    }

    slider();
    favDialog.showModal();
}

export function hideModal() {
    const favDialog = document.getElementById('inflation-layer');

    if (!(favDialog instanceof HTMLDialogElement)) {
        return;
    }

    favDialog.close();
}
