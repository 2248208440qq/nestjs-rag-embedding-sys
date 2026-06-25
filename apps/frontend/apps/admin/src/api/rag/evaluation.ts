import type {
  CreateEvaluationCaseRequest,
  EvaluationCase,
  EvaluationRun,
  RunEvaluationRequest,
} from './types';

import { ragGet, ragPost } from './http';

export function fetchEvaluationCases() {
  return ragGet<EvaluationCase[]>('/evaluation/cases');
}

export function createEvaluationCase(data: CreateEvaluationCaseRequest) {
  return ragPost<EvaluationCase>('/evaluation/cases', data);
}

export function fetchEvaluationRuns() {
  return ragGet<EvaluationRun[]>('/evaluation/runs');
}

export function runEvaluation(data: RunEvaluationRequest) {
  return ragPost<EvaluationRun>('/evaluation/runs', data);
}
