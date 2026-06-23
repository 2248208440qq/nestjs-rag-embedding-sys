FROM vllm/vllm-openai:v0.23.0

# Qwen3-Embedding-0.6B is downloaded from Hugging Face on first startup and
# cached in the mounted hf_cache volume.
ENV MODEL_NAME=Qwen/Qwen3-Embedding-0.6B

EXPOSE 8000

# vLLM 0.23 uses --runner pooling for embedding/rerank/classify models.
ENTRYPOINT ["vllm", "serve", "Qwen/Qwen3-Embedding-0.6B", \
    "--host", "0.0.0.0", \
    "--port", "8000", \
    "--runner", "pooling", \
    "--served-model-name", "qwen3-embedding", \
    "--trust-remote-code", \
    "--max-model-len", "8192", \
    "--gpu-memory-utilization", "0.75", \
    "--dtype", "half"]
