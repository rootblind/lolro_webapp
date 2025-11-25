import axios from "axios";
import { config } from "dotenv";
import { get_env_var } from "../utility_modules/utility_methods.js";
config();

const HOST = get_env_var("HOST");
const BOT_PORT = Number(get_env_var("BOT_PORT"));

const BASE_URL = get_env_var("NODE_ENV") === "development" ?
    `${HOST}:${BOT_PORT}/bot` : "/bot"

const botapi = axios.create({
    baseURL: BASE_URL,
    headers: {
        "lolro-api-key": get_env_var("CLIENT_SECRET")
    }
});

export default botapi;