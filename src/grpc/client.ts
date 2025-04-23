import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROTO_PATH = path.join(__dirname, '../../proto/nodeload.proto');

// Load proto definition
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

// Load the package
const proto = grpc.loadPackageDefinition(packageDefinition) as any;

// Create client for the service
const grpcClient = new proto.nodeload.DownloadService(
  'localhost:6300',
  grpc.credentials.createInsecure()
);

export { grpcClient };
