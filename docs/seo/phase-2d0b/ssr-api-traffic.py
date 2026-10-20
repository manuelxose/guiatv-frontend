#!/usr/bin/env python3
"""Aggregate guiatv-api "Request completed" journal lines into SSR routing stats.

Reads `journalctl -u guiatv-api -o cat` on stdin and prints aggregates only:
no URLs, query strings, IPs or user agents are written out.

  SSR      = user agent "node" (Angular's server fetch)
  internal = TCP peer on loopback (SSR -> 127.0.0.1:4000, no nginx/Cloudflare)
  public   = anything else (arrived through nginx, i.e. Cloudflare for SSR)
  read     = GET/HEAD (routed internally since 2D-0B), write = other methods (stay public)

Usage (on the VPS):
  journalctl -u guiatv-api --since "-6h" -o cat | python3 ssr-api-traffic.py
"""
import json
import sys

LOOPBACK = {"127.0.0.1", "::1", "::ffff:127.0.0.1"}


def pct(values, p):
    if not values:
        return None
    values = sorted(values)
    return values[min(len(values) - 1, int(round(p / 100 * (len(values) - 1))))]


def bucket(status):
    if status == 404:
        return "404"
    if status == 429:
        return "429"
    if status >= 500:
        return "5xx"
    if 200 <= status < 400:
        return "ok"
    return "other4xx"


groups = {}
first = last = None
for line in sys.stdin:
    marker = line.find("Request completed ")
    if marker < 0:
        continue
    try:
        entry = json.loads(line[marker + len("Request completed "):])
    except ValueError:
        continue
    stamp = line[1:25] if line.startswith("[") else None
    first = first or stamp
    last = stamp or last
    ssr = (entry.get("userAgent") or "") == "node"
    route = "internal" if entry.get("ip") in LOOPBACK else "public"
    kind = "read" if entry.get("method") in ("GET", "HEAD") else "write"
    key = ("ssr" if ssr else "other", route, kind)
    g = groups.setdefault(key, {"n": 0, "ms": [], "status": {}})
    g["n"] += 1
    if isinstance(entry.get("durationMs"), (int, float)):
        g["ms"].append(entry["durationMs"])
    b = bucket(int(entry.get("statusCode") or 0))
    g["status"][b] = g["status"].get(b, 0) + 1

ssr_total = sum(g["n"] for (src, _, _), g in groups.items() if src == "ssr")
print(json.dumps({"window": [first, last], "ssrTotal": ssr_total, "groups": [
    {
        "source": src,
        "route": route,
        "kind": kind,
        "count": g["n"],
        "shareOfSsr": round(g["n"] / ssr_total, 4) if src == "ssr" and ssr_total else None,
        "status": g["status"],
        "backendMs": {f"p{p}": pct(g["ms"], p) for p in (50, 90, 99)},
    }
    for (src, route, kind), g in sorted(groups.items())
]}, indent=1))
