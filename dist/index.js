import { app } from "./app.js";
import { env } from "./config/env.config.js";
import { prisma } from "./config/db.config.js";
const server = app.listen(env.PORT, () => {
    console.log(`🚀 Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});
/**
 * Graceful Shutdown logic
 * Prevents connection leaks and data corruption by closing all resources correctly before exit.
 */
const shutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
        console.log("HTTP server closed.");
        await prisma.$disconnect();
        console.log("Prisma disconnected.");
        process.exit(0);
    });
    // Force shutdown if cleanup takes too long
    setTimeout(() => {
        console.error("Shutdown timed out, forcefully exiting.");
        process.exit(1);
    }, 10000);
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
//# sourceMappingURL=index.js.map