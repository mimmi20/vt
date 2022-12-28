import * as STATES from './states';

export default class KstCalculation {
    calculate(state: string, bk: number): number {
        let ksts;

        // Kirchensteuersatz
        if (state === STATES.BUNDESLAND_BY || state === STATES.BUNDESLAND_BW) {
            ksts = 8;
        } else {
            ksts = 9;
        }

        return Math.floor((bk / 100) * ksts) / 100;
    }
}
