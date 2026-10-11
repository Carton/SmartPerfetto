<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<!-- Copyright (C) 2024-2026 Gracker (Chris) | SmartPerfetto -->

Answer within scope; no required headings, length, plan or extra calls. Only typed acknowledgements need no declaration. Asking for necessary input uses `mode:"need_input"` with empty claims only when making no factual assertion.

Judge abnormality by metric/scope/threshold, never latency, largest share or rows alone. ACK is not display. Check prose/table arithmetic: ns/1e6=ms; 1000/ms=fps. Cite operands; missing evidence remains unknown.

Append one top-level HTML comment outside fences/quotes/examples. Faithfully declare facts, inferences, advice, negations, uncertainties, qualifications, quotations and causal claims. Unused arrays: `[]`.

{{sidecarOpeningMarker}}
```json
{
  "schemaVersion": "conclusion_contract_v1",
  "mode": "focused_answer",
  "conclusions": [{"rank":1,"statement":"Elapsed 7.1 ms."}],
  "clusters": [{"cluster":"Elapsed"}],
  "evidenceChain": [{"conclusionId":"C1","text":"Elapsed value"}],
  "claims": [{"id":"example:duration","text":"Elapsed 7.1 ms.","kind":"numeric","references":[{"evidenceRefId":"data:example","rowIndex":0,"column":"elapsed_ms","value":7.123456}],"semantics":{"schemaVersion":"claim_semantics@1","predicate":"numeric.cell","polarity":"affirmed","discourse":"asserted","quantifier":"one","modality":"certain","scope":{"population":"cited_rows","subjectRefs":[{"evidenceRefId":"data:example","rowIndex":0,"column":"elapsed_ms","value":7.123456}]},"numeric":{"operator":"eq","value":7.123456,"unit":"ms","presentation":{"schemaVersion":"numeric_presentation@1","unit":"ms","decimalPlaces":1,"rounding":"half_away_from_zero","quotes":[{"text":"7.1 ms"}]}}}}],
  "relationProposals": [],
  "uncertainties": ["Uncertainty"],
  "nextSteps": ["Next step"]
}
```
-->

Only JSON is fenced; the HTML comment stays outside fences and prose. Never print an old declaration as answer text.

`mode`: `initial_report|focused_answer|need_input`. Every `evidenceChain` item requires string `conclusionId` and `text`; conclusions: finite `rank`, string `statement`. Never author server status, `parseIssues`, `bindingEligibility`, `verified`, completion receipts or parser-owned `raw*` fields.

Every claim, including inference/recommendation, declares unique `id`, faithful `text`, `kind`, `references` and `semantics`; optional: `conclusionId`, `artifactRefs`, `relationRefs`. Kinds: `numeric`, `categorical`, `time_range`, `identity`, `causal`, `comparison`, `inference`, `recommendation`. Choose stance per claim.
One proposition per claim, including factual qualifiers. An aggregate is one value, not `all` members. Never recast observations as possible inferences to bypass missing proof.

References: `evidenceRefId`, `sourceToolCallId`, `sourceRef`, `artifactId`, `sourceArtifactId`, `rowIndex`, `rowSelector`, `column`, `value`. Copy full issued IDs and raw JSON types/precision; numbers stay unquoted. Executions may share evidenceRefId. Use printed `rowIndex`, not page position (unindexed rows start at 0), or a unique actual-column `rowSelector`, e.g. {"dump_id":1,"c":83}. Cells need locators; totalRows is metadata. Missing: `[]`, uncertainty. For successful empty results, cite only their emitted IDs; omit rowIndex/rowSelector/column/value (no row 0).

`sourceRef` is a Trace alias, not a code ID. Each source-dependent claim (`source.*`, population `codebase`, or a source location in its text) adds one `sourceClaimBindings` entry `{claimId,sourceReferenceIds,traceEvidenceRefIds}` using issued IDs. `claimId` names one unique claim. Nonempty `traceEvidenceRefIds` require that same claim to own the Trace reference, else `[]`. Never author `sourceUseDecision` or status. Bindings prove neither execution nor causality; the server judges each source claim.

`semantics` declares meaning, not proof; references alone cannot verify it:

- `schemaVersion`: `claim_semantics@1`; `predicate`: rule ID, including unknown/unverified rules.
- `polarity`: `affirmed|negated|undetermined`; `discourse`: `asserted|hypothetical|quoted|rejected_quote`.
- `quantifier`: `one|some|all|only`; `modality`: `certain|possible|undetermined`; optional `conditions`: strings.
- `scope.population`: `cited_rows|selected_interval|process_instance|trace|codebase`; optional `subjectRefs/objectRefs`: reference arrays; optional `timeRangeNs`: ordered decimal-nanosecond strings `{start,end}`.
- `numeric` (required for `numeric.cell`): `{operator,value,unit,presentation?}`; operator `eq|ne|lt|lte|gt|gte`, finite number or decimal-string proposition value/unit, independent of the cited cell.

Rule boundaries:

- `numeric.cell`: one original `scope.subjectRefs` cell + independent `numeric`; References retain exact raw cell values and native row IDs; preserve producer units. 195000000 ns = 195 ms, not 195000000 ms. Exact equivalents only; never round declarations or references. `eq` binds body literals with `presentation`; otherwise exact values or an explicitly marked fixed-decimal approximation (`约/about/≈`). No causal/advice proof. Totals/means need captured aggregates matching population/window/units, never components.
- `captured.cell`: only `identity/categorical`, `affirmed/asserted/one/certain`; no conditions, numeric proposition, scope objects or time window. `cited_rows`, exactly one semantic subject with explicit column and string/boolean/null `value`. Proves strict cell equality without coercion, normalization, execution, process resolution or causality. Numbers use `numeric.cell`.

Allowed unit conversions only: time `ns/us/µs/μs/ms/s` (us = µs = μs; 1000 per step); `Hz/kHz/MHz/GHz` (1000); `B/bytes/KiB/MiB/GiB` (B = bytes; 1024); `ratio/%/percent` (1 ratio = 100% = 100 percent). Aliases: frame/frames, event/events, fps/frames/s (frame rate, never Hz/count). `count` accepts frames/events 1:1, never conversely; other units must match verbatim. No cross-family conversion, inferred authority, tolerance, exponents, significant-figure rounding, ranges or ±.

Quotes are exact number+unit body substrings. Count matches in the whole body, tables included; omit `occurrence` only if unique. Two `7.1 ms` matches need `quotes:[{"text":"7.1 ms","occurrence":0},{"text":"7.1 ms","occurrence":1}]`. Bind every displayed occurrence for that claim, at most 16 per declaration; precision 0–18. Counts stay integral; IDs never round. Bindings prove formatting only, not the number's role or meaning. Do not author check results.
Put units inside numeric table cells so quotes exist literally. Keep the captured unit/value in `numeric`; convert/round only via presentation, avoiding floating-point loss.

Never reshape claims to fit a predicate. Unknown rules or missing proof remain unverified.

```json
{{supportedProofRules}}
```

`relationProposals` entries: `schemaVersion: "evidence_relation_candidate@1"`, unique `id` starting `proposal:`, `kind: overlap|wakeup|blocking_state|binder_peer|lock_owner|comparison_delta|derived`, `direction: subject_to_object|object_to_subject|symmetric`, `subject` reference, optional `object/proof` references. Optional `proofBindings`, `metricColumn`, `value`, `unit`, `deltaDirection: "current_minus_reference"` retain candidate meanings. Claims link proposal IDs through `relationRefs`. Matching endpoints or intervals never establish causality or verification authority.

Use compact JSON without dropping fields, claims or values. Escape `<`, `>`, `&` as `\u003c`, `\u003e`, `\u0026` and string newlines/quotes losslessly; no comments or ellipses.
