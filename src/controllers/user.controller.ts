// src/controllers/user.ts
import { FastifyReply, FastifyRequest } from "fastify";
import { grpcClient } from "../grpc/client";
import jwt from "jsonwebtoken";
import db from "../configs/db";
import bcrypt from "bcryptjs";
import { Config } from "../configs/config";
import { CreateUserSchema } from "../schemas/user.schema";


export const createUser = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const parsed = CreateUserSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error });
    }

    const { username, password } = parsed.data;

    const user = await new Promise<any>((resolve, reject) => {
      grpcClient.CreateUser({ username, password }, (error: any, response: any) => {
        if (error) reject(error);
        else resolve(response);
      });
    });

    reply.status(201).send(user);
  } catch (error) {
    console.error("Error creating user:", error);
    reply.status(500).send({
      error: "Internal Server Error",
      message: "Failed to create user",
    });
  }
};

export const listUsers = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const users = await new Promise<any>((resolve, reject) => {
      grpcClient.ListUsers({}, (error: any, response: any) => {
        if (error) reject(error);
        else resolve(response.users);
      });
    });

    reply.status(200).send({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    reply.status(500).send({
      error: "Internal Server Error",
      message: "Failed to fetch users",
    });
  }
};

export const login = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const parsed = CreateUserSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }

    const { username, password } = parsed.data;

    const user = await db.user.findFirst({
      where: { username },
    });

    if (!user) {
      return reply.status(404).send({
        error: "Not Found",
        message: "User not found",
      });
    }

    const isPasswordValid =
      user.password && bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Invalid username or password",
      });
    }

    const token = jwt.sign({ id: user.id }, Config.JWT_SECRET || "", {
      expiresIn: "1h",
    });

    return reply.status(200).send({
      id: user.id,
      username: user.username,
      token,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return reply.status(500).send({
      error: "Internal Server Error",
      message: "Failed to login",
    });
  }
};
