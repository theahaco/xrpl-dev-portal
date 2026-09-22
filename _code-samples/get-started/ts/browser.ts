// @chunk {"steps": ["import-web-tag"]}
import { WalletClient, Wallet, xrpToDrops } from 'xrpl'
// @chunk-end

const output = document.getElementById('output')
if (output == null) throw new Error('Missing output element')
const log = (message: string) => {
  const line = document.createElement('p')
  line.textContent = message
  output.append(line)
}

// @chunk {"steps": ["connect-tag"]}
const client = new WalletClient('wss://s.altnet.rippletest.net:51233/', {
  wallet: Wallet.generate()
})
try {
  await client.connect()
  log('Connected to Testnet')
  // @chunk-end

  // @chunk {"steps": ["get-account-create-wallet-tag"]}
  await client.fundWallet(client.wallet)
  const { wallet: destination } = await client.fundWallet()
  log(`Wallet: ${client.wallet.address}`)
  // @chunk-end


  // @chunk {"steps": ["query-xrpl-tag"]}
  const response = await client.command.accountInfo({
    account: client.wallet.address,
    ledger_index: 'validated'
  })
  log(`Account sequence: ${response.result.account_data.Sequence}`)
  // @chunk-end

  // @chunk {"steps": ["build-tx-tag"]}
  const submitted = await client.tx.payment({
    Amount: xrpToDrops('1'),
    Destination: destination.address
  }).signAndSubmit()

  log(`Payment confirmed: ${submitted.result.hash}`)
  // @chunk-end

  // @chunk {"steps": ["listen-for-events-tag"]}
  client.on('ledgerClosed', (ledger) => {
    log(`Ledger #${ledger.ledger_index}: ${ledger.txn_count} transactions`)
  })
  await client.command.subscribe({ streams: ['ledger'] })
  await new Promise<void>((resolve) => setTimeout(resolve, 10_000))
  // @chunk-end
} catch (error) {
  log(error instanceof Error ? error.message : String(error))
} finally {
  // @chunk {"steps": ["disconnect-web-tag"]}
  await client.disconnect()
  // @chunk-end
}
