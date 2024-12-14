FROM denoland/deno

WORKDIR /app

USER deno

COPY [ "deno.json", "deno.lock", "/app/"]

RUN deno install

ADD * .

RUN deno cache main.ts

CMD [ "run", "--allow-read", "--allow-net", "--allow-env", "main.ts" ]