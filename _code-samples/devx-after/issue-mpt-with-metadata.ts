// PROTOTYPE: requires the built aha DevX SDK fork; not published xrpl 5.3.0.
import { pathToFileURL } from 'node:url'
import {
  WalletClient,
  Wallet,
  MPTokenIssuanceCreateImmutableFlags,
  MPTokenIssuanceSetFlags,
  encodeMPTokenMetadata,
  decodeMPTokenMetadata
} from 'xrpl'

export async function run(client: WalletClient): Promise<void> {
  console.log(`Issuer: ${client.wallet.address}`)

  // Define metadata as JSON
  // Type-ahead exposes documented metadata fields before encoding them to hex.
  const metadata = encodeMPTokenMetadata({
    ticker: 'TBILL',
    name: 'T-Bill Yield Token',
    desc: 'Demonstration token backed by fictional short-term Treasuries.',
    icon: 'https://example.org/tbill-icon.png',
    asset_class: 'rwa',
    asset_subclass: 'treasury',
    issuer_name: 'Example Yield Co.',
    uris: [{ uri: 'https://example.org/tbill', category: 'website', title: 'Product' }],
    additional_info: { interest_rate: '5.00%', maturity_date: '2045-06-30' }
  })

  // Create the issuance and wait for successful validation.
  const created = await client.tx.mpTokenIssuanceCreate({
    AssetScale: 4,
    MaximumAmount: '50000000',
    TransferFee: 0,
    // Named properties give completion and avoid memorizing numeric flags.
    Flags: { tfMPTCanTransfer: true, tfMPTCanLock: true },
    ImmutableFlags: MPTokenIssuanceCreateImmutableFlags.tifMPTCanClawback,
    MPTokenMetadata: metadata
  }).signAndSubmit()
  const creationMetadata = created.result.meta
  // Issuance metadata is inferred; the creation ID remains optional.
  if (creationMetadata.mpt_issuance_id == null) {
    throw new Error('Successful issuance did not return an MPT issuance ID')
  }
  const issuanceId = creationMetadata.mpt_issuance_id
  console.log(`MPT created: https://devnet.xrpl.org/mpt/${issuanceId}`)

  // Query and decode metadata
  const entry = await client.command.ledgerEntry({
    mpt_issuance: issuanceId,
    ledger_index: 'validated'
  })
  const node = entry.result.node
  // The MPT selector infers MPTokenIssuance; metadata is still optional.
  if (node.MPTokenMetadata == null) {
    throw new Error('Expected an MPT issuance with metadata')
  }
  const currentMetadata = decodeMPTokenMetadata(node.MPTokenMetadata)
  console.log('Metadata:', currentMetadata)

  // Update mutable properties
  await client.tx.mpTokenIssuanceSet({
    MPTokenIssuanceID: issuanceId,
    MPTokenMetadata: encodeMPTokenMetadata({
      ...currentMetadata,
      additional_info: { interest_rate: '4.75%', maturity_date: '2045-06-30' }
    }),
    TransferFee: 10,
    Flags: MPTokenIssuanceSetFlags.tfMPTSetCanTrade,
    // Replaces metadata first, then permanently prevents later metadata edits.
    ImmutableFlags: MPTokenIssuanceCreateImmutableFlags.tifMPTMetadata
  }).signAndSubmit()

  // Confirm the update
  const confirmation = await client.command.ledgerEntry({
    mpt_issuance: issuanceId,
    ledger_index: 'validated'
  })
  const updatedNode = confirmation.result.node
  if (updatedNode.MPTokenMetadata == null) {
    throw new Error('Expected an updated MPT issuance with metadata')
  }
  console.log('Transfer fee:', updatedNode.TransferFee)
  console.log('Updated metadata:', decodeMPTokenMetadata(updatedNode.MPTokenMetadata))
}

// The command-line entrypoint owns the connection and test-account funding.
async function main(): Promise<void> {
  const client = new WalletClient(
    process.env.XRPL_SERVER ?? 'wss://s.devnet.rippletest.net:51233',
    { wallet: Wallet.generate() }
  )
  try {
    await client.connect()
    await client.fundWallet(client.wallet)
    await run(client)
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
