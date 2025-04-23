import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createUser, listUsers } from '../handlers/user.handler';
import logger from '../utils/logger';
import { createTask, getDownloadFile } from '../handlers/task.handle';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROTO_PATH = path.join(__dirname, '../../proto/nodeload.proto');

// Load proto
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const proto = grpc.loadPackageDefinition(packageDefinition) as any;



function main() {
    const server = new grpc.Server();

    // Đảm bảo đúng package và service name
    server.addService(proto.nodeload.DownloadService.service, {
        CreateUser: createUser,
        ListUsers : listUsers,
        CreateTask : createTask,
        GetDownloadFile : getDownloadFile
    });

    server.bindAsync('0.0.0.0:6300', grpc.ServerCredentials.createInsecure(), () => {
        logger.info('Grpc server running at http://0.0.0.0:6300');

    });
}

main();
