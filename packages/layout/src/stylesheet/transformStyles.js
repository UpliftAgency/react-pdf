import * as R from 'ramda';

import { FONT_WEIGHTS } from '../constants';

const BOX_MODEL_REGEX = /\d+(px|in|mm|cm|pt|%|vw|vh|px)?/g;
const OBJECT_POSITION_REGEX = /\d+(px|in|mm|cm|pt|%|vw|vh|px)?/g;
const BORDER_SHORTHAND_REGEX = /(\d+(px|in|mm|cm|pt|vw|vh|px)?)\s(\S+)\s(\S+)/;
const TRANSFORM_ORIGIN_REGEX = /(-?\d+(px|in|mm|cm|pt|%|vw|vh|px)?)|top|right|bottom|left|center/g;

const matchBoxModel = R.match(BOX_MODEL_REGEX);
const matchObjectPosition = R.match(OBJECT_POSITION_REGEX);
const matchBorderShorthand = R.match(BORDER_SHORTHAND_REGEX);
const matchTransformOrigin = R.match(TRANSFORM_ORIGIN_REGEX);

const isNumber = R.is(Number);

const isFontWeightStyle = key => key.match(/^fontWeight/);

const isBorderStyle = (key, value) =>
  key.match(/^border(Top|Right|Bottom|Left)(Color|Width|Style)/) &&
  typeof value === 'string';

const isBoxModelStyle = (key, value) =>
  key.match(/^(margin)|(padding)/) && typeof value === 'string';

const isObjectPositionStyle = (key, value) =>
  key.match(/^objectPosition/) && typeof value === 'string';

const isTransformOriginStyle = (key, value) =>
  key.match(/^transformOrigin/) && typeof value === 'string';

const isFlexGrow = key => key === 'flexGrow';

const isFlexShrink = key => key === 'flexShrink';

const isFlexBasis = key => key === 'flexBasis';

const processBorders = (key, value) => {
  const match = matchBorderShorthand(value);

  if (match) {
    if (key.match(/Color$/)) {
      return match[4] || value;
    } else if (key.match(/Style$/)) {
      return match[3] || value;
    } else if (key.match(/Width$/)) {
      return match[1] || value;
    } else {
      throw new Error(`StyleSheet: Invalid '${value}' for '${key}'`);
    }
  }

  return value;
};

const processBoxModel = (key, value) => {
  const match = matchBoxModel(value);

  if (match) {
    if (key.match(/Top$/)) {
      return match[0];
    } else if (key.match(/Right$/)) {
      return match[1] || match[0];
    } else if (key.match(/Bottom$/)) {
      return match[2] || match[0];
    } else if (key.match(/Left$/)) {
      return match[3] || match[1] || match[0];
    } else {
      throw new Error(`StyleSheet: Invalid '${value}' for '${key}'`);
    }
  }

  return value;
};

export const processFontWeight = (key, value) => {
  if (!value) return FONT_WEIGHTS.normal;
  if (typeof value === 'number') return value;
  return FONT_WEIGHTS[value.toLowerCase()];
};

export const processObjectPosition = (key, value) => {
  const match = matchObjectPosition(value);

  if (match) {
    if (key.match(/X$/)) {
      return match[0] || value;
    } else if (key.match(/Y$/)) {
      return match[1] || value;
    } else {
      throw new Error(`StyleSheet: Invalid '${value}' for '${key}'`);
    }
  }

  return value;
};

const transformOffsetKeywords = value => {
  switch (value) {
    case 'top':
    case 'left':
      return '0%';
    case 'right':
    case 'bottom':
      return '100%';
    case 'center':
      return '50%';
    default:
      return value;
  }
};

// Transforms shorthand transformOrigin values
const processTransformOrigin = (key, value) => {
  const match = matchTransformOrigin(value);

  if (match) {
    let result;

    if (key.match(/X$/)) {
      result = match[0] || value;
    } else if (key.match(/Y$/)) {
      result = match[1] || match[0] || value;
    } else {
      throw new Error(`StyleSheet: Invalid '${value}' for '${key}'`);
    }

    return transformOffsetKeywords(result);
  }

  return value;
};

const processFlexGrow = (key, value) => {
  if (isNumber(value)) return value;
  const matches = value.split(' ');
  return matches[0];
};

const processFlexShrink = (key, value) => {
  if (isNumber(value)) return value;
  const matches = value.split(' ');
  return matches[1];
};

const processFlexBasis = (key, value) => {
  if (isNumber(value)) return value;
  const matches = value.split(' ');
  return matches[2];
};

const keepSame = (key, value) => value;

const matchNumber = R.when(R.is(String), R.test(/^-?\d*\.?\d*$/));

const castFloat = R.when(matchNumber, v => parseFloat(v, 10));

/**
 * Transforms style key-value
 *
 * @param {String} key style key
 * @param {String} value style value
 * @returns {String | Number} transformed style values
 */
const transformStyle = R.compose(
  castFloat,
  R.cond([
    [isBorderStyle, processBorders],
    [isBoxModelStyle, processBoxModel],
    [isObjectPositionStyle, processObjectPosition],
    [isTransformOriginStyle, processTransformOrigin],
    [isFontWeightStyle, processFontWeight],
    [isFlexGrow, processFlexGrow],
    [isFlexShrink, processFlexShrink],
    [isFlexBasis, processFlexBasis],
    [R.T, keepSame],
  ]),
);

/**
 * Transforms already expanded styles shortcuts into appropiate values
 * Ex. marginTopWidth: '2 solid red' -> marginTopWidth: 2
 *
 * @param {Object} styles expanded object
 * @returns {Object} transformed styles
 */
const transformStyles = R.mapObjIndexed(R.flip(transformStyle));

export default transformStyles;
