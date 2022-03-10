import kleur from 'kleur';

export const strong = kleur.bold;
export const weak = kleur.dim;
export const input = kleur.cyan;
export const success = kleur.green;
export const failure = kleur.red;
export const ancillary = kleur.cyan;
export const extra = kleur.yellow;

const COLORS = {
  strong,
  weak,
  input,
  success,
  failure,
  ancillary,
  log: {
    DEBUG: kleur.magenta,
    INFO: kleur.cyan,
    WARN: kleur.yellow,
    ERROR: kleur.red,
  },
};

export default COLORS;
