import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

from app.core.config import settings
from app.models import Base

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# configparser applies %-interpolation to values set here, so a literal "%"
# in the URL (e.g. a password with a URL-encoded character) must be escaped
# as "%%" or set_main_option raises "invalid interpolation syntax".
config.set_main_option("sqlalchemy.url", settings.database_url.replace("%", "%%"))

target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """In this scenario we need to create an Engine
    and associate a connection with the context.

    """

    # Alembic builds its own engine, so it does not inherit the
    # statement_cache_size=0 that app/db/session.py sets. Without it a
    # migration run against Supabase's transaction-mode pooler can fail with
    # DuplicatePreparedStatementError when two connections land on the same
    # backend - intermittently, which is worse than always: it passed by luck
    # when run by hand and then failed inside the container.
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args={"statement_cache_size": 0},
    )

    async with connectable.connect() as connection:
        # One migrator at a time, cluster-wide. Every container applies
        # migrations at boot (see start.sh), which was fine when there was
        # one container: with autoscaling, a scale-out event starts several
        # at once and they would run the same DDL concurrently - lock
        # contention at best, a half-applied revision and a crash-looping
        # instance at worst. A session-level advisory lock serialises them;
        # whoever gets it migrates, the rest wait and then find there is
        # nothing left to do. The key is an arbitrary constant - it just has
        # to be the same in every container.
        await connection.exec_driver_sql("SELECT pg_advisory_lock(8374652910)")
        try:
            await connection.run_sync(do_run_migrations)
        finally:
            await connection.exec_driver_sql("SELECT pg_advisory_unlock(8374652910)")

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""

    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
