# Send XRP with TypeScript

A complete prepare → sign → submit → confirm journey using published `xrpl` **5.3.0**, strict TypeScript, and two fresh Testnet wallets. Use Node.js 22 or later.

```sh
npm install
npm run typecheck
npm start
```

The sample sends 1 test XRP and reports the validated transaction hash only after checking `tesSUCCESS`. It always disconnects and exits with a failing status on an error. It requires the public Testnet server and faucet; no stored credentials are needed.

In your editor, `satisfies Payment` guides transaction fields. `autofill()` returns a new object, which must be passed to `sign()`. The signed blob does not carry the transaction's TypeScript type, so response metadata still requires runtime narrowing with the current SDK. No assertions are used to imply otherwise.

For the separately labeled **unreleased SDK prototype** comparison, see [DevX after examples](../../devx-after/README.md). The example in this directory continues to use published xrpl 5.3.0.
