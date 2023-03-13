FROM postgres:9.5

ENV POSTGRES_USER franco
ENV POSTGRES_PASSWORD franco
ENV POSTGRES_DB general


LABEL gabfranck <francogabrielpy@outlook.com>

VOLUME [ "/Users/gabfranck/workspace/franco-systems/bd/docker-volume-central" ]

RUN apt-get update

RUN apt-get install sudo

ADD general_master_v1.sql /docker-entrypoint-initdb.d/

