"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var exporter_trace_otlp_grpc_1 = require("@opentelemetry/exporter-trace-otlp-grpc");
var instrumentation_aws_sdk_1 = require("@opentelemetry/instrumentation-aws-sdk");
var sdk_trace_base_1 = require("@opentelemetry/sdk-trace-base");
var instrumentation_aws_lambda_1 = require("@opentelemetry/instrumentation-aws-lambda");
var core_1 = require("@opentelemetry/core");
var api_1 = require("@opentelemetry/api");
var instrumentation_1 = require("@opentelemetry/instrumentation");
var resource_detector_aws_1 = require("@opentelemetry/resource-detector-aws");
var resources_1 = require("@opentelemetry/resources");
var sdk_trace_node_1 = require("@opentelemetry/sdk-trace-node");
var sdk_metrics_1 = require("@opentelemetry/sdk-metrics");
//Ref: https://raw.githubusercontent.com/open-telemetry/opentelemetry-lambda/main/nodejs/packages/layer/src/wrapper.ts
console.log("Registering OpenTelemetry SDK");
var instrumentations = [
    new instrumentation_aws_lambda_1.AwsLambdaInstrumentation({
        disableAwsContextPropagation: false,
    }),
    new instrumentation_aws_sdk_1.AwsInstrumentation({
        suppressInternalInstrumentation: true,
        sqsExtractContextPropagationFromPayload: true,
    }),
];
// configure lambda logging
var logLevel = (0, core_1.getEnv)().OTEL_LOG_LEVEL;
api_1.diag.setLogger(new api_1.DiagConsoleLogger(), logLevel);
// Register instrumentations synchronously to ensure code is patched even before provider is ready.
(0, instrumentation_1.registerInstrumentations)({
    instrumentations: instrumentations,
});
function initializeProvider() {
    return __awaiter(this, void 0, void 0, function () {
        var resource, config, tracerProvider, meterConfig, meterProvider;
        return __generator(this, function (_a) {
            resource = (0, resources_1.detectResourcesSync)({
                detectors: [resource_detector_aws_1.awsLambdaDetector, resources_1.envDetector, resources_1.processDetector],
            });
            config = {
                resource: resource,
            };
            tracerProvider = new sdk_trace_node_1.NodeTracerProvider(config);
            // global spanProcessor as we need to access it in the handler (update sam cli to use start-api instead of invoke)
            global.spanProcessor = new sdk_trace_base_1.BatchSpanProcessor(new exporter_trace_otlp_grpc_1.OTLPTraceExporter());
            tracerProvider.addSpanProcessor(spanProcessor);
            // logging for debug
            if (logLevel === api_1.DiagLogLevel.DEBUG) {
                tracerProvider.addSpanProcessor(new sdk_trace_base_1.SimpleSpanProcessor(new sdk_trace_base_1.ConsoleSpanExporter()));
            }
            meterConfig = {
                resource: resource,
            };
            meterProvider = new sdk_metrics_1.MeterProvider(meterConfig);
            // Re-register instrumentation with initialized provider. Patched code will see the update.
            (0, instrumentation_1.registerInstrumentations)({
                instrumentations: instrumentations,
                tracerProvider: tracerProvider,
                meterProvider: meterProvider,
            });
            return [2 /*return*/];
        });
    });
}
initializeProvider();
