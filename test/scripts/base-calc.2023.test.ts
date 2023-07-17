import { describe, it, expect, test } from 'vitest'
import BaseCalculation from '../../src/scripts/base-calc.2023';

const tests = [
  // {
  //   "stkl": 1,
  //   "re4": 8500000,
  //   "lzz": 1,
  //   "krv": 1,
  //   "pvz": 0,
  //   "r": 1,
  //   "kvz": 1.6,
  //   "zkf": 0,
  //   "pkv": 0,
  //   "pvs": 1,
  //   "af": 0,
  //   "bk": 1941700,
  //   "bks": 0,
  //   "bkv": 0,
  //   "lstlzz": 1941700,
  //   "solzlzz": 22300,
  //   "solzs": 0,
  //   "solzv": 0,
  //   "sts": 0,
  //   "stv": 0,
  //   "vkvlzz": 0,
  //   "vkvsonst": 0,
  //   "vfrb": 120000,
  //   "vfrbs1": 0,
  //   "vfrbs2": 0,
  //   "wvfrb": 5907000,
  //   "wvfrbo": 0,
  //   "wvfrbm": 0
  // }
];

for (let re4: number = 5000; re4 <= 90000; ) {
  for (let stkl: number = 1; stkl < 2; stkl++) {
    const taxTests = require ('../fixture-data/base-calc_' + re4 + '_' + stkl + '.json');

    taxTests.forEach(function(test): void {
      tests.push(test);
    })
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

describe('base-calc', async () => {
  await it.todo('unimplemented test');

  await describe.each(tests)('calculate tax for tax class', async ({stkl, re4, lzz, krv, pvz, r, kvz, zkf, pkv, pvs, af, bk, bks, bkv, lstlzz, solzlzz, solzs, solzv, sts, stv, vkvlzz, vkvsonst, vfrb, vfrbs1, vfrbs2, wvfrb, wvfrbo, wvfrbm}) => {

    const baseCalc = await new BaseCalculation();
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

    await test(`calculate lstlzz for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, async () => {
      await expect(baseCalc.getLstlzz()).toBe(lstlzz);
    })

    await test(`calculate solzlzz for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, async () => {
      await expect(baseCalc.getSolzlzz()).toBe(solzlzz);
    })

    await test(`calculate bk for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, async () => {
      await expect(baseCalc.getBk()).toBe(bk);
    })

    await test(`calculate bks for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, async () => {
      await expect(baseCalc.getBks()).toBe(bks);
    })

    await test(`calculate bkv for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, async () => {
      await expect(baseCalc.getBkv()).toBe(bkv);
    })

    await test(`calculate solzs for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, async () => {
      await expect(baseCalc.getSolzs()).toBe(solzs);
    })

    await test(`calculate solzv for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, async () => {
      await expect(baseCalc.getSolzv()).toBe(solzv);
    })

    await test(`calculate sts for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, async () => {
      await expect(baseCalc.getSts()).toBe(sts);
    })

    await test(`calculate stv for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, async () => {
      await expect(baseCalc.getStv()).toBe(stv);
    })

    await test(`calculate vkvlzz for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, async () => {
      await expect(baseCalc.getVkvlzz()).toBe(vkvlzz);
    })

    await test(`calculate vkvsonst for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, async () => {
      await expect(baseCalc.getVkvsonst()).toBe(vkvsonst);
    })

    await test(`calculate vfrb for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, async () => {
      expect(baseCalc.getVfrb()).toBe(vfrb);
    })

    await test(`calculate vfrbs1 for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, async () => {
      await expect(baseCalc.getVfrbs1()).toBe(vfrbs1);
    })

    await test(`calculate vfrbs2 for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, async () => {
      await expect(baseCalc.getVfrbs2()).toBe(vfrbs2);
    })

    await test(`calculate wvfrb for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, async () => {
      await expect(baseCalc.getWvfrb()).toBe(wvfrb);
    })

    await test(`calculate wvfrbo for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, async () => {
      await expect(baseCalc.getWvfrbo()).toBe(wvfrbo);
    })

    await test(`calculate wvfrbm for stkl: ${stkl}, re4: ${re4 / 100}, lzz: ${lzz}, krv: ${krv}, pvz: ${pvz}, r: ${r}, kvz: ${kvz}, zkf: ${zkf}, pkv: ${pkv}, pvs: ${pvs}, af: ${af}`, async () => {
      await expect(baseCalc.getWvfrbm()).toBe(wvfrbm);
    })
  });
})
