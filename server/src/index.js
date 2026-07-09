import { migrate } from './db/migrate.js';
import { app } from './app.js';

migrate();

// Hardcoded (not process.env.PORT): the dev harness exports its own PORT
// env var for the client dev server, which would otherwise collide here.
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Photo gallery API listening on http://localhost:${PORT}`);
});
