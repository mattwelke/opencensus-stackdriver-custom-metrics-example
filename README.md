# example-opencensus-stackdriver-custom-metrics

App uses OpenCensus which is an open source project from code that Google open sourced. In the Stackdriver docs, it's mentioned as a way to help with custom metrics. You hook up "exporters" to it to get the metric data points into different systems. In this case, I'm using a Stackdriver exporter so it sends them using the Stackdriver API. They will all show up as "global" resource in Stackdriver Metrics.

It buffers metrics in memory for 60 seconds and then does an API call to the Stackdriver API for you. That way, you don't go over the API call limit. The limit is one per minute per timeseries (which is a combination of labels) so that's why it ends up working fine, as long as each timeseries you create has a different combination of label values. Ex. use k8s pod name, now it's a unique combination.

## env vars

* PORT
* GOOGLE_PROJECT_ID
* GOOGLE_APPLICATION_CREDENTIALS (path to keyfile)
* POD_NAME (name of the process, used as label for stackdriver)