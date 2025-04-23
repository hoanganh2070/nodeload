import db from "../configs/db";
import logger from "../utils/logger";
import bcrypt from "bcryptjs";



export const createUser = async (call: any, callback: any) => {
    const { username, password } = call.request;
    logger.info(`Creating user with username: ${username}`);

    try {

        const hashPassword = bcrypt.hashSync(password, 8);

        const user = await db.user.create({
            data: { username, password : hashPassword },
        });

        logger.info(`User created with ID: ${user.id}`);
        callback(null, { id: user.id, username: user.username });

    } catch (error) {
        logger.error(`Error creating user: ${error}`);
        callback({
            code: 13, // INTERNAL
            message: 'Failed to create user',
        });
    }
};


export const listUsers = async (call: any, callback: any) => {
    try {
        const users = await db.user.findMany();
        logger.info(`Fetched ${users.length} users`);
        callback(null, { users });
    }
    catch (error) {
        logger.error(`Error fetching users: ${error}`);
        callback({
            code: 13, // INTERNAL
            message: 'Failed to fetch users',
        });
    }
}