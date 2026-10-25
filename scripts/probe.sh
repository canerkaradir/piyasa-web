H=(-H "Referer: https://edition.cnn.com/" -H "Origin: https://edition.cnn.com" -H "Accept: application/json" -A "Mozilla/5.0 (Linux; Android 14) Chrome/126 Mobile")
for d in "" "/2024-10-01" "/2023-01-01"; do
  curl -sS -m 30 "${H[@]}" "https://production.dataviz.cnn.io/index/fearandgreed/graphdata$d" > /tmp/c.json
  python3 -c "
import json;j=json.load(open('/tmp/c.json'));h=j['fear_and_greed_historical']['data'];print('$d',len(h),h[0]['x'],h[-1]['x'], list(j.keys())[:12])"
done
curl -sS -m 30 "https://api.alternative.me/fng/?limit=0" | python3 -c "import json,sys;d=json.load(sys.stdin)['data'];print('crypto',len(d),d[-1]['timestamp'])"
