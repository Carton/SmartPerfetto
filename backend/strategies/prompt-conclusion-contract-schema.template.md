<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<!-- Copyright (C) 2024-2026 Gracker (Chris) | SmartPerfetto -->

Answer within scope; no fixed headings/length/plan/extra calls. Typed ACK: no declaration. `mode:"need_input"`: empty claims only without factual assertions.

Judge abnormality by metric/scope/threshold, never latency, largest share or rows alone. ACK is not display. Check prose/table arithmetic: ns/1e6=ms; 1000/ms=fps. Cite operands; missing evidence remains unknown.
Prefer one quantity occurrence; repeat by reference. Prefer authored Skill units; unknown SQL units cannot certify quantities.

Compose body+declaration together: every factual sentence/table cell, not headlines alone. Append one top-level HTML comment outside fences/quotes/examples. Declare facts, inferences, advice, negations, uncertainties, qualifications, quotations and causal claims faithfully. Unused arrays: `[]`.

{{sidecarOpeningMarker}}
```json
{
  "schemaVersion": "conclusion_contract_v1",
  "mode": "focused_answer",
  "conclusions": [{"rank":1,"statement":"Elapsed 7.1 ms."}],
  "clusters": [{"cluster":"Elapsed"}],
  "evidenceChain": [{"conclusionId":"C1","text":"Elapsed value"}],
  "claims": [{"id":"elapsed","text":"Elapsed 7.1 ms.","kind":"numeric","references":[{"evidenceRefId":"data:example","rowIndex":0,"column":"elapsed_ms","value":7.123456}],"semantics":{"schemaVersion":"claim_semantics@1","predicate":"numeric.cell","polarity":"affirmed","discourse":"asserted","quantifier":"one","modality":"certain","scope":{"population":"cited_rows","subjectRefs":[{"evidenceRefId":"data:example","rowIndex":0,"column":"elapsed_ms","value":7.123456}]},"numeric":{"operator":"eq","value":7.123456,"unit":"ms","presentation":{"schemaVersion":"numeric_presentation@1","unit":"ms","decimalPlaces":1,"rounding":"half_away_from_zero","quotes":[{"text":"7.1 ms"}]}}}}],
  "relationProposals": [],
  "uncertainties": ["Uncertainty"],
  "nextSteps": ["Next step"]
}
```
-->

Only JSON is fenced; the HTML comment stays outside fences and prose. Never print an old declaration as answer text.

`mode`: `initial_report|focused_answer|need_input`. Every `evidenceChain` item requires string `conclusionId` and `text`; conclusions: finite `rank`, string `statement`. Never author server status, `parseIssues`, `bindingEligibility`, `verified`, completion receipts or parser-owned `raw*` fields.

Claims, including inference/recommendation, require unique `id`, faithful `text`, `kind`, `references`, `semantics`; optional: `conclusionId`, `artifactRefs`, `relationRefs`. Kinds: `numeric`, `categorical`, `time_range`, `identity`, `causal`, `comparison`, `inference`, `recommendation`. Choose each stance.
Declare all table/prose facts. Before a final report use `check_conclusion_draft` if available; resolve local diagnostics. Coverage is not checked.
One proposition per claim. Qualifiers asserting another field/property need separate claims; one captured cell cannot prove them. Aggregates are one value, not `all` members. Never disguise observations as possible inferences.

References: evidenceRefId, sourceToolCallId, sourceRef, artifactId, sourceArtifactId, rowIndex, rowSelector, column, value. Issued IDs, raw JSON types/full precision; numbers unquoted. Executions may share evidenceRefId. rowIndex: printed index, not page position (unindexed: 0). rowSelector: unique actual-column map, e.g. {"dump_id":1,"c":83}. Cells need locators; totalRows is metadata. Missing: `[]`, uncertainty. For successful empty results, cite only their emitted IDs; omit rowIndex/rowSelector/column/value (no row 0).

`sourceRef`: Trace alias, not code. Source claims (`source.*`, population `codebase`, or source location in text) require one `sourceClaimBindings` entry `{claimId,sourceReferenceIds,traceEvidenceRefIds}` with issued IDs. `claimId` is unique. Nonempty `traceEvidenceRefIds` require that same claim to own the Trace reference, else `[]`. Never author `sourceUseDecision`/status. Bindings prove neither execution nor causality; the server checks source use.

`semantics`: meaning, not proof; references alone cannot verify:

- `schemaVersion`: `claim_semantics@1`; `predicate`: rule ID (unknown/unverified allowed).
- `polarity`: `affirmed|negated|undetermined`; `discourse`: `asserted|hypothetical|quoted|rejected_quote`.
- `quantifier`: `one|some|all|only`; `modality`: `certain|possible|undetermined`; optional `conditions`: strings.
- `scope.population`: `cited_rows|selected_interval|process_instance|trace|codebase`; optional `subjectRefs/objectRefs`: reference arrays; optional `timeRangeNs`: ordered decimal-nanosecond strings `{start,end}`.
- `numeric` (`numeric.cell` requires it): `{operator,value,unit,presentation?}`; `eq|ne|lt|lte|gt|gte`, finite number or decimal-string value/unit, independent of the cited cell.

Rule boundaries:

- `numeric.cell`: one original `scope.subjectRefs` cell + independent `numeric`; References retain exact raw cell values and native row IDs; preserve producer units. 195000000 ns = 195 ms, not 195000000 ms. Exact equivalents only; never round declarations or references. `eq` binds body literals with `presentation`; otherwise exact values or an explicitly marked fixed-decimal approximation (`约/about/≈`). No causal/advice proof. Totals/means need captured aggregates matching population/window/units, never components.
- `captured.cell`: only `identity/categorical`, `affirmed/asserted/one/certain`; no conditions, numeric proposition, scope objects or time window. `cited_rows`, one subject with explicit column and string/boolean/null `value`. Strict equality only: no coercion/normalization/execution/process resolution/causality. Numbers use `numeric.cell`.

Allowed unit conversions only: time `ns/us/µs/μs/ms/s` (us = µs = μs; 1000 per step); `Hz/kHz/MHz/GHz` (1000); `B/bytes/KiB/MiB/GiB` (B = bytes; 1024); `ratio/%/percent` (1 ratio = 100% = 100 percent). Aliases: frame/frames, event/events, fps/frames/s (frame rate, never Hz/count). `count` accepts frames/events 1:1, never conversely; other units must match verbatim. No cross-family conversion, inferred authority, tolerance, exponents, significant-figure rounding, ranges or ±.

Quotes are exact number+unit substrings across the whole body/tables; omit `occurrence` only if unique. Two `7.1 ms` matches need `quotes:[{"text":"7.1 ms","occurrence":0},{"text":"7.1 ms","occurrence":1}]`. Bind all occurrences for a claim, max 16; decimals 0–18. Counts integral; IDs never round. Formatting binds no meaning or status.
Numeric table cells include units. `numeric` keeps captured unit/value; presentation alone converts/rounds; avoid floating-point loss.

Never reshape claims to fit a predicate. Unknown rules or missing proof remain unverified.

```json
{{supportedProofRules}}
```

`relationProposals`: schemaVersion `evidence_relation_candidate@1`; id unique `proposal:`; kind `overlap|wakeup|blocking_state|binder_peer|lock_owner|comparison_delta|derived`; direction `subject_to_object|object_to_subject|symmetric`; subject reference; optional object/proof references, proofBindings, metricColumn, value, unit, deltaDirection `current_minus_reference`. Preserve candidate meanings. Claims link IDs via relationRefs. Endpoint/interval matches prove neither causality nor verification.

Use compact JSON without dropping fields, claims or values. Escape `<`, `>`, `&` as `\u003c`, `\u003e`, `\u0026` and string newlines/quotes losslessly; no comments or ellipses.
