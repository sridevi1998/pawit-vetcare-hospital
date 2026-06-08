#!/usr/bin/env bash
set -euo pipefail

command="${1:-status}"
shift || true

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
image="${LIQUIBASE_IMAGE:-liquibase/liquibase:4.31.1}"
url="${LIQUIBASE_COMMAND_URL:-jdbc:postgresql://host.docker.internal:5432/pawit_vetcare}"
username="${LIQUIBASE_COMMAND_USERNAME:-pawit}"
password="${LIQUIBASE_COMMAND_PASSWORD:-pawit}"

docker run --rm \
  -v "${repo_root}/db/liquibase:/liquibase/project:ro" \
  -w /liquibase/project \
  "${image}" \
  --defaults-file=/liquibase/project/liquibase.properties \
  --url="${url}" \
  --username="${username}" \
  --password="${password}" \
  "${command}" "$@"
