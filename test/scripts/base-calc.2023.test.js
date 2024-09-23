import { describe, it, expect, test } from 'vitest';
import BaseCalculation from '../../src/scripts/base-calc.2023';
import * as fs from 'node:fs';
const tests = [
    {
        stkl: 1,
        re4: 8500000,
        lzz: 1,
        krv: 1,
        pvz: 0,
        r: 1,
        kvz: 1.6,
        zkf: 0,
        pkv: 0,
        pvs: 1,
        af: 0,
        bk: 1941700,
        bks: 0,
        bkv: 0,
        lstlzz: 1941700,
        solzlzz: 22300,
        solzs: 0,
        solzv: 0,
        sts: 0,
        stv: 0,
        vkvlzz: 0,
        vkvsonst: 0,
        vfrb: 120000,
        vfrbs1: 0,
        vfrbs2: 0,
        wvfrb: 5907000,
        wvfrbo: 0,
        wvfrbm: 0,
    },
];
for (let re4 = 5000; re4 <= 90000;) {
    for (let stkl = 1; stkl < 2; stkl++) {
        const taxTests = JSON.parse(fs.readFileSync('../fixture-data/base-calc_' + re4.toString() + '_' + stkl.toString() + '.json', 'utf-8'));
        taxTests.forEach(function (test) {
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
describe('base-calc', () => {
    it.todo('unimplemented test');
    describe.each(tests)('calculate tax for tax class', ({ stkl, re4, lzz, krv, pvz, r, kvz, zkf, pkv, pvs, af, bk, bks, bkv, lstlzz, solzlzz, solzs, solzv, sts, stv, vkvlzz, vkvsonst, vfrb, vfrbs1, vfrbs2, wvfrb, wvfrbo, wvfrbm }) => {
        const baseCalc = new BaseCalculation();
        baseCalc.calculate(stkl, re4, lzz, krv, pvz === 1, r, kvz, zkf, pkv, pvs === 1, af === 1);
        test(`calculate lstlzz for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
            expect(baseCalc.getLstlzz()).toBe(lstlzz);
        });
        test(`calculate solzlzz for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
            expect(baseCalc.getSolzlzz()).toBe(solzlzz);
        });
        test(`calculate bk for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
            expect(baseCalc.getBk()).toBe(bk);
        });
        test(`calculate bks for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
            expect(baseCalc.getBks()).toBe(bks);
        });
        test(`calculate bkv for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
            expect(baseCalc.getBkv()).toBe(bkv);
        });
        test(`calculate solzs for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
            expect(baseCalc.getSolzs()).toBe(solzs);
        });
        test(`calculate solzv for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
            expect(baseCalc.getSolzv()).toBe(solzv);
        });
        test(`calculate sts for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
            expect(baseCalc.getSts()).toBe(sts);
        });
        test(`calculate stv for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
            expect(baseCalc.getStv()).toBe(stv);
        });
        test(`calculate vkvlzz for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
            expect(baseCalc.getVkvlzz()).toBe(vkvlzz);
        });
        test(`calculate vkvsonst for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
            expect(baseCalc.getVkvsonst()).toBe(vkvsonst);
        });
        test(`calculate vfrb for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
            expect(baseCalc.getVfrb()).toBe(vfrb);
        });
        test(`calculate vfrbs1 for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
            expect(baseCalc.getVfrbs1()).toBe(vfrbs1);
        });
        test(`calculate vfrbs2 for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
            expect(baseCalc.getVfrbs2()).toBe(vfrbs2);
        });
        test(`calculate wvfrb for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
            expect(baseCalc.getWvfrb()).toBe(wvfrb);
        });
        test(`calculate wvfrbo for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
            expect(baseCalc.getWvfrbo()).toBe(wvfrbo);
        });
        test(`calculate wvfrbm for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
            expect(baseCalc.getWvfrbm()).toBe(wvfrbm);
        });
    });
});
