# AC Roadmap

Last updated: 2026-10-07

This roadmap separates live-verified foundations, research work, and future features.

## Status vocabulary

- **LOCKED** — approved baseline contract; changes require explicit decision
- **IMPLEMENTED** — code exists and deterministic verification passes
- **LIVE VERIFIED** — browser/live path has been tested successfully
- **RESEARCH** — evidence gathering/normalization in progress
- **PLANNED** — not yet implemented

## Foundation already completed

### Phase 2A — Core recommendation/Blueprint flow
Status: **LOCKED baseline**

Includes Draft/Commit, Call A, Call B, caching/stale protection, and structured outfit proposal.

### Phase 2B — Lookbook generation
Status: **LIVE VERIFIED**

Includes realistic 3:4 image generation, immutable GenerationSnapshot, ephemeral image handling, and lineage-aware image state.

### Phase 2C — Visual QA v2
Status: **LIVE VERIFIED baseline**

Includes assessability, Cultural Identity, Outfit Fidelity, actionability, AC Stylist presentation, and V0/V1/V2 correction behavior.

Visual perception accuracy remains benchmark-sensitive; "live verified baseline" does not mean every visual trait is solved permanently.

### Phase 2D — Guided Exploration
Status: **LIVE VERIFIED**

Includes:

- Gần truyền thống hơn
- Biến tấu hơn
- Phối khác cùng tinh thần
- independent branch lineage
- root preservation
- wearer-context propagation

### Track A — Runtime + UX stabilization
Status: **LIVE VERIFIED**

Includes:

- Exploration gating/placement
- QA/actionability consistency
- conservative sleeve handling
- AC Stylist primary UX
- idle-session reset
- Lite-only A/B/Exploration routing
- cross-API non-JSON hardening

## G0 — Repository Governance

Status: **IN PROGRESS**

### Layer 1
- [x] README.md
- [x] AGENTS.md
- [x] GEMINI.md
- [x] docs/PROJECT_CONSTITUTION.md
- [x] docs/KNOWN_FAILURES.md
- [x] docs/ROADMAP.md

### Layer 2
Planned next:

- [ ] docs/CULTURAL_KNOWLEDGE_POLICY.md
- [ ] docs/MODEL_ROUTING_POLICY.md
- [ ] docs/STATE_AND_LINEAGE_INVARIANTS.md
- [ ] docs/VISUAL_QA_CONTRACT.md
- [ ] docs/PRIVACY_AND_USER_IMAGES.md
- [ ] .github/copilot-instructions.md
- [ ] optional path-specific instructions under .github/instructions/

G0 should be completed before large new feature work.

## G1 — Cultural Knowledge Supplement v1.1

Status: **RESEARCH**

Goal: close the wearer/gender/styling/accessory knowledge gap without rewriting Master v1.0 from scratch.

Research dimensions:

`garment × wearer × period × region × occasion × styling element × evidence`

Work completed conceptually:

- wearer compatibility research
- historical ensemble research
- accessories/jewelry/hairstyle research
- contemporary remix layer

Next after G0:

- **E — Product Rules v1.1**
- normalize research into machine-readable policy
- review before integration

Important: no cultural rule becomes production logic merely because it appeared in research discussion. It must be approved and encoded with provenance/evidence status.

## G2 — Integrate Cultural Supplement v1.1

Status: **PLANNED**

Integrate approved v1.1 rules into:

- Call A Recommendation
- Call B Blueprint
- Guided Exploration
- image prompt compilation
- Visual QA contextual interpretation
- AC Stylist explanations

No model should invent missing wearer/accessory compatibility.

## G3 — AC Chat Assistant

Status: **PLANNED**

Target model: `gemini-3.5-flash-lite`

Initial scope:

- answer questions about the three supported garments,
- explain AC recommendations and QA,
- answer styling questions using approved knowledge,
- explicitly acknowledge insufficient approved evidence.

Initial mutation policy:

- read-only by default,
- suggestions may expose an explicit "Áp dụng gợi ý" action,
- chat must not silently modify Blueprint/session state.

Grounding requirement:

Approved AC knowledge only; pretrained model knowledge is not silent historical authority.

## G4 — Personal Portrait Try-on

Status: **PLANNED**

Goal: allow the user to provide a portrait/reference image and visualize the same person wearing the selected AC outfit.

Prerequisites:

- privacy contract,
- ephemeral portrait-reference storage,
- no persistent face profile/embedding,
- no portrait bytes in Git/local persistent app state,
- lineage-safe identity preservation,
- portrait mode does not infer cultural styling from personal appearance.

The portrait is an identity reference, not cultural evidence.

## G5 — Demo hardening & submission

Status: **PLANNED**

Focus:

- public deployment reliability
- mobile/responsive verification
- latency budget
- quota/cost guardrails
- demo rehearsal
- README/screenshots
- competition narrative
- known limitations
- final regression matrix

## Decision rule for sequencing

Do not start G3/G4 before:

1. G0 governance contracts exist,
2. G1 cultural supplement is approved,
3. G2 integration is stable enough that new features will not build on known cultural-policy gaps.

This ordering intentionally prioritizes correctness and repeatability over feature count.
