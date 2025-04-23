import pino from 'pino';

const logger = pino({
  level: 'info', // Có thể là 'debug', 'info', 'warn', 'error'
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,       // Màu sắc log trong terminal
      translateTime: 'SYS:standard', // Thêm timestamp
    }
  }
});

export default logger;
