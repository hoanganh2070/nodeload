import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { Config } from "../configs/config";

export const authMiddleware = async (request : FastifyRequest, reply : FastifyReply) => {

    const authHeader = request.headers['authorization'];
    if (!authHeader) {
        return reply.status(401).send({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return reply.status(401).send({ error: 'Unauthorized' });
    }

    try {
     
        const decoded = jwt.verify(token, Config.JWT_SECRET as string);
        if (typeof decoded !== 'object' || !decoded) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
        // @ts-ignore
        request.user = decoded; // Attach user info to request
    } catch (error) {
        return reply.status(403).send({ error: 'Forbidden' });
    }

}