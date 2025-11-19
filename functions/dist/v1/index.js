"use strict";
// v1 HTTP API removed during migration. Stubbing handlers so build succeeds.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ssr = void 0;
exports.api = api;
async function api(req, res) {
    res.status(410).json({ error: 'v1 API removed — use v2 API (see README).' });
}
const ssr = async (req, res) => {
    res.status(410).send('SSR removed — build the main app and serve separately.');
};
exports.ssr = ssr;
//# sourceMappingURL=index.js.map