# Published 5.3.0 comparison: Get Started

This retained comparison shows the workarounds needed by published 5.3.0. The proposed [main walkthrough](../../get-started/ts/README.md) demonstrates the cleaner SDK contract.

This sample uses published `xrpl` **5.3.0**, TypeScript 5.9.3, and strict checking. It connects to Testnet, funds two disposable accounts, queries account data, sends 1 test XRP, checks the validated result, and listens for ledger events for ten seconds. It disconnects on success or failure.

## Run in Node.js

Use Node.js 22 or later. From this directory:

```sh
npm install
npm run typecheck
npm start
```

The script prints account sequence, the confirmed transaction hash, and ledger events. Faucet/network availability affects the run. Testnet XRP has no monetary value. Each run creates fresh accounts; do not replace this connection with Mainnet while following the example.

## Run in a browser

```sh
npm install
npm run build
python3 -m http.server 8000
```

Open `http://localhost:8000/index.html`. Serve the directory over HTTP so module imports work. The import map pins the same xrpl version used by the compiler.

## Learn through your editor

- Type `testWallet.` and `response.result.account_data.` to discover inferred fields.
- `satisfies Payment` supplies field completion, checks required fields and known value types, and retains the literal transaction kind. Published 5.3.0 still accepts additional field names; stricter typo rejection requires the proposed SDK change.
- `validate(payment)` checks supported local constraints without an assertion. It cannot establish the destination's ledger state or guarantee execution.
- A resolved `submitAndWait()` means validated inclusion; inspect `TransactionResult` before reporting success. The current SDK still requires narrowing the metadata union.

For the separately labeled **unreleased SDK prototype** comparison, see [DevX after examples](../../devx-after/README.md). The example in this directory continues to use published xrpl 5.3.0.
