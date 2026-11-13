UA="Mozilla/5.0 (Linux; Android 14) Chrome/126 Mobile"
for u in https://prices.lbma.org.uk/json/gold_pm.json https://prices.lbma.org.uk/json/silver.json; do
  echo "== $u"
  curl -sS -m 60 -A "$UA" -o /tmp/l.json -w "%{http_code} %{size_download}\n" "$u"
  python3 -c "
import json;d=json.load(open('/tmp/l.json'));print(len(d), d[0], d[-1])
x=[r for r in d if r['d'].startswith('1980-01')][:3];print(x)"
done
