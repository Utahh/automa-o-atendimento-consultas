import { createServer, type Server } from 'node:http';

/**
 * O worker e um processo Node comum, nao uma funcao serverless. Por isso ele
 * tem a propria sonda: e assim que o orquestrador sabe que ele esta vivo.
 */
export function iniciarHeartbeat(porta: number): Server {
  const servidor = createServer((req, res) => {
    if (req.url === '/healthz') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, runtime: 'worker', em: new Date().toISOString() }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  servidor.listen(porta);
  return servidor;
}
