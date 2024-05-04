import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { AwsInstrumentation } from "@opentelemetry/instrumentation-aws-sdk";
import {
  BatchSpanProcessor,
  SimpleSpanProcessor,
  ConsoleSpanExporter,
} from "@opentelemetry/sdk-trace-base";
import { AwsLambdaInstrumentation } from "@opentelemetry/instrumentation-aws-lambda";
import { getEnv } from "@opentelemetry/core";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { awsLambdaDetector } from "@opentelemetry/resource-detector-aws";
import {
  detectResourcesSync,
  envDetector,
  processDetector,
} from "@opentelemetry/resources";
import {
  NodeTracerConfig,
  NodeTracerProvider,
} from "@opentelemetry/sdk-trace-node";
import {
  MeterProvider,
  MeterProviderOptions,
} from "@opentelemetry/sdk-metrics";

//Ref: https://raw.githubusercontent.com/open-telemetry/opentelemetry-lambda/main/nodejs/packages/layer/src/wrapper.ts

console.log("Registering OpenTelemetry SDK");

declare global {
  const spanProcessor: BatchSpanProcessor;
} 

const instrumentations = [
  new AwsLambdaInstrumentation({
    disableAwsContextPropagation: false,
  }),  
  new AwsInstrumentation({
    suppressInternalInstrumentation: true,
    sqsExtractContextPropagationFromPayload: true,
  }),
];

// configure lambda logging
const logLevel = getEnv().OTEL_LOG_LEVEL;
diag.setLogger(new DiagConsoleLogger(), logLevel);

// Register instrumentations synchronously to ensure code is patched even before provider is ready.
registerInstrumentations({
  instrumentations,
});

async function initializeProvider() {
  const resource = detectResourcesSync({
    detectors: [awsLambdaDetector, envDetector, processDetector],
  });

  const config: NodeTracerConfig = {
    resource,
  };

  const tracerProvider = new NodeTracerProvider(config);

  // global spanProcessor as we need to access it in the handler (update sam cli to use start-api instead of invoke)
  (global as any).spanProcessor = new BatchSpanProcessor(
    new OTLPTraceExporter()
  );

  tracerProvider.addSpanProcessor(spanProcessor);

  // logging for debug
  if (logLevel === DiagLogLevel.DEBUG) {
    tracerProvider.addSpanProcessor(
      new SimpleSpanProcessor(new ConsoleSpanExporter())
    );
  }

  let meterConfig: MeterProviderOptions = {
    resource,
  };

  const meterProvider = new MeterProvider(meterConfig);

  // Re-register instrumentation with initialized provider. Patched code will see the update.
  registerInstrumentations({
    instrumentations,
    tracerProvider,
    meterProvider,
  });
}

initializeProvider();