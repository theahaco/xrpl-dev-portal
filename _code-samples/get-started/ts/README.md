# Send your first test XRP with TypeScript

Connect, create two test wallets, look up an account, and send 1 test XRP. Let your editor guide the transaction fields and returned data. The example checks the payment result and closes the connection when finished.

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

- Inside `client.request`, `command: 'account_info'` selects the request fields and account response.
- Inside `client.submitAndWait`, `TransactionType: 'Payment'` selects Payment fields. No `Payment` import, annotation, generic, `satisfies`, or cast is needed.
- `submitAndWait` prepares, validates during signing, signs, submits, and waits for validated inclusion. The SDK guarantees parsed metadata, so the example reads `TransactionResult` directly.
- A transaction can be included in a validated ledger and still fail. The result check handles that outcome.

## Run in a browser

After building the SDK and installing the example as above:

```sh
npm run build
python3 -m http.server 8000
```

Open `http://localhost:8000/index.html`. The page uses the local prototype browser bundle and the same SDK declarations as Node. The small import-map adapter is included in this directory; it requires no application type assertions.
