import dotenv from 'dotenv';
dotenv.config();


export const Config = {
    JWT_SECRET: process.env.JWT_SECRET,
    BROKER_PORT: process.env.BROKER_PORT,
}