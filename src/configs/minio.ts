import { Client } from "minio";

export const minioClient = new Client({
    endPoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: 'usBfMP6b97ahudor5uEu',
    secretKey: 'r3zFoKTZDI8BpSfgJACihV9F7Ac3PXdYq8PCBc97'
})