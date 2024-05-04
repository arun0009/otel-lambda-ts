# Lambda Tracing with OpenTelemetry

This project demos how to trace your lambda function with opentelemetry using lambda layer (`lambda-wrapper.ts`). 

Its a simple lambda function which writes an `item` to dynamo db.

You can invoke this lambda locally with AWS SAM CLI. We are using docker for localstack (DynamoDB), OTEL Collector
and Jaeger for viewing traces.

Commands to run docker, build typescript and invoke Lambda.

```
docker-compose up --build --force-recreate

npm run build

sam local start-api --docker-network otel-network

```

Click on the link in console after running sam local start-api command to invoke the lambda function locally.

Traces should show up in Jaeger UI locally at http://localhost:16686/