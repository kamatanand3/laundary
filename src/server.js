// server.js
import { env } from "./config/env.js";   // loads PORT, DB config, etc.
import app from "./app.js";
import { assertDbConnection } from "./config/db.js";

(async () => {
  await assertDbConnection(); // check DB before starting server

  const PORT = env.port || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 API running at http://127.0.0.1:${PORT}`);
  });
})();
