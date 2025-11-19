// v1 HTTP API removed during migration. Stubbing handlers so build succeeds.

export async function api(req: any, res: any) {
  res.status(410).json({ error: 'v1 API removed — use v2 API (see README).' });
}

export const ssr = async (req: any, res: any) => {
  res.status(410).send('SSR removed — build the main app and serve separately.');
};
