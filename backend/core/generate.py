from snowflake import SnowflakeGenerator

generator = SnowflakeGenerator(1)

def generate_snowflake_id():
    return next(generator)