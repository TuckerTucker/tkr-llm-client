/**
 * Preview Module
 *
 * Provides preview generation for prompts, configs, and interpolation.
 *
 * @module lib/preview
 * @version 1.0.0
 * @author Validation & Preview Engineer (Agent 4)
 */

// Prompt preview exports
export {
  generatePromptPreview,
  hasPromptVariables,
  getPromptVariables,
  validatePromptVariables,
  generateDiffPreview,
  formatPromptPreview,
} from './prompt';

export type {
  PromptPreview,
} from './prompt';

// Config preview exports
export {
  generateConfigPreview,
  generateAllConfigPreviews,
  formatAsJson,
  formatAsYaml,
  formatOverrides,
} from './config';

export type {
  ConfigPreview,
  ConfigFormatOptions,
} from './config';

// Interpolation preview exports
export {
  interpolatePreview,
  getSubstitutions,
  formatInterpolationPreview,
  generateSideBySideDiff,
  generateUnifiedDiff,
  highlightVariables,
} from './interpolation';

export type {
  InterpolationPreview,
  VariableInfo,
  VariableSubstitution,
} from './interpolation';
