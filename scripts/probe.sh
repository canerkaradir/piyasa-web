UA="Mozilla/5.0 (Linux; Android 14) Chrome/126 Mobile"
for u in "https://stooq.com/q/d/l/?s=xauusd&i=d" "https://stooq.com/q/d/l/?s=xagusd&i=d" "https://raw.githubusercontent.com/datasets/gold-prices/main/data/monthly.csv" "https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?period1=0&period2=9999999999&interval=1d"; do
  echo "== $u"
  curl -sS -m 60 -A "$UA" -o /tmp/l.txt -w "%{http_code} %{size_download}\n" "$u"
  head -c 300 /tmp/l.txt; echo; grep -m3 "^1980-01" /tmp/l.txt; tail -2 /tmp/l.txt | head -c 200; echo
done
