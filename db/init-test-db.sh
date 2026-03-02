#!/bin/bash

# Creating an test database for e2e tests.
echo "Creating test database..."

set -e

psql -v ON_ERROR_STOP=1 --username "$DB_USERNAME" <<-EOSQL
	CREATE DATABASE $TEST_DB_NAME;
EOSQL