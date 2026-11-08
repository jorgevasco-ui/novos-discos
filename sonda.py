import json, urllib.request
UA = "NovosDiscosBot/1.0 (+https://jorgevasco-ui.github.io/novos-discos/)"
for body in [
    {"category_id":0,"tag_norm_names":["dub-techno"],"geoname_id":0,"slice":"new","cursor":"*","size":5,"include_result_types":["a","s"]},
    {"tag_norm_names":["dub-techno"],"slice":"new","size":5},
]:
    req = urllib.request.Request("https://bandcamp.com/api/discover/1/discover_web", data=json.dumps(body).encode(), headers={"Content-Type":"application/json","User-Agent":UA})
    try:
        res = urllib.request.urlopen(req, timeout=20)
        raw = res.read()
        print("OUT", res.status, res.headers.get("content-type"), len(raw), raw[:1500])
    except Exception as e:
        print("OUT ERR", e, getattr(e, "read", lambda: b"")()[:600])
