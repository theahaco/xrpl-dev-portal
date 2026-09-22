// @chunk {"steps": ["import-web-tag"]}
import { Client, xrpToDrops } from 'xrpl'
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
  const { wallet: testWallet } = await client.fundWallet()
  const { wallet: destination } = await client.fundWallet()
  log(`Wallet: ${testWallet.address}`)
  // @chunk-end


  // @chunk {"steps": ["query-xrpl-tag"]}
  const response = await client.request({
    command: 'account_info',
    account: testWallet.address,
    ledger_index: 'validated'
  })
  log(`Account sequence: ${response.result.account_data.Sequence}`)
  // @chunk-end

  // @chunk {"steps": ["build-tx-tag"]}
  const submitted = await client.submitAndWait({
    TransactionType: 'Payment',
    Account: testWallet.address,
    Amount: xrpToDrops('1'),
    Destination: destination.address
  }, { wallet: testWallet })

  const result = submitted.result.meta.TransactionResult
  if (result !== 'tesSUCCESS') {
    throw new Error(`Payment failed: ${result}`)
  }
  log(`Payment confirmed: ${submitted.result.hash}`)
  // @chunk-end

  // @chunk {"steps": ["listen-for-events-tag"]}
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
