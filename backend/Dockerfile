FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x /app/toolbox

CMD ["sh", "-c", "./toolbox --config tools.yaml --allowed-hosts=localhost,127.0.0.1 > /tmp/toolbox.log 2>&1 & exec gunicorn --bind 0.0.0.0:${PORT} --workers 1 --threads 4 --timeout 900 app:app"]
