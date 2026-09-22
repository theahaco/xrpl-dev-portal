// @chunk {"steps": ["import-web-tag"]}
// Runtime functions and type-only imports appear separately in the editor.
import { Client, Wallet, xrpToDrops, validate } from 'xrpl'
import type { AccountInfoRequest, Payment } from 'xrpl'
// @chunk-end

const output = document.getElementById('output')
if (output == null) throw new Error('Missing output element')
const log = (message: string) => {
  const line = document.createElement('p')
  line.textContent = message
  output.append(line)
}

const client = new Client('wss://s.altnet.rippletest.net:51233/')
try {
  // @chunk {"steps": ["connect-tag"]}
  await client.connect()
  log('Connected to Testnet')
  // @chunk-end

  // @chunk {"steps": ["get-account-create-wallet-tag"]}
  // fundWallet() already infers Wallet: hover or type testWallet. to explore it.
  const { wallet: testWallet } = await client.fundWallet()
  log(`Wallet: ${testWallet.address}`)
  // @chunk-end

  // @chunk {"steps": ["get-account-create-wallet-b-tag"]}
  // const testWallet = Wallet.generate()
  // @chunk-end
  // @chunk {"steps": ["get-account-create-wallet-c-tag"]}
  // const testWallet = Wallet.fromSeed('your-seed-key')
  // @chunk-end

  // @chunk {"steps": ["query-xrpl-tag"]}
  // `satisfies` checks fields while preserving command: 'account_info'.
  const request = {
    command: 'account_info',
    account: testWallet.address,
    ledger_index: 'validated'
  } satisfies AccountInfoRequest
  // No response annotation: the command selects AccountInfoResponse for you.
  const response = await client.request(request)
  log(`Account sequence: ${response.result.account_data.Sequence}`)
  // @chunk-end

  // @chunk {"steps": ["build-tx-tag"]}
  // Use our own funded destination rather than an external example address.
  const { wallet: destination } = await client.fundWallet()
  const payment = {
    TransactionType: 'Payment',
    Account: testWallet.address,
    Amount: xrpToDrops('1'),
    Destination: destination.address
  } satisfies Payment

  // Checks supported local constraints; ledger state still determines success.
  // `satisfies` keeps the object compatible with validate(), without a cast.
  validate(payment)
  const submitted = await client.submitAndWait(payment, { wallet: testWallet })
  // A validated transaction can still fail. Check its result before continuing.
  const metadata = submitted.result.meta
  if (metadata == null || typeof metadata === 'string') {
    throw new Error('Expected parsed transaction metadata')
  }
  if (metadata.TransactionResult !== 'tesSUCCESS') {
    throw new Error(`Payment failed: ${metadata.TransactionResult}`)
  }
  log(`Payment confirmed: ${submitted.result.hash}`)
  // @chunk-end

  // @chunk {"steps": ["listen-for-events-tag"]}
  // Register before subscribing; await the subscription so errors propagate.
  client.on('ledgerClosed', (ledger) => {
    log(`Ledger #${ledger.ledger_index}: ${ledger.txn_count} transactions`)
  })
  await client.request({ command: 'subscribe', streams: ['ledger'] })
  await new Promise<void>((resolve) => setTimeout(resolve, 10_000))
  // @chunk-end
} catch (error) {
  log(error instanceof Error ? error.message : String(error))
} finally {
  // @chunk {"steps": ["disconnect-web-tag"]}
  await client.disconnect()
  // @chunk-end
}
