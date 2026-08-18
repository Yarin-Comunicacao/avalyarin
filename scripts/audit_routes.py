from pathlib import Path
import re
from collections import defaultdict

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "client/src/App.tsx"
SRC = ROOT / "client/src"

app = APP.read_text(encoding="utf-8")
route_patterns = []
for match in re.finditer(r'<Route\s+path=(?:"([^"]+)"|\{\s*"([^"]+)"\s*\})', app):
    route_patterns.append(next(group for group in match.groups() if group is not None))

# Destinations explicitly present in JSX/TS code. Dynamic template expressions are
# retained with their static prefix so we can inspect them separately.
patterns = [
    (r'href\s*=\s*["\']([^"\']+)["\']', "href"),
    (r'navigate\(\s*["\']([^"\']+)["\']', "navigate"),
    (r'window\.location\.(?:href|assign|replace)\(\s*["\']([^"\']+)["\']', "window"),
    (r'window\.location\.(?:href|pathname)\s*=\s*["\']([^"\']+)["\']', "window"),
    (r'<Redirect\s+to=["\']([^"\']+)["\']', "redirect"),
]

def normalize(path: str):
    if not path.startswith("/") or path.startswith("//"):
        return None
    path = path.split("?")[0].split("#")[0]
    return path if path else "/"

def matches(path: str, route: str):
    if route == path:
        return True
    # Convert wouter route params into one path segment and support wildcard-like
    # prefix routes used by this project.
    regex = re.sub(r':[A-Za-z0-9_]+', r'[^/]+', route)
    regex = '^' + regex.rstrip('/') + '/?$'
    return re.match(regex, path) is not None

route_report = []
for path in sorted(set(route_patterns)):
    route_report.append(path)

links = defaultdict(list)
for file in SRC.rglob("*.tsx"):
    text = file.read_text(encoding="utf-8", errors="ignore")
    rel = file.relative_to(ROOT).as_posix()
    for pattern, kind in patterns:
        for match in re.finditer(pattern, text):
            value = normalize(match.group(1))
            if value:
                links[value].append((rel, kind))

broken = {}
for path, refs in links.items():
    if not any(matches(path, route) for route in route_patterns):
        broken[path] = refs

print("ROUTES", len(route_patterns))
print("INTERNAL_DESTINATIONS", len(links))
print("POSSIBLE_UNMATCHED", len(broken))
for path, refs in sorted(broken.items()):
    print(f"BROKEN? {path}")
    for rel, kind in refs[:8]:
        print(f"  {kind}: {rel}")

# Write a machine-readable report for later synthesis.
report = ROOT / "route_audit_report.txt"
with report.open("w", encoding="utf-8") as out:
    out.write("Rotas declaradas:\n")
    out.write("\n".join(route_report))
    out.write("\n\nPossíveis destinos sem rota:\n")
    for path, refs in sorted(broken.items()):
        out.write(path + "\n")
        for rel, kind in refs:
            out.write(f"  {kind}: {rel}\n")
print("REPORT", report)
