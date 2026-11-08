import json, urllib.request
body = json.dumps({"category_id":0,"tag_norm_names":["dub-techno"],"geoname_id":0,"slice":"new","cursor":"*","size":5,"include_result_types":["a","s"]}).encode()
req = urllib.request.Request("https://bandcamp.com/api/discover/1/discover_web", data=body, headers={"Content-Type":"application/json","User-Agent":"NovosDiscosBot/1.0 (+https://jorgevasco-ui.github.io/novos-discos/)"})
try:
    d = json.load(urllib.request.urlopen(req, timeout=20))
    print("OUT keys", list(d.keys()))
    r = d.get("results", [])
    print("OUT n", len(r))
    print("OUT", json.dumps(r[:2])[:3000])
except Exception as e:
    print("OUT ERR", e, getattr(e, "read", lambda: b"")()[:500])
