// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2024-2026 Gracker (Chris)

import {MAX_CLAIM_DIAGNOSTICS, isConclusionRootParseIssue, parseConclusionContractDeclaration} from '../agent/core/conclusionContract';
import {analysisDeliveryFingerprint} from '../types/analysisDelivery';
import {claimUnitFor} from '../utils/claimUnits';
import {prepareClaimEvidence, evidenceReferenceKey} from './evidence/claimEvidencePreparation';
import {getCapturedAnchorFacts} from './evidence/evidenceCapture';
import {MAX_EVIDENCE_READ_REFERENCES, type EvidenceReadView} from './evidence/evidenceReadView';
import {isIssuedInvestigationEvidenceSnapshot} from './evidence/investigationEvidenceLedger';
import {assessNumericPresentations} from './numericPresentationAssessment';
import {runClaimVerification} from './verifier/claimVerificationRunner';

export const DRAFT_DECLARATION_MAX_BYTES = 65_536;
const boundary = {diagnosticOnly: true, coverageNotChecked: true, finalCertification: false} as const;
type DiagnosticInput = {body: string; declarationJson: string; runId?: string; sessionId?: string;
  readView?: EvidenceReadView; signal?: AbortSignal; assertCurrent?: () => void};
export const draftDiagnosticOwnerKey = (runId: string, sessionId: string) =>
  `draft-declaration:${analysisDeliveryFingerprint({runId, sessionId})}`;

/** Only local diagnostics: no semantic call, acquisition, completion, persistence or candidate admission. */
export async function diagnoseConclusionDraft(input: DiagnosticInput) {
  const unavailable = (reason: string) => ({...boundary, state: 'unavailable' as const, reason});
  if (!input.runId?.trim() || !input.sessionId?.trim()) return unavailable('run_context_missing');
  if (!input.readView) return unavailable('evidence_store_missing');
  if (input.signal?.aborted) return unavailable('cancelled');
  // Authorization errors must propagate; a caller must never swallow a revoked fence.
  input.assertCurrent?.();
  const scope = input.readView.investigationEvidence?.();
  if (!isIssuedInvestigationEvidenceSnapshot(scope) || scope.currentRunId !== input.runId ||
      scope.ownerKey !== draftDiagnosticOwnerKey(input.runId, input.sessionId)) return unavailable('read_context_mismatch');
  if (!input.body.trim() || Buffer.byteLength(input.body, 'utf8') > DRAFT_DECLARATION_MAX_BYTES ||
      Buffer.byteLength(input.declarationJson, 'utf8') > DRAFT_DECLARATION_MAX_BYTES)
    return {...boundary, state: 'invalid_input' as const, reason: 'input_budget_or_body_invalid'};
  let raw: unknown;
  try {raw = JSON.parse(input.declarationJson);} catch {
    return {...boundary, state: 'invalid_input' as const, reason: 'invalid_json'};
  }
  if (raw && typeof raw === 'object' && Array.isArray((raw as {claims?: unknown}).claims) &&
      (raw as {claims: unknown[]}).claims.length > MAX_EVIDENCE_READ_REFERENCES)
    return {...boundary, state: 'invalid_input' as const, reason: 'claim_budget_exhausted'};
  const parsed = parseConclusionContractDeclaration(raw);
  const schemaDiagnostics = parsed.issues.slice(0, MAX_CLAIM_DIAGNOSTICS).map(issue => ({code: issue.code, path: issue.path}));
  if (!parsed.contract || parsed.issues.some(isConclusionRootParseIssue))
    return {...boundary, state: 'invalid_input' as const, reason: 'invalid_declaration', schemaDiagnostics};
  const contract = parsed.contract;
  const preparedEvidence = await prepareClaimEvidence({conclusionContract: contract, bindingEligibility: 'eligible',
    evidenceReadView: input.readView, signal: input.signal});
  if (input.signal?.aborted) return unavailable('cancelled');
  input.assertCurrent?.();
  const finite = runClaimVerification({conclusionContract: contract, preparedEvidence, bindingEligibility: 'eligible'});
  const presentations = assessNumericPresentations({contract, claims: finite.claimVerificationResult.claimResults,
    support: finite.claimSupport, body: input.body, candidate: {runId: input.runId,
      attemptId: 'draft-diagnostic', candidateRef: 'draft-diagnostic', conclusionFingerprint: analysisDeliveryFingerprint(input.body)}});
  const diagnostics = finite.claimVerificationResult.claimResults.map((claim, index) => {
    const declaration = contract.claims?.[index];
    const support = finite.claimSupport.find(item => item.claimId === claim.claimId);
    const subjects = declaration?.semantics?.scope.subjectRefs;
    const subject = declaration?.kind === 'numeric' && subjects?.length === 1 ? subjects[0] : undefined;
    const producerUnits = [...new Set((support?.anchors ?? []).flatMap(anchor => {
      const facts = getCapturedAnchorFacts(anchor);
      if (!facts || !subject?.column || facts.referenceKey !== evidenceReferenceKey(subject) ||
          (subject.rowIndex !== undefined && subject.rowIndex !== facts.originalRowIndex) ||
          !anchor.cells?.some(cell => cell.column === subject.column)) return [];
      const field = facts.fields[subject.column];
      return field?.origin.definitionFingerprint && ['skill_literal', 'native_producer'].includes(field.origin.kind) &&
        claimUnitFor(field.unit) ? [field.unit!] : [];
    }))];
    const presentation = presentations.get(claim.claimId);
    const quoteOccurrences = (declaration?.semantics?.numeric?.presentation?.quotes ?? []).map((quote, quoteIndex) => {
      let exactSubstringOccurrences = 0;
      for (let offset = input.body.indexOf(quote.text); offset >= 0 && exactSubstringOccurrences < 17;
        offset = input.body.indexOf(quote.text, offset + quote.text.length)) exactSubstringOccurrences++;
      return {quoteIndex, exactSubstringOccurrences, ...(exactSubstringOccurrences === 17 ? {truncated: true} : {})};
    });
    const referenceReasons = [...new Set((claim.referenceResults ?? []).filter(reference => reference.status !== 'matched')
      .map(reference => reference.status))];
    return {claimOrdinal: index + 1, claimId: claim.claimId.slice(0, 128),
      finiteReason: claim.deterministicProof?.reason ?? 'not_checked', referenceReasons, producerUnits,
      ...(presentation ? {presentationReason: presentation.reason, quoteOccurrences} : {})};
  });
  // Errors first, without dropping or rewriting any declaration. This is bounded feedback, never coverage.
  diagnostics.sort((left, right) => Number(right.referenceReasons.length > 0 ||
    (right.presentationReason !== undefined && right.presentationReason !== 'display_matches')) -
    Number(left.referenceReasons.length > 0 || (left.presentationReason !== undefined && left.presentationReason !== 'display_matches')));
  return {...boundary, state: 'diagnosed' as const, schemaDiagnostics,
    evaluatedClaimCount: finite.claimVerificationResult.claimResults.length,
    omittedDiagnosticCount: Math.max(0, diagnostics.length - MAX_CLAIM_DIAGNOSTICS),
    diagnostics: diagnostics.slice(0, MAX_CLAIM_DIAGNOSTICS)};
}
