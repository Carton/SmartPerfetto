// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2024-2026 Gracker (Chris)

import {describe, expect, it, jest} from '@jest/globals';
import {ArtifactStore} from '../../agentv3/artifactStore';
import {captureEvidenceTable} from '../evidence/evidenceCapture';
import {buildTraceProcessorQueryProvenance} from '../traceProcessorConnectionModel';
import {diagnoseConclusionDraft, draftDiagnosticOwnerKey, DRAFT_DECLARATION_MAX_BYTES} from '../draftDeclarationDiagnostics';

function fixture(options: {unit?: boolean; unitToken?: string; trace?: string; budget?: number; viewRun?: string; viewSession?: string} = {}) {
  const store = new ArtifactStore();
  const value = 7.123456;
  const data = {columns: ['elapsed', 'secret', 'events'], rows: [[value, 'never return retained private cell', 2]]};
  const origin = {kind: 'skill_literal' as const, skillId: 'fixture', stepId: 'table', definitionFingerprint: 'issued-definition'};
  const witness = captureEvidenceTable(data, options.unit === false ? {} : {
    elapsed: {unit: options.unitToken ?? 'ms', origin}, events: {unit: 'events', origin}});
  const artifactId = store.store({skillId: 'fixture', data,
    traceProvenance: buildTraceProcessorQueryProvenance({traceId: options.trace ?? 'trace', traceSide: 'current'})});
  store.registerEvidenceCapture(artifactId, witness, {evidenceRefId: 'evidence:fixture'});
  const reference = {artifactId, rowIndex: 0, column: 'elapsed', value};
  const contract: any = {schemaVersion: 'conclusion_contract_v1', mode: 'focused_answer', conclusions: [],
    clusters: [], evidenceChain: [], uncertainties: [], nextSteps: [], claims: [{id: 'duration', text: 'Elapsed 7.1 ms.',
      kind: 'numeric', references: [reference], semantics: {schemaVersion: 'claim_semantics@1', predicate: 'numeric.cell',
        polarity: 'affirmed', discourse: 'asserted', quantifier: 'one', modality: 'certain',
        scope: {population: 'cited_rows', subjectRefs: [reference]}, numeric: {operator: 'eq', value, unit: 'ms',
          presentation: {schemaVersion: 'numeric_presentation@1', unit: 'ms', decimalPlaces: 1,
            rounding: 'half_away_from_zero', quotes: [{text: '7.1 ms'}]}}}}]};
  const runId = 'run', sessionId = 'session';
  const viewRun = options.viewRun ?? runId, viewSession = options.viewSession ?? sessionId;
  const readView = store.createEvidenceReadView({currentRunId: viewRun,
    ownerKey: draftDiagnosticOwnerKey(viewRun, viewSession), allowedTraces: [{traceId: 'trace', traceSide: 'current'}],
    ...(options.budget !== undefined ? {budget: {maxReferences: options.budget}} : {})});
  return {store, contract, input: {body: 'Elapsed 7.1 ms.', declarationJson: JSON.stringify(contract), runId, sessionId, readView}};
}

describe('draft declaration diagnostics', () => {
  it('checks issued quantities without storing changes, private values or final certification', async () => {
    const f = fixture();
    const before = JSON.stringify(f.store.serialize());
    const input = JSON.stringify({...f.input, readView: undefined});
    const fetch = jest.spyOn(globalThis, 'fetch');
    try {
      const result = await diagnoseConclusionDraft(f.input);
      expect(result).toMatchObject({diagnosticOnly: true, coverageNotChecked: true, finalCertification: false, state: 'diagnosed',
        diagnostics: [{finiteReason: 'numeric_operator_proved', presentationReason: 'display_matches', producerUnits: ['ms']}]});
      expect(JSON.stringify(result)).not.toContain('never return');
      expect(JSON.stringify(result)).not.toContain('7.123456');
      expect(JSON.stringify(result)).not.toMatch(/"(?:anchors|binding|receipt|passed|claimSupport)"/);
      expect(JSON.stringify(f.store.serialize())).toBe(before);
      expect(JSON.stringify({...f.input, readView: undefined})).toBe(input);
      expect(fetch).not.toHaveBeenCalled();
    } finally {fetch.mockRestore();}
  });
  it('diagnoses a wrong proposition instead of changing it', async () => {
    const f = fixture(); f.contract.claims[0].semantics.numeric.value = 9;
    expect(await diagnoseConclusionDraft({...f.input, declarationJson: JSON.stringify(f.contract)})).toMatchObject({
      diagnostics: [{finiteReason: 'numeric_operator_rejected', presentationReason: 'proposition_not_proved'}]});
    expect(f.contract.claims[0].semantics.numeric.value).toBe(9);
  });
  it('retains unknown producer units', async () => {
    expect(await diagnoseConclusionDraft(fixture({unit: false}).input)).toMatchObject({
      diagnostics: [{finiteReason: 'unit_authority_unknown', producerUnits: []}]});
  });
  it('does not project arbitrary stored unit strings or promote an invalid schema item', async () => {
    const hiddenUnit = 'private-unit-value';
    const result = await diagnoseConclusionDraft(fixture({unitToken: hiddenUnit}).input);
    expect(result).toMatchObject({diagnostics: [{producerUnits: []}]});
    expect(JSON.stringify(result)).not.toContain(hiddenUnit);
    const f = fixture(); f.contract.claims[0].semantics.numeric.value = 'invalid-number';
    const read = jest.fn(f.input.readView.resolveReferences);
    const readView = {...f.input.readView, resolveReferences: read};
    expect(await diagnoseConclusionDraft({...f.input, readView, declarationJson: JSON.stringify(f.contract)})).toMatchObject({
      diagnostics: [{finiteReason: 'invalid_claim', producerUnits: []}]});
    expect(read).not.toHaveBeenCalled();
  });
  it('projects only the numeric subject unit when other references have different units', async () => {
    const f = fixture();
    f.contract.claims[0].references.push({...f.contract.claims[0].references[0], column: 'events', value: 2});
    expect(await diagnoseConclusionDraft({...f.input, declarationJson: JSON.stringify(f.contract)})).toMatchObject({
      diagnostics: [{producerUnits: ['ms'], finiteReason: 'numeric_operator_proved'}]});
  });
  it('reports unbound references without inventing retained cells', async () => {
    const f = fixture();
    f.contract.claims[0].references[0].artifactId = 'not-retained';
    expect(await diagnoseConclusionDraft({...f.input, declarationJson: JSON.stringify(f.contract)})).toMatchObject({
      diagnostics: [{referenceReasons: expect.arrayContaining(['missing'])}]});
  });
  it('reports repeated and nonexistent quotes, accepting explicit zero-based occurrences', async () => {
    const f = fixture(); const body = 'Elapsed 7.1 ms. Again 7.1 ms.';
    expect(await diagnoseConclusionDraft({...f.input, body})).toMatchObject({diagnostics: [{
      presentationReason: 'quote_unresolved', quoteOccurrences: [{quoteIndex: 0, exactSubstringOccurrences: 2}]}]});
    f.contract.claims[0].semantics.numeric.presentation.quotes = [{text: '7.1 ms', occurrence: 0}, {text: '7.1 ms', occurrence: 1}];
    expect(await diagnoseConclusionDraft({...f.input, body, declarationJson: JSON.stringify(f.contract)})).toMatchObject({
      diagnostics: [{presentationReason: 'display_matches'}]});
    expect(await diagnoseConclusionDraft({...f.input, body: 'No numeric literal.'})).toMatchObject({diagnostics: [{
      presentationReason: 'quote_unresolved', quoteOccurrences: [{exactSubstringOccurrences: 0}]}]});
  });
  it.each([{viewRun: 'other-run'}, {viewSession: 'other-session'}])('rejects a mismatched read context: %j', async settings => {
    expect(await diagnoseConclusionDraft(fixture(settings).input)).toMatchObject({state: 'unavailable', reason: 'read_context_mismatch'});
  });
  it('respects allowed traces and existing read budgets', async () => {
    for (const settings of [{trace: 'other-trace'}, {budget: 0}]) {
      const result = await diagnoseConclusionDraft(fixture(settings).input);
      expect(result).toMatchObject({diagnostics: [{producerUnits: [], referenceReasons: expect.not.arrayContaining(['matched'])}]});
      expect(JSON.stringify(result)).not.toContain('numeric_operator_proved');
    }
  });
  it('propagates authorization revocation after an asynchronous read', async () => {
    const f = fixture(); let checks = 0;
    const assertCurrent = () => {if (++checks === 2) throw new Error('authorization_revoked');};
    await expect(diagnoseConclusionDraft({...f.input, assertCurrent})).rejects.toThrow('authorization_revoked');
  });
  it('stops when cancellation arrives during the existing-evidence read', async () => {
    const f = fixture(); const controller = new AbortController();
    const readView = {investigationEvidence: f.input.readView.investigationEvidence,
      resolveReferences: async (...args: Parameters<typeof f.input.readView.resolveReferences>) => {
        controller.abort(); return f.input.readView.resolveReferences(...args);
      }};
    expect(await diagnoseConclusionDraft({...f.input, readView, signal: controller.signal}))
      .toMatchObject({state: 'unavailable', reason: 'cancelled'});
  });
  it('does not certify semantic meaning or omissions when finite bindings match', async () => {
    const f = fixture();
    const result = await diagnoseConclusionDraft({...f.input, body: 'Thermal throttling caused 7.1 ms. Original classification warm.'});
    expect(result).toMatchObject({coverageNotChecked: true, finalCertification: false,
      diagnostics: [{finiteReason: 'numeric_operator_proved', presentationReason: 'display_matches'}]});
  });
  it('refuses missing context, cancellation, invalid JSON and input budgets explicitly', async () => {
    const f = fixture(); const controller = new AbortController(); controller.abort();
    expect(await diagnoseConclusionDraft({...f.input, runId: undefined})).toMatchObject({reason: 'run_context_missing'});
    expect(await diagnoseConclusionDraft({...f.input, readView: undefined})).toMatchObject({reason: 'evidence_store_missing'});
    expect(await diagnoseConclusionDraft({...f.input, signal: controller.signal})).toMatchObject({reason: 'cancelled'});
    expect(await diagnoseConclusionDraft({...f.input, declarationJson: '{} trailing'})).toMatchObject({reason: 'invalid_json'});
    expect(await diagnoseConclusionDraft({...f.input, declarationJson: '{}'})).toMatchObject({reason: 'invalid_declaration'});
    expect(await diagnoseConclusionDraft({...f.input, body: '汉'.repeat(DRAFT_DECLARATION_MAX_BYTES)}))
      .toMatchObject({reason: 'input_budget_or_body_invalid'});
  });
});
