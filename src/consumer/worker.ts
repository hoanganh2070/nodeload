import { Kafka } from 'kafkajs'
import fetch from 'node-fetch'
import { Client } from 'minio'
import fs from 'fs/promises'
import path from 'path'
import { createWriteStream } from 'fs'
import logger from '../utils/logger'
import { randomUUID } from 'crypto'
import db from '../configs/db'
import { DownloadStatus } from '@prisma/client'
import { minioClient } from '../configs/minio'

const kafka = new Kafka({ brokers: ['localhost:9092'] })
const consumer = kafka.consumer({
    groupId: 'download-workers-v2',
    // Enable auto commit with a reasonable interval
    sessionTimeout: 30000,
    heartbeatInterval: 3000
})



await consumer.connect()
// Change fromBeginning to false if you only want to process new messages
await consumer.subscribe({ topic: 'task', fromBeginning: true })

await consumer.run({
    // Enable auto commit
    autoCommit: true,
    autoCommitInterval: 5000, // Commit every 5 seconds
    eachMessage: async ({ topic, partition, message }) => {
        const rawValue = message.value
        if (!rawValue) {
            logger.error('❌ Message value is missing')
            // Optional manual commit for this specific message
            await consumer.commitOffsets([{ topic, partition, offset: (parseInt(message.offset) + 1).toString() }])
            return
        }

        const rawString = rawValue.toString('utf-8')
        logger.info(`🧾 Raw message: ${rawString}`)

        let url: string
        let fileName: string
        let taskId: string
        try {
            const parsed = JSON.parse(rawString)
            url = parsed.url
            taskId = parsed.id

            fileName = path.basename(url)
        } catch (err) {
            logger.error('❌ Failed to parse message JSON:', err)
            // Commit offset for invalid messages too, to avoid reprocessing them
            await consumer.commitOffsets([{ topic, partition, offset: (parseInt(message.offset) + 1).toString() }])
            return
        }

        try {
            await fs.mkdir('/tmp', { recursive: true }) // Ensure /tmp exists
            const filePath = `/tmp/${fileName}`

            logger.info(`⬇️ Downloading file from URL: ${url}`)
            const res = await fetch(url)
            logger.info(`📡 Response status: ${res.status}`)

            if (!res.ok || !res.body) {
                throw new Error(`Failed to fetch file: ${res.statusText}`)
            }

            const fileStream = createWriteStream(filePath)

            await new Promise((resolve, reject) => {
                res.body!.pipe(fileStream)
                res.body!.on('error', (err) => {
                    logger.error('❌ Error in response stream:', err)
                    reject(err)
                })
                fileStream.on('error', (err) => {
                    logger.error('❌ Error in file write stream:', err)
                    reject(err)
                })
                fileStream.on('finish', () => {
                    logger.info(`✅ Download complete: ${filePath}`)
                    resolve(null)
                })
            })

            fileName = randomUUID() + fileName
            // Optional MinIO upload
            await minioClient.fPutObject('downloads', fileName, filePath)
            await db.task.update({
                where: { id: taskId },
                data: {
                    fileName,
                    status: DownloadStatus.COMPLETED,
                }
            })
            logger.info(`☁️ Uploaded to MinIO: ${fileName}`)

            // Optional cleanup
            await fs.unlink(filePath)
            logger.info(`🧹 Deleted local file: ${filePath}`)

            // Manually commit offset after successful processing
            await consumer.commitOffsets([{ topic, partition, offset: (parseInt(message.offset) + 1).toString() }])
            logger.info(`✅ Committed offset for message: ${message.offset}`)

        } catch (err) {
            console.error('❌ Error processing message:', err)
            logger.error('❌ Error handling message:', err)
            // You might want to decide whether to commit on error or not
            // If you don't commit on error, the message will be reprocessed
            // Uncomment this if you want to skip error messages:
            // await consumer.commitOffsets([{ topic, partition, offset: (parseInt(message.offset) + 1).toString() }])
        }
    }
})

// Add graceful shutdown to properly disconnect
process.on('SIGINT', async () => {
    try {
        logger.info('Disconnecting consumer...')
        await consumer.disconnect()
        process.exit(0)
    } catch (err) {
        logger.error('Error disconnecting consumer:', err)
        process.exit(1)
    }
})