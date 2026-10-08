CREATE TABLE IF NOT EXISTS pendientes (
  id      TEXT PRIMARY KEY,
  clave   TEXT NOT NULL,
  importe REAL NOT NULL,
  nota    TEXT NOT NULL DEFAULT '',
  ts      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS pendientes_clave ON pendientes (clave, ts);
