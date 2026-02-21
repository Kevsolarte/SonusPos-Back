import { authService } from "./src/modules/Auth/auth.service.js";
import "dotenv/config";

async function test() {
    try {
        console.log("Testing login...");
        const result = await authService.login({
            email: "ksolarte14@gmail.com",
            password: "Kevinsolarte1."
        });
        console.log("Login success:", result);
    } catch (e) {
        console.error("Login failed:", e);
    }
}

test();
