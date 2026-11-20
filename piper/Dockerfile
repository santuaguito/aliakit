FROM python:3.12-slim

RUN python -m pip install --no-cache-dir 'piper-tts[http]'

EXPOSE 5000
VOLUME ["/data"]

CMD ["sh", "-c", "python -m piper.download_voices --download-dir /data en_GB-alba-medium es_AR-daniela-high && python -m piper.http_server --host 0.0.0.0 --port 5000 --data-dir /data -m en_GB-alba-medium"]
