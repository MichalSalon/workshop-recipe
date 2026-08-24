# workshop-logs

<!-- #ZEROPS_EXTRACT_START:intro# -->
Self-hosted ELK plus a public, authenticated `logquery` API. Import this
project weeks before the workshop and load-test it. `workshop-dev` and
`workshop-prod` forward their project logs here; the agent queries by
service hostname over HTTPS, not over a private hostname.
<!-- #ZEROPS_EXTRACT_END:intro# -->

## After import

1. Copy `LOG_QUERY_TOKEN` and the `logquery` subdomain URL.
2. Point Zerops [log forwarding](https://docs.zerops.io/observability/log-forwarding)
   on `workshop-dev` and `workshop-prod` at the public Logstash intake.
3. Confirm:

```bash
curl -sS -H "Authorization: Bearer $LOG_QUERY_TOKEN" \
  "$LOG_QUERY_URL/logs?hostname=logquery&limit=5"
```

4. Put the same URL + token on the `zcp` service in `workshop-dev`.
