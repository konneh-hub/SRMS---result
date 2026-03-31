#!/bin/sh
# wait-for-postgres.sh: wait for PostgreSQL service to become available

set -e

hostport="$1"
shift

if [ -z "$hostport" ]; then
  echo "Usage: $0 host:port [-- command args]"
  exit 1
fi

host=$(echo "$hostport" | cut -d ':' -f 1)
port=$(echo "$hostport" | cut -d ':' -f 2)

echo "Waiting for PostgreSQL at $host:$port..."

while ! nc -z "$host" "$port"; do
  sleep 1
done

echo "PostgreSQL is available, executing command..."

if [ "$1" = "--" ]; then
  shift
fi

exec "$@"