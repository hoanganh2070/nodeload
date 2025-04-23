import { FastifyRequest } from "fastify";
import db from "../configs/db";
import { DownloadStatus, DownloadType } from "@prisma/client";
import { producer } from "../configs/broker";
import logger from "../utils/logger";
import { minioClient } from "../configs/minio";


export const createTask = async (call: any, callback: any) => {

    const { url, userId } = call.request;

    try {

        const task = await db.task.create({
            data: {
                url, userId,
                status: DownloadStatus.PENDING,
                type: DownloadType.HTTP
            },
        });

        await producer.connect();
        await producer.send({
            topic: 'task',
            messages: [
                {
                    value: JSON.stringify({ id: task.id, url: task.url }),
                },
            ],
        });

        callback(null, { id: task.id, url: task.url, status: task.status });


    }
    catch (error) {
        callback({
            code: 13, // INTERNAL
            message: 'Failed to create task',
        });
    }
}

export const getDownloadFile = async (call: any, callback: any) => {
    const { task_id } = call.request;
    console.log(call.request);

    try {
        const task = await db.task.findUnique({
            where: { id : task_id },
            include: { user: true }
        });

        



        if (!task) {
            callback({
                code: 5, // NOT_FOUND
                message: 'Task not found',
            });
            return;
        }

        const {fileName} = task || {};

        try {
            // Kiểm tra file có tồn tại
            if (!fileName) {
                throw new Error("File name is null or undefined");
            }
            const exists = await minioClient.statObject("downloads", fileName);
            logger.info(`📄 Found file: ${fileName}, size: ${exists.size} bytes`);
            
            // Lấy stream file từ MinIO
            const fileStream = await minioClient.getObject("downloads", fileName);
            
            // Stream dữ liệu về client qua gRPC
            fileStream.on('data', (chunk) => {
              logger.debug(`📦 Streaming chunk of size: ${chunk.length} bytes`);
              call.write({ data: chunk });
            });
            
            fileStream.on('end', () => {
              logger.info(`✅ File streaming completed: ${fileName}`);
              call.end();
            });
            
            fileStream.on('error', (err) => {
              logger.error(`❌ Error streaming file: ${err.message}`);
              call.destroy(err);
            });
            
          } catch (err :any) {
            logger.error(`❌ Error accessing file from MinIO: ${err.message}`);
            call.destroy(new Error(`Failed to get file: ${err.message}`));
          }

        // callback(null, { task });

    }
    catch (error) {
        console.error(error);
        callback({
            code: 13, // INTERNAL
            message: 'Failed to get task',
        });
    }
}