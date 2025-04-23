import fastify from "fastify";
import { userRouter } from "../routes/user.route";
import logger from "../utils/logger";

const app = fastify({ logger: false });


userRouter(app);

app.listen({ port: 6200 }, (err, address) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
    logger.info(`Server is running at ${address}`);
});

