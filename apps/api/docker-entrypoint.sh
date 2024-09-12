#!/bin/sh
set -e

export DATABASE_URL="postgresql://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}"

# using this in production will degrade performance
# set NODE_ARG_ENABLE_SOURCE_MAPS env var to enable source maps support
NODE_FLAGS=${NODE_ARG_ENABLE_SOURCE_MAPS:+--enable-source-maps}

case $1 in
  "server")
    node $NODE_FLAGS /usr/src/app/server
    ;;

  "migrate")
    echo "Running database migrations"
    npx prisma migrate deploy
    ;;

  *)
    eval "$@"
    ;;
esac
