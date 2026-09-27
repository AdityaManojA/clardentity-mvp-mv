#!/bin/sh
set -e

# Migrations run here as well as in Render's preDeployCommand. That field was
# inert on the free plan - accepted, stored, silently never executed - which
# is why this line exists: every migration had to be applied at boot, and the
# one time it was not, the app went live against an older schema and 500'd on
# every write to the new column. It runs for real on the current plan, so
# this is now the second of two; keeping it costs a no-op and keeps the
# guarantee. Failing the boot is the right outcome if it cannot complete:
# serving traffic against a schema the code does not match is worse than not
# serving.
# Safe to run in every container, including several starting at once during
# a scale-out: alembic/env.py takes a Postgres advisory lock, so they queue
# and all but the first find nothing to do.
echo "==> Applying database migrations"
alembic upgrade head

# The Celery consumer runs alongside uvicorn in the same container instead of
# as its own Render service. If it crashes, uvicorn (the process the
# container's lifecycle is tied to) keeps serving HTTP traffic; only
# background task processing is lost until the next deploy/restart.
#
# Under autoscaling this means one worker per instance, all consuming the
# same queue. That is a valid Celery topology - the jobs here are idempotent
# and independent - but it multiplies Redis chatter by the instance count,
# and a dedicated worker service would be the tidier shape now that the plan
# allows one.
#
# --concurrency=1 is load-bearing, not a default worth tuning up. Celery's
# prefork pool defaults to one child per CPU, which on this host meant 8
# children + parent + uvicorn in a 512 MB container - the deploy was OOM-killed
# (exit 137) the moment the worker actually started successfully. The workload
# here is a trickle of document ingestions and memory rebuilds, so a single
# child is ample.
#
# gossip/mingle/heartbeat only coordinate a multi-worker cluster; with one
# worker they buy nothing and add Redis chatter. max-tasks-per-child recycles
# the child periodically so a slow leak can't accumulate.
celery -A app.core.celery_app worker \
  --loglevel=info \
  --concurrency=1 \
  --max-tasks-per-child=100 \
  --without-gossip --without-mingle --without-heartbeat &

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
