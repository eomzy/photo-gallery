import { migrate } from './db/migrate.js';
import { app } from './app.js';

migrate();

// Render/Railway/etc assign the port via PORT at deploy time; local dev
// clears it (see dev.cmd) so this falls back to 3001 without colliding
// with the client dev server.
const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`Photo gallery API listening on http://localhost:${PORT}`);
});
