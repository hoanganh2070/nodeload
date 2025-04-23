import { FastifyInstance } from "fastify";
import { createUser, listUsers, login } from "../controllers/user.controller";

export function userRouter(app: FastifyInstance) {

    app.post("/user", {
        schema: {
            body: {
                type: "object",
                properties: {
                    username: { type: "string" },
                    password: { type: "string" },
                },
                required: ["username", "password"],
            },
        },
    }, createUser);

    app.get("/user", listUsers);
    app.post("/user/login", login)

}