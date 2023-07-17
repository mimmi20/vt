import { describe, it, expect, test } from 'vitest'
import BaseCalculation from '../../src/scripts/base-calc.2023';

const tests = [];

for (let income: number = 5000; income < 90000; ) {
  for (let taxgroup: number = 1; taxgroup < 2; taxgroup++) {
    const taxTests = require ('../fixture-data/base-calc_' + income + '_' + taxgroup + '.json');

    taxTests.forEach(function(test): void {
      tests.push(test);
    })
  }
  income += 5000;
}

describe('base-calc', (): void => {
  it.todo('unimplemented test');

  describe.each(tests)('calculate tax for tax class', async ({stkl, re4, lzz, krv, pvz, r, kvz, zkf, pkv, pvs, af, bk, bks, bkv, lstlzz, solzlzz, solzs, solzv, sts, stv, vkvlzz, vkvsonst, vfrb, vfrbs1, vfrbs2, wvfrb, wvfrbo, wvfrbm}) => {

    const baseCalc = new BaseCalculation();
    await baseCalc.calculate(
      stkl,
      re4,
      lzz,
      krv,
      pvz === 1,
      r,
      kvz,
      zkf,
      pkv,
      pvs === 1,
      af === 1
    );

    test(`calculate lstlzz for tax class ${stkl}, income ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
      expect(baseCalc.getLstlzz()).toBe(lstlzz);
    })

    test(`calculate solzlzz for tax class ${stkl}, income ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
      expect(baseCalc.getSolzlzz()).toBe(solzlzz);
    })

    test(`calculate bk for tax class ${stkl}, income ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
      expect(baseCalc.getBk()).toBe(bk);
    })

    test(`calculate bks for tax class ${stkl}, income ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
      expect(baseCalc.getBks()).toBe(bks);
    })

    test(`calculate bkv for tax class ${stkl}, income ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
      expect(baseCalc.getBkv()).toBe(bkv);
    })

    test(`calculate solzs for tax class ${stkl}, income ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
      expect(baseCalc.getSolzs()).toBe(solzs);
    })

    test(`calculate solzv for tax class ${stkl}, income ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
      expect(baseCalc.getSolzv()).toBe(solzv);
    })

    test(`calculate sts for tax class ${stkl}, income ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
      expect(baseCalc.getSts()).toBe(sts);
    })

    test(`calculate stv for tax class ${stkl}, income ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
      expect(baseCalc.getStv()).toBe(stv);
    })

    test(`calculate vkvlzz for tax class ${stkl}, income ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
      expect(baseCalc.getVkvlzz()).toBe(vkvlzz);
    })

    test(`calculate vkvsonst for tax class ${stkl}, income ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
      expect(baseCalc.getVkvsonst()).toBe(vkvsonst);
    })

    test(`calculate vfrb for tax class ${stkl}, income ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
      expect(baseCalc.getVfrb()).toBe(vfrb);
    })

    test(`calculate vfrbs1 for tax class ${stkl}, income ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
      expect(baseCalc.getVfrbs1()).toBe(vfrbs1);
    })

    test(`calculate vfrbs2 for tax class ${stkl}, income ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
      expect(baseCalc.getVfrbs2()).toBe(vfrbs2);
    })

    test(`calculate wvfrb for tax class ${stkl}, income ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
      expect(baseCalc.getWvfrb()).toBe(wvfrb);
    })

    test(`calculate wvfrbo for tax class ${stkl}, income ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
      expect(baseCalc.getWvfrbo()).toBe(wvfrbo);
    })

    test(`calculate wvfrbm for tax class ${stkl}, income ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, () => {
      expect(baseCalc.getWvfrbm()).toBe(wvfrbm);
    })
  });
})
