FROM postgres:9.5

ENV POSTGRES_USER franco
ENV POSTGRES_PASSWORD franco
ENV POSTGRES_DB general


LABEL gabfranck <francogabrielpy@outlook.com>

RUN apt-get update

RUN apt-get install sudo

ADD bkp_filial_dev_25_10_22__v2_schema_only.sql /docker-entrypoint-initdb.d/

# docker run --name server-test -p 5555:5556 --restart=always -d frc-test


