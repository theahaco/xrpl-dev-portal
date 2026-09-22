# Unreleased DevX SDK comparison

These four workflows demonstrate the **proposed aha SDK changes**. They require the built aha fork in a sibling `xrpl.js` checkout. They are not examples of features released in npm `xrpl` 5.3.0. Getting Started now presents the proposed experience by default; its published 5.3.0 comparison lives in `devx-before/get-started`. The other ordinary sample directories retain their runnable 5.3.0 versions.

## Prerequisite and setup

Arrange the two forks as siblings:

```text
xrpl.js/packages/xrpl/dist/npm/index.js
xrpl-dev-portal/_code-samples/devx-after/
```

Build the prototype SDK using its repository instructions. In this directory, `package.json` uses the sibling SDK via a local file dependency, and `tsconfig.json` checks against that SDK's built declarations. Both runtime and types must use the same prototype.

```sh
npm install
npm run typecheck
npm run build
```

Run one example with Node.js 22 or later:

```sh
npm run get-started
npm run send-xrp
npm run issue-mpt
npm run create-amm
```

Each command uses fresh faucet-funded accounts; Get Started/Send XRP use Testnet and MPT/AMM use Devnet. MPT update functionality requires the relevant amendments. `XRPL_SERVER` changes the CLI server but does not replace the faucet funding policy. No Mainnet credentials are requested.

## What changes in the editor

| Journey | Current-release source | Proposed behavior |
|---|---|---|
| Get Started | `../devx-before/get-started/get-acct-info.ts` | Wallet-bound `tx.payment().signAndSubmit()` and `command.accountInfo()` guide discovery and return successful, typed results. |
| Send XRP | `../send-xrp/ts/send-xrp.ts` | `autofill(payment)` exposes populated fields without a generic; the signed blob preserves Payment into the response. |
| MPT | `../issue-mpt-with-metadata/ts/issue-mpt-with-metadata.ts` | The MPT selector narrows the ledger-entry type; parsed metadata is guaranteed after validated inclusion. |
| AMM | `../create-amm/ts/create-amm-guided.ts` | `submitAndWait` checks every transaction result inside the SDK. |

The prototype SDK now checks transaction success for all four examples and throws on unsuccessful validated transactions. Use `trySubmitAndWait` for an explicit success/error result. This is a proposed breaking change from published 5.3.0. The MPT example retains the possibly absent creation ID and optional ledger metadata checks. The AMM example retains the unavailable validated-ledger check. Request failures still propagate to an entrypoint that disconnects in `finally` and reports a failing exit status.

## Isolated-ledger verification

Each module exports `run()` and can be imported without starting a network request. A caller can supply its own connected client and funded wallets; that caller owns connection cleanup. Get Started takes a `WalletClient`, a recipient wallet, and an optional event-listening duration, allowing zero in an integration harness. This keeps local test funding details out of the public workflow.
