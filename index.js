// App uses OpenCensus which is an open source project from code that Google
// open sourced. In the Stackdriver docs, it's mentioned as a way to help with
// custom metrics.
//
// It buffers metrics in memory for 60 seconds and then does an API call to the
// Stackdriver API for you. That way, you don't go over the API call limit. The
// limit is one per minute per timeseries (which is a combination of labels) so
// that's why it ends up working fine, as long as each timeseries you create
// has a different combination of label values. Ex. use k8s pod name, now it's
// a unique combination.
//
// You hook up "exporters" to it to get the metric data points into different
// systems. In this case, I'm using a Stackdriver exporter so it sends them
// using the Stackdriver API. They will all show up as "global" resource in
// Stackdriver Metrics.

const {
    globalStats,
    MeasureUnit,
    AggregationType,
    TagMap,
} = require('@opencensus/core');
const {
    StackdriverStatsExporter
} = require('@opencensus/exporter-stackdriver');

const express = require('express');
const app = express();

const port = +process.env['PORT'];

// My OpenCensus "measure". In Stackdriver, this maps to "metric".
const REQUEST_SERVER_TIME_MS = globalStats.createMeasureInt64(
    'request_server_time',
    MeasureUnit.MS,
    'The time it took to send a response'
);

// The key for the tag I want to use. Must use this object again below.
const tagKey = {
    name: 'pod_name',
};

// My OpenCensus "view". This maps to Stackdriver "timeseries". Note the tags
// which are mapped to Stackdriver "labels".
const view = globalStats.createView(
    'request_server_time_distribution',
    REQUEST_SERVER_TIME_MS,
    AggregationType.DISTRIBUTION,
    [tagKey],
    'The distribution of the request server times.',
    // Latency in buckets:
    // [>=0ms, >=100ms, >=200ms, >=400ms, >=1s, >=2s, >=4s]
    [0, 100, 200, 400, 1000, 2000, 4000]
);

globalStats.registerView(view);

// Needed for OpenCensus Stackdriver exporter.
const projectId = process.env.GOOGLE_PROJECT_ID;

if (!projectId || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw Error('Unable to proceed without a Project ID or keyfile.');
  }

const exporter = new StackdriverStatsExporter({
    projectId: projectId,
    logger: console,
});

globalStats.registerExporter(exporter);

const randomMs = () => {
    return Math.random() * 5000 + 1 + 500;
}

app.get('/apples', (req, res) => {
    // Randomly generate a server processing time.
    const delay = Math.floor(randomMs());
    console.info(`Delay: ${delay}`);

    // My OpenCensus "tags". These map to Stackdriver "labels".
    const tags = new TagMap();
    tags.set(tagKey, { value: process.env['POD_NAME'] });
    globalStats.record([
        {
            measure: REQUEST_SERVER_TIME_MS,
            value: delay,
        },
    ], tags);

    res.send('apples');
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))