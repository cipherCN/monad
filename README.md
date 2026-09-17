# Aegis — Anonymous Artifact Mirror

This repository is the **anonymized artifact mirror** for a paper currently under
double-blind review. It mirrors the code and evaluation harness of the Aegis
prototype (a TEE-attested autonomous trading agent) so that reviewers can
inspect, build, and re-derive every number reported in the paper.

**Nothing in this repository identifies the authors.** The commit identity is a
neutral placeholder, and the hackathon-internal planning documents of the
original working tree are deliberately excluded (see *Scope* below).

## Layout

| Path | Contents |
|---|---|
| `aegis/contracts/` | Core Solidity contracts (6 deployed + 3 M2/M3 components) |
| `aegis/scripts/` | Offline harnesses: attack-family / selftest / parity / regime-cost / soa-demo / tee-adversary-sim / atomic-input |
| `aegis/challenger/` | Independent verification process, self-owned policy, input-commitment layer |
| `aegis/tee-runtime/` | In-TEE agent runtime and LLM plumbing |
| `aegis/dcap-verifier/` | DCAP quote verification integration |
| `dashboard/` | Next.js dashboard used for the recorded end-to-end runs |
| `aegis/ARTIFACT.md` | One-command reproduction table + on-chain evidence index |

## Reproduction

See `aegis/ARTIFACT.md` §1 for the full one-command zero-gas reproduction table.
The short version:

```bash
cd aegis
npm install
npx hardhat test              # 40/40, no gas
node scripts/attack-family.mjs
node scripts/selftest.mjs
node scripts/parity-check.mjs
```

All on-chain evidence referenced by the paper is verifiable in a browser with no
local environment: see `aegis/ARTIFACT.md` §2 for Tenderly public-verification
links (9 contracts) and the end-to-end transaction table.

## Scope

Included: all code, tests, evaluation harnesses, and the on-chain evidence
index. Excluded: the original repository's top-level hackathon submission
material and internal engineering transfer notes, none of which are needed to
reproduce the paper's results and some of which contain non-public context.

## Provenance

The tree here corresponds to the paper's frozen artifact revision. The `main`
branch carries a single curated commit; the tag marks the revision referenced by
the paper.

## License

Provided for artifact evaluation and reproducibility purposes.
