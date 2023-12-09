import { describe, it, expect, test } from 'vitest';
import BaseCalculation from '../../src/scripts/base-calc.2023';

const tests: TestInfo[] = [];

for (let re4 = 5000; re4 <= 90000; ) {
    for (let stkl = 1; stkl < 2; stkl++) {
        const taxTests: TestInfo[] = require('../fixture-data/base-calc_' + re4.toString() + '_' + stkl.toString() + '.json');

        taxTests.forEach(function (test: TestInfo): void {
            tests.push(test);
        });
    }
    re4 += 2500;
}

// const re4 = 85000;
// const stkl = 1;
//
// const taxTests = require ('../fixture-data/base-calc_' + re4 + '_' + stkl + '.json');
//
// taxTests.forEach(function(test): void {
//   tests.push(test);
// })

describe('base-calc', (): void => {
    it.todo('unimplemented test');

    describe.each(tests)(
        'calculate tax for tax class',
        ({ stkl, re4, lzz, krv, pvz, r, kvz, zkf, pkv, pvs, af, bk, bks, bkv, lstlzz, solzlzz, solzs, solzv, sts, stv, vkvlzz, vkvsonst, vfrb, vfrbs1, vfrbs2, wvfrb, wvfrbo, wvfrbm }): void => {
            const baseCalc = new BaseCalculation();
            baseCalc.calculate(stkl, re4, lzz, krv, pvz === 1, r, kvz, zkf, pkv, pvs === 1, af === 1);

            test(`calculate lstlzz for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, (): void => {
                expect(baseCalc.getLstlzz()).toBe(lstlzz);
            });

            test(`calculate solzlzz for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, (): void => {
                expect(baseCalc.getSolzlzz()).toBe(solzlzz);
            });

            test(`calculate bk for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, (): void => {
                expect(baseCalc.getBk()).toBe(bk);
            });

            test(`calculate bks for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, (): void => {
                expect(baseCalc.getBks()).toBe(bks);
            });

            test(`calculate bkv for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, (): void => {
                expect(baseCalc.getBkv()).toBe(bkv);
            });

            test(`calculate solzs for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, (): void => {
                expect(baseCalc.getSolzs()).toBe(solzs);
            });

            test(`calculate solzv for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, (): void => {
                expect(baseCalc.getSolzv()).toBe(solzv);
            });

            test(`calculate sts for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, (): void => {
                expect(baseCalc.getSts()).toBe(sts);
            });

            test(`calculate stv for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, (): void => {
                expect(baseCalc.getStv()).toBe(stv);
            });

            test(`calculate vkvlzz for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, (): void => {
                expect(baseCalc.getVkvlzz()).toBe(vkvlzz);
            });

            test(`calculate vkvsonst for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, (): void => {
                expect(baseCalc.getVkvsonst()).toBe(vkvsonst);
            });

            test(`calculate vfrb for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, (): void => {
                expect(baseCalc.getVfrb()).toBe(vfrb);
            });

            test(`calculate vfrbs1 for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, (): void => {
                expect(baseCalc.getVfrbs1()).toBe(vfrbs1);
            });

            test(`calculate vfrbs2 for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, (): void => {
                expect(baseCalc.getVfrbs2()).toBe(vfrbs2);
            });

            test(`calculate wvfrb for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, (): void => {
                expect(baseCalc.getWvfrb()).toBe(wvfrb);
            });

            test(`calculate wvfrbo for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, (): void => {
                expect(baseCalc.getWvfrbo()).toBe(wvfrbo);
            });

            test(`calculate wvfrbm for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, (): void => {
                expect(baseCalc.getWvfrbm()).toBe(wvfrbm);
            });
        },
    );
});
