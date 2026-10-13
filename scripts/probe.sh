B="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"
C='["name","close","price_target_average","price_target_high","price_target_low","price_target_median","earnings_per_share_basic_ttm","earnings_per_share_diluted_ttm","earnings_per_share_forecast_next_fy","earnings_per_share_fy","book_value_per_share_fq","price_book_fq","total_shares_outstanding_fundamental","market_cap_basic","free_cash_flow_ttm","net_debt","total_revenue_yoy_growth_ttm","recommendation_mark","recommendation_total","recommendation_buy","recommendation_hold","recommendation_sell","price_earnings_forward_fy","non_gaap_price_to_earnings_per_share_forecast_next_fy","price_earnings_ttm","sector","dividends_per_share_fq","dps_common_stock_prim_issue_fy"]'
for m in "turkey THYAO" "turkey AKBNK" "turkey BIMAS" "america AAPL" "america IONQ" "america KO"; do set -- $m
echo "== $2"
curl -sS -A "$B" -m 20 -X POST "https://scanner.tradingview.com/$1/scan" -d "{\"filter\":[{\"left\":\"name\",\"operation\":\"equal\",\"right\":\"$2\"}],\"columns\":$C,\"range\":[0,1]}" | head -c 3000; echo
done
echo $C
