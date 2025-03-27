//https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/batch-prediction-gemini#generative-ai-batch-text-nodejs

// Import the aiplatform library
import  aiplatformLib  from '@google-cloud/aiplatform';


const aiplatform = aiplatformLib.protos.google.cloud.aiplatform.v1;
//const aiplatform = aiplatformLib.protos.google.cloud.aiplatform.v1beta1;



/**
 * TODO(developer):  Uncomment/update these variables before running the sample.
 */
const projectId = '161981358334';
// URI of the output folder in Google Cloud Storage.
// E.g. "gs://[BUCKET]/[OUTPUT]"
const outputUri = 'gs://translate-botanical-descriptions/test';

// URI of the input file in Google Cloud Storage.
// E.g. "gs://[BUCKET]/[DATASET].jsonl"
// Or try:
// "gs://cloud-samples-data/generative-ai/batch/gemini_multimodal_batch_predict.jsonl"
// for a batch prediction that uses audio, video, and an image.
const inputUri =
  'gs://cloud-samples-data/generative-ai/batch/batch_requests_for_multimodal_input.jsonl';
const location = 'us-central1';
const parent = `projects/${projectId}/locations/${location}`;
const modelName = `${parent}/publishers/google/models/gemini-1.5-flash-002`;

// Specify the location of the api endpoint.
const clientOptions = {
  apiEndpoint: `${location}-aiplatform.googleapis.com`,
};

// Instantiate the client.
const jobServiceClient = new aiplatform.JobServiceClient(clientOptions);

// Create a Gemini batch prediction job using Google Cloud Storage input and output buckets.
async function create_batch_prediction_gemini_gcs() {
  const gcsSource = new aiplatform.GcsSource({
    uris: [inputUri],
  });

  const inputConfig = new aiplatform.BatchPredictionJob.InputConfig({
    gcsSource: gcsSource,
    instancesFormat: 'jsonl',
  });

  const gcsDestination = new aiplatform.GcsDestination({
    outputUriPrefix: outputUri,
  });

  const outputConfig = new aiplatform.BatchPredictionJob.OutputConfig({
    gcsDestination: gcsDestination,
    predictionsFormat: 'jsonl',
  });

  const batchPredictionJob = new aiplatform.BatchPredictionJob({
    displayName: 'Batch predict with Gemini - GCS',
    model: modelName,
    inputConfig: inputConfig,
    outputConfig: outputConfig,
  });

  const request = {
    parent: parent,
    batchPredictionJob,
  };

  // Create batch prediction job request
  const [response] = await jobServiceClient.createBatchPredictionJob(request);
  console.log('Response name: ', response.name);
  // Example response:
  // Response name: projects/<project>/locations/us-central1/batchPredictionJobs/<job-id>
}

(async () => {
  await create_batch_prediction_gemini_gcs();
})();