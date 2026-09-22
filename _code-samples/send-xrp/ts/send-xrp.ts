import { pathToFileURL } from 'node:url'
import { Client, xrpToDrops } from 'xrpl'
import type { Payment, Wallet } from 'xrpl'

export async function run(client: Client, sender: Wallet, receiver: Wallet): Promise<void> {
  // Prepare: completion guides required fields and preserves Payment's kind.
  const payment = {
    TransactionType: 'Payment',
    Account: sender.address,
    Destination: receiver.address,
    Amount: xrpToDrops('1')
  } satisfies Payment
  // Current SDK workaround: name Payment to expose optional autofilled fields.
  const prepared = await client.autofill<Payment>(payment)
  // autofill returns a new object. Sign that result, not the input object.
  console.log('Prepared fee:', prepared.Fee)

  // Sign locally. The wallet's seed never goes to the server.
  const signed = sender.sign(prepared)

  // Submit the signed blob and wait for a validated ledger result.
  const confirmed = await client.submitAndWait(signed.tx_blob)
  const metadata = confirmed.result.meta
  if (metadata == null || typeof metadata === 'string') {
    throw new Error('Expected parsed payment metadata')
  }
  if (metadata.TransactionResult !== 'tesSUCCESS') {
    throw new Error(`Payment failed: ${metadata.TransactionResult}`)
  }
  console.log(`Payment confirmed: ${confirmed.result.hash}`)
  console.log(`Receiver balance: ${await client.getXrpBalance(receiver.address)} XRP`)
}

// The command-line entrypoint owns the connection; run() accepts funded wallets.
async function main(): Promise<void> {
  const client = new Client(process.env.XRPL_SERVER ?? 'wss://s.altnet.rippletest.net:51233')
  try {
    await client.connect()
    const { wallet: sender } = await client.fundWallet()
    const { wallet: receiver } = await client.fundWallet()
    await run(client, sender, receiver)
  } finally {
    await client.disconnect()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
