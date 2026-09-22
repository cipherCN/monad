# Aegis — TEE-Attested Autonomous Trading Agent

Aegis makes an autonomous trading agent's every decision a cryptographic object,
and lets anyone re-derive the verdict without trusting the agent. This repository
is the public source release: the contracts, the deterministic decision pipeline,
the independent challenger, and the evaluation harness that produces every number
quoted below.

**Monad Metropolis Hackathon — Track 04: Trust, Identity & AI Infrastructure.**

The premise: an agent that holds on-chain funds should not be trusted because of
*who ran it*, but because the specific decision it wants to act on can be
**independently re-derived to the same conclusion**. An LLM only ever *proposes*.
The safety-critical path is a deterministic predicate — guardrails, PACE limits,
and a user-signed objective — and a second process, running code that shares no
implementation with the proposer, recomputes the verdict and refuses on any
mismatch. The vault executes a trade only when that recomputation passes.

## What this repository contains

Everything needed to inspect and re-run the system: 11 Solidity contracts, the
in-TEE runtime, the challenger's five-layer independent re-derivation, the
orchestrator, the dashboard used for the recorded end-to-end runs, and the
offline harnesses that reproduce the evaluation table.

Note on completeness: the repository root and `aegis/` contain the code and its
evidence index. Some local working files are not mirrored here — dependency
trees, build outputs, and a 359 MB vendored contract source tree that rebuilds
in one command (`node scripts/compile-dcap.mjs`, see below).

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
npm ci                             # lockfile is committed; .npmrc pins legacy-peer-deps
npx hardhat test                   # 44 passing, no gas
node challenger/selftest.mjs       # 17 pass / 0 fail
node scripts/parity-check.mjs      # 21 agree / 0 diverge
node scripts/attack-family.mjs     # 7/8 blocked; 8 as-expected / 0 unexpected
node scripts/atomic-input.mjs      # ALL REGIMES PASS (4/4)
node scripts/tee-adversary-sim.mjs # ALL LEGS PASS
```

`scripts/soa-demo.mjs` additionally needs a throwaway user-role signing key; see
below. `scripts/regime-cost.mjs` prints the cost table and the ε-net table.

All on-chain evidence is verifiable in a browser with no local environment: see
`aegis/ARTIFACT.md` §2 for Tenderly public-verification links (9 contracts) and
the end-to-end transaction table. Every contract and every transaction cited
there can be checked against the Monad testnet explorer without running
anything locally.

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
index — the complete implementation of the system.

Not mirrored from the local working tree: dependency trees (`node_modules`), build
outputs (`artifacts/`, `.next/`), the 359 MB vendored contract source tree, and
local credentials (`.env`; only `.env.example` is present, and the harnesses run
without any of it). None of these are needed — each rebuilds or is regenerated by
a documented one-command step.

## Provenance

The tag `artifact-anon-2026-09-21` marks the revision this README describes, and
`main` points at the same commit — so a clone of either gives the tree that
passes the harness table above. Commits are authored by the neutral placeholder
`aegis-dev <aegis@local>`.

Two earlier tags are superseded and must not be used: `artifact-anon-2026-09-17`
and `artifact-anon-2026-09-18` predate the current contract deployment and the
dashboard revision, and their reproduction harness does not pass as documented.
Citing them yields a tree that is not the one described in this README.

## License

Provided for evaluation and reproducibility purposes.
