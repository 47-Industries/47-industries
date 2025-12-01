// Script to reorganize R2 files into proper folders
// Run with: node scripts/reorganize-r2.js

require('dotenv').config()
const { S3Client, CopyObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3')

const R2_ENDPOINT = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
const BUCKET = process.env.R2_BUCKET_NAME || '47industries-files'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

// Define file mappings: filename pattern -> destination folder
const FILE_MAPPINGS = [
  // MotoRev project files -> projects/
  { pattern: /moto_17\.png$/, dest: 'projects' },
  { pattern: /motorev-/, dest: 'projects' },
  { pattern: /Screenshot_2025-12-01_at_9\.15\.45_AM\.png$/, dest: 'projects' },

  // Reflux Labs -> projects/
  { pattern: /refluxlabs\.png$/, dest: 'projects' },

  // Other screenshots (likely project related) -> projects/
  { pattern: /Screenshot_2025-10-11/, dest: 'projects' },
  { pattern: /Screenshot_15\.png$/, dest: 'projects' },
  { pattern: /Screenshot_17\.png$/, dest: 'projects' },
  { pattern: /Screenshot_20\.png$/, dest: 'projects' },
  { pattern: /Screenshot_21\.png$/, dest: 'projects' },
  { pattern: /Screenshot_22\.png$/, dest: 'projects' },
  { pattern: /Screenshot_23\.png$/, dest: 'projects' },
  { pattern: /Screenshot_24\.png$/, dest: 'projects' },

  // IMG_ files are actual product photos -> products/ (stay where they are)
  { pattern: /IMG_/, dest: 'products' },
]

async function listAllFiles() {
  const files = []
  let continuationToken = undefined

  do {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: 'products/',
      ContinuationToken: continuationToken,
    })

    const response = await r2Client.send(command)
    if (response.Contents) {
      files.push(...response.Contents.map(obj => obj.Key))
    }
    continuationToken = response.NextContinuationToken
  } while (continuationToken)

  return files
}

async function moveFile(sourceKey, destFolder) {
  const filename = sourceKey.split('/').pop()
  const destKey = `${destFolder}/${filename}`

  if (sourceKey === destKey) {
    console.log(`  SKIP: ${sourceKey} (already in correct folder)`)
    return null
  }

  console.log(`  MOVE: ${sourceKey} -> ${destKey}`)

  // Copy to new location
  await r2Client.send(new CopyObjectCommand({
    Bucket: BUCKET,
    CopySource: `${BUCKET}/${sourceKey}`,
    Key: destKey,
  }))

  // Delete original
  await r2Client.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: sourceKey,
  }))

  return { from: sourceKey, to: destKey }
}

function getDestinationFolder(filename) {
  for (const mapping of FILE_MAPPINGS) {
    if (mapping.pattern.test(filename)) {
      return mapping.dest
    }
  }
  // Default: keep in products if no match (or could use 'misc')
  return 'products'
}

async function main() {
  console.log('=== R2 File Reorganization ===\n')
  console.log(`Bucket: ${BUCKET}`)
  console.log(`Endpoint: ${R2_ENDPOINT}\n`)

  // List all files in products/
  console.log('Listing files in products/ folder...')
  const files = await listAllFiles()
  console.log(`Found ${files.length} files\n`)

  const moves = []

  for (const file of files) {
    const filename = file.split('/').pop()
    const destFolder = getDestinationFolder(filename)

    if (destFolder !== 'products') {
      const result = await moveFile(file, destFolder)
      if (result) {
        moves.push(result)
      }
    } else {
      console.log(`  KEEP: ${file} (product image)`)
    }
  }

  console.log('\n=== Summary ===')
  console.log(`Files moved: ${moves.length}`)

  if (moves.length > 0) {
    console.log('\n=== Database URL Updates Needed ===')
    console.log('Run these SQL updates to fix the URLs:\n')

    for (const move of moves) {
      const oldUrl = `https://files.47industries.com/${move.from}`
      const newUrl = `https://files.47industries.com/${move.to}`
      console.log(`-- ${move.from.split('/').pop()}`)
      console.log(`UPDATE ServiceProject SET thumbnailUrl = '${newUrl}' WHERE thumbnailUrl = '${oldUrl}';`)
      console.log(`UPDATE ServiceProject SET images = REPLACE(images, '${oldUrl}', '${newUrl}') WHERE images LIKE '%${oldUrl}%';`)
      console.log('')
    }
  }
}

main().catch(console.error)
