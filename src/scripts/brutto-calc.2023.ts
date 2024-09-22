import * as CONFIG from './calc.config';
import * as LZZ from './lzz';
import * as KRV from './krv-table';
import * as STATES from './states';
import BaseCalculation from './base-calc.2023';
import KstCalculation from './kst-calc.2023';

export default class BruttoCalculation {
  private baseCalc: BaseCalculation;
  private kstCalc: KstCalculation;

  constructor() {
    this.baseCalc = new BaseCalculation();
    this.kstCalc = new KstCalculation();
  }

  calculate(state: string, taxClass: number, wunschNetto: number, lzz: number, stTabelle: number, pvz: boolean = true, r: number = 1, zkf: number = 0.0) {
    let brutto = wunschNetto;

    // KV-Satz
    const kvsatz = CONFIG.KV_SATZ;
    const kvzuschuss = 0;
    let flzz = 0;

    switch (lzz) {
      case LZZ.LZZ_JAHR:
        flzz = 12;
        break;
      case LZZ.LZZ_MONAT:
        flzz = 1;
        break;
      case LZZ.LZZ_WOCHE:
        flzz = 83 / 360;
        break;
      case LZZ.LZZ_TAG:
        flzz = 12 / 360;
        break;
    }

    // AV-Satz
    const avsatz = CONFIG.AV_SATZ;

    // RV-Satz
    const rvsatz = CONFIG.RV_SATZ;

    // Zähler
    let netto: number,
      lst: number,
      solz: number,
      kst: number,
      bbgrv: number,
      rv: number,
      kv: number,
      pv: number,
      alv: number,
      kvsatzag: number,
      pvsatzan: number,
      bbgkvpv: number,
      kvz: number,
      minbrutto = 0,
      pvs = 0,
      pkv = this.baseCalc.PKV_GES;

    if (state === STATES.BUNDESLAND_SN) {
      pvs = 1;
    }

    do {
      this.baseCalc.calculate(taxClass, brutto, lzz, stTabelle, pvz, r, zkf, pkv, pvs);

      lst = this.baseCalc.getLstlzz() / 100;
      solz = this.baseCalc.getSolzlzz() / 100;
      kst = this.kstCalc.calculate(state, this.baseCalc.getBk());
      bbgrv = this.baseCalc.getBbgrv();
      rv = 0.0;
      kv = 0.0;
      pv = 0.0;
      alv = 0.0;
      kvsatzag = this.baseCalc.getKvsatzag();
      pvsatzan = this.baseCalc.getPvsatzan();
      bbgkvpv = this.baseCalc.getBbgkvpv();
      kvz = this.baseCalc.getKvz();

      if (KRV.KRV_TABELLE_ALLGEMEIN === stTabelle) {
        switch (lzz) {
          case LZZ.LZZ_JAHR:
            minbrutto = Math.min(bbgrv, brutto);
            break;
          case LZZ.LZZ_MONAT:
            minbrutto = Math.min(bbgrv / 12, brutto);
            break;
          case LZZ.LZZ_WOCHE:
            minbrutto = Math.min((bbgrv / 360) * 7, brutto);
            break;
          case LZZ.LZZ_TAG:
            minbrutto = Math.min(bbgrv / 360, brutto);
            break;
        }

        rv = Math.round(((minbrutto * rvsatz) / 200) * 100) / 100;
        alv = Math.round(((minbrutto * avsatz) / 200) * 100) / 100;
      }

      if (kvsatz > 20) {
        if (0 === kvzuschuss) {
          kv = Math.round(kvsatz * flzz * 100) / 100;
        } else {
          kv = Math.round(Math.max((kvsatz * flzz) / 2, (kvsatz - (kvsatzag * bbgkvpv) / 12) * flzz) * 100) / 100;
        }
      } else if (kvsatz > 0) {
        const kvfactor = (kvsatz + kvz) / 2 / 100;

        switch (lzz) {
          case LZZ.LZZ_JAHR:
            minbrutto = Math.min(bbgkvpv, brutto);
            break;
          case LZZ.LZZ_MONAT:
            minbrutto = Math.min(bbgkvpv / 12, brutto);
            break;
          case LZZ.LZZ_WOCHE:
            minbrutto = Math.min((bbgkvpv / 360) * 7, brutto);
            break;
          case LZZ.LZZ_TAG:
            minbrutto = Math.min(bbgkvpv / 360, brutto);
            break;
        }

        kv = Math.round(minbrutto * kvfactor * 100) / 100;
        pv = Math.round(minbrutto * pvsatzan * 100) / 100;
      }

      const abzuege = lst + solz + kst + rv + kv + pv + alv;

      netto = brutto - abzuege;

      ++brutto;
    } while (netto < wunschNetto);

    return { brutto: brutto, tax: lst, soli: solz };
  }
}
