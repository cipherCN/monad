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
npx hardhat test                   # 40/40, no gas
node challenger/selftest.mjs       # 17/17
node scripts/parity-check.mjs      # 17/17
node scripts/attack-family.mjs     # 7 blocked / 8 as-expected
```

All on-chain evidence referenced by the paper is verifiable in a browser with no
local environment: see `aegis/ARTIFACT.md` §2 for Tenderly public-verification
links (9 contracts) and the end-to-end transaction table.

### Running without a `.env`

These harnesses are deliberately **environment-free**: no `.env`, no API key, and
no funds are needed. Two details make that work.

- **Policy fixtures.** `scripts/parity-check.mjs` derives its whitelist / limits /
  blocklist from the committed `challenger/challenger-policy.json`, so a fresh
  clone with no `.env` still reproduces 17/17. Explicitly exported environment
  variables of the same name still take precedence if you want to override
  locally. (Without this, an absent `.env` yields an empty whitelist and the
  objective fixtures are rejected by the artifact-side field check, producing
  spurious divergence.)
- **The SOA signing key.** `scripts/soa-demo.mjs` needs a *user-role* EIP-191
  signing key via `SOA_USER_PK`. It signs the objective's canonical JSON only —
  it needs no funds and never touches the chain, so any reproducible test key is
  fine:
  `SOA_USER_PK=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d node scripts/soa-demo.mjs`.

### DCAP verifier artifacts

`aegis/dcap-verifier/artifacts-gen/` is **not** checked in (it is generated). The
DCAP harnesses need it, and it rebuilds from npm dependencies alone — no
`vendor/` tree, no network beyond `npm install`:

```bash
cd aegis
node scripts/compile-dcap.mjs      # writes dcap-verifier/artifacts-gen/*.json
```

The output is byte-stable apart from the trailing solc metadata `ipfs` content
hash, which varies between compiles of the same source with identical flags and
does not affect the compiled runtime code.

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
