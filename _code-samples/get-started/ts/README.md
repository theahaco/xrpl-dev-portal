# Send your first test XRP with TypeScript

Connect, create two test wallets, look up an account, and send 1 test XRP. Let your editor guide the transaction fields and returned data. The SDK checks payment success, and the example closes the connection when finished.

**aha preview:** this walkthrough uses the unreleased DevX SDK fork. The [published 5.3.0 comparison](../../devx-before/get-started/README.md) is retained separately.

## Set up the preview

Use Node.js 22 or later. Check out `aha/devx-audit-2026-09` in both aha forks and arrange `xrpl.js` and `xrpl-dev-portal` as siblings. From the SDK repository:

```sh
npm install
npm run build
```

Then, from this example directory:

```sh
npm install
npm run typecheck
npm start
```

The script prints an account sequence, a confirmed payment hash, and ledger events. It uses Testnet and fresh faucet-funded wallets; Testnet XRP has no monetary value.

## Follow the editor

- `new WalletClient(server, { wallet })` binds the signing wallet once.
- Type `client.command.` to discover requests such as `accountInfo`, with inferred responses.
- Type `client.tx.` to discover transactions such as `payment`, with documented fields. `Account` defaults to the wallet; the factory supplies `TransactionType`.
- `.signAndSubmit()` prepares, signs, submits, and waits for validated success. It throws on failure; no protocol result-code strings or metadata-format guards are needed.
- `.trySignAndSubmit()` returns an explicit `{ ok, response/error }` result. The lower-level equivalents are `submitAndWait()` and `trySubmitAndWait()`.
- Creating a builder sends nothing. Call `.toJSON()` to inspect the draft or `.signAndSubmit()` to send it. Handle an unknown network outcome by checking the transaction before retrying.

This preview changes the failure behavior of `submitAndWait`: existing applications that inspect unsuccessful validated responses must migrate to the `try` result or catch `TransactionFailedError`, whose `response` preserves the validated transaction.

## Run in a browser

After building the SDK and installing the example as above:

```sh
npm run build
python3 -m http.server 8000
```

Open `http://localhost:8000/index.html`. The page uses the local prototype browser bundle and the same SDK declarations as Node. The small import-map adapter is included in this directory; it requires no application type assertions.
