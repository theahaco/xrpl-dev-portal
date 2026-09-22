import { pathToFileURL } from 'node:url'
// PROTOTYPE: requires the built aha DevX SDK fork; not published xrpl 5.3.0.
import { AccountSetAsfFlags, Client, dropsToXrp, xrpToDrops } from 'xrpl'
import type { AccountSet, AMMCreate, AMMInfoRequest, Amount, Payment, TrustSet, ValidatedTxResponse, Wallet } from 'xrpl'

// Every transaction has its own checked result. Validation can include failures.
function requireSuccess(response: ValidatedTxResponse): void {
  const metadata = response.result.meta
  if (metadata.TransactionResult !== 'tesSUCCESS') {
    throw new Error(`Transaction ${response.result.hash} failed: ${metadata.TransactionResult}`)
  }
}

function describeAmount(amount: Amount): string {
  return typeof amount === 'string'
    ? `${dropsToXrp(amount)} XRP`
    : `${amount.value} ${amount.currency}.${amount.issuer}`
}

export async function run(client: Client, issuer: Wallet, provider: Wallet): Promise<void> {
  const asset = { currency: 'FOO', issuer: issuer.address }

  // Enable rippling before issuing tokens that can trade in the pool.
  const configureIssuer = {
    TransactionType: 'AccountSet',
    Account: issuer.address,
    SetFlag: AccountSetAsfFlags.asfDefaultRipple
  } satisfies AccountSet
  requireSuccess(await client.submitAndWait(configureIssuer, { wallet: issuer }))

  // Give the provider a trust line, then issue enough FOO for the deposit.
  const trust = {
    TransactionType: 'TrustSet',
    Account: provider.address,
    LimitAmount: { ...asset, value: '1000' }
  } satisfies TrustSet
  requireSuccess(await client.submitAndWait(trust, { wallet: provider }))
  const issue = {
    TransactionType: 'Payment',
    Account: issuer.address,
    Destination: provider.address,
    Amount: { ...asset, value: '1000' }
  } satisfies Payment
  requireSuccess(await client.submitAndWait(issue, { wallet: issuer }))

  // AMMCreate burns the current owner reserve, rather than the ordinary fee.
  const server = await client.request({ command: 'server_state' })
  const ledger = server.result.state.validated_ledger
  if (ledger == null) throw new Error('Server has no validated ledger yet')

  // Create a fresh FOO/XRP pool. Both Amount forms are visible in one object.
  const create = {
    TransactionType: 'AMMCreate',
    Account: provider.address,
    Amount: { ...asset, value: '100' },
    Amount2: xrpToDrops('10'),
    TradingFee: 500, // 0.5%; units are 1/100,000.
    Fee: String(ledger.reserve_inc)
  } satisfies AMMCreate
  const created = await client.submitAndWait(create, { wallet: provider })
  requireSuccess(created)
  console.log(`AMM created: https://devnet.xrpl.org/transactions/${created.result.hash}`)

  // Query the AMM: the request command infers its response shape.
  const request = {
    command: 'amm_info',
    asset,
    asset2: { currency: 'XRP' },
    ledger_index: 'validated'
  } satisfies AMMInfoRequest
  const response = await client.request(request)
  const amm = response.result.amm
  console.log(`Pool: ${describeAmount(amm.amount)} / ${describeAmount(amm.amount2)}`)
  console.log(`LP tokens: ${amm.lp_token.value} ${amm.lp_token.currency}`)

  // Inspect the provider's LP-token trust line.
  const balances = await client.request({
    command: 'account_lines',
    account: provider.address,
    peer: amm.lp_token.issuer,
    ledger_index: 'validated'
  })
  console.log('LP-token trust lines:', balances.result.lines)
}
async function main(): Promise<void> {
  const client = new Client(process.env.XRPL_SERVER ?? 'wss://s.devnet.rippletest.net:51233')
  try {
    await client.connect()
    const { wallet: issuer } = await client.fundWallet()
    const { wallet: provider } = await client.fundWallet()
    await run(client, issuer, provider)
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
