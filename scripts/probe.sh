B="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"
for u in http://openinsider.com/latest-insider-purchases-25k https://openinsider.com/ http://www.openinsider.com/ https://www.secform4.com/insider-buying.htm "https://api.nasdaq.com/api/company/NVDA/insider-trades?limit=5&type=all" "http://openinsider.com/screener?s=&o=&pl=&ph=&ll=&lh=&fd=730&fdr=&td=0&tdr=&fdlyl=&fdlyh=&daysago=&xp=1&vl=25&vh=&ocl=&och=&sic1=-1&sicl=100&sich=9999&grp=0&nfl=&nfh=&nil=&nih=&nol=&noh=&v2l=&v2h=&oc2l=&oc2h=&sortcol=0&cnt=100&page=1"; do
  echo "== $u"; curl -4 -sS -A "$B" -m 25 -o /tmp/x -w "%{http_code} %{size_download}\n" "$u"; head -c 200 /tmp/x | tr '\n' ' '; echo
done
getent ahosts openinsider.com | head -3
