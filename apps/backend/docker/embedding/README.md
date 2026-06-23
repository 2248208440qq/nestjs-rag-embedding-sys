# Qwen3 Embedding Service

This image runs `Qwen/Qwen3-Embedding-0.6B` with vLLM as an OpenAI-compatible
embedding API.

The service is started by the root compose stack:

```bash
docker compose up -d embedding
```

Follow logs:

```bash
docker compose logs -f embedding
```

Embedding API:

```bash
curl http://localhost:8000/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-embedding",
    "input": "hello"
  }'
```

Environment variables:

| Name | Description |
| --- | --- |
| `HF_TOKEN` | Optional Hugging Face token for higher rate limits or private models. |
| `HF_HUB_DISABLE_XET` | Disabled in compose to avoid Xet download issues. |
