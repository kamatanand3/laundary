// server.js
import { env } from "./config/env.js";   // loads PORT, DB config, etc.
import app from "./app.js";
import { assertDbConnection } from "./config/db.js";

(async () => {
  await assertDbConnection(); // check DB before starting server

  const PORT = env.port || 4000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 API running at http://0.0.0.0:${PORT}`);
  });
})();
