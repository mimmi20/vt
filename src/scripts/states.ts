export const BUNDESLAND_BW = 'Baden-Württemberg';
export const BUNDESLAND_BY = 'Bayern';
export const BUNDESLAND_B = 'Berlin';
export const BUNDESLAND_HB = 'Bremen';
export const BUNDESLAND_HH = 'Hamburg';
export const BUNDESLAND_HE = 'Hessen';
export const BUNDESLAND_NS = 'Niedersachsen';
export const BUNDESLAND_NW = 'Nordrhein-Westfalen';
export const BUNDESLAND_RP = 'Rheinland-Pfalz';
export const BUNDESLAND_SL = 'Saarland';
export const BUNDESLAND_SH = 'Schleswig-Holstein';
export const BUNDESLAND_BB = 'Brandenburg';
export const BUNDESLAND_MV = 'Mecklenburg-Vorpommern';
export const BUNDESLAND_SN = 'Sachsen';
export const BUNDESLAND_SA = 'Sachsen-Anhalt';
export const BUNDESLAND_TH = 'Thüringen';

export function isStateEast(state: string): boolean {
  const statesEast = [BUNDESLAND_BB, BUNDESLAND_MV, BUNDESLAND_SA, BUNDESLAND_SN, BUNDESLAND_TH];

  return statesEast.indexOf(state) !== -1;
}

export function isStateWest(state: string): boolean {
  const statesWest = [BUNDESLAND_B, BUNDESLAND_BW, BUNDESLAND_BY, BUNDESLAND_HB, BUNDESLAND_HE, BUNDESLAND_HH, BUNDESLAND_NS, BUNDESLAND_NW, BUNDESLAND_RP, BUNDESLAND_SH, BUNDESLAND_SL];

  return statesWest.indexOf(state) !== -1;
}
