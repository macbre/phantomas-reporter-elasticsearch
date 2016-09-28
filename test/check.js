'use strict';

var reporter = require('../'),
	assert = require('assert');

function getResultsMock() {
	var metrics = {
		'requests': 42,
		'loadTime': 0.123,
		'foo': 'bar'
	};

	return {
		getUrl: () => 'http://example.com',
		getMetricsNames: () => Object.keys(metrics),
		getMetric: (metric) => metrics[metric],
	};
}

var ELASTICSEARCH_INDEX = 'phantomas_test',
	ELASTICSEARCH_TYPE = 'report_test',
	resultId;

describe('Reporter', () => {
	it('sends data to elasticsearch', (done) => {
		var options = {
			'elasticsearch-index': ELASTICSEARCH_INDEX,
			'elasticsearch-type': ELASTICSEARCH_TYPE,
		};

		reporter(getResultsMock(), [], options).render((err, data) => {
			assert.ok(err === undefined);

			console.log('Result stored under ID: ' + data.id);
			resultId = data.id;

			done();
		});
	});
});

// http://127.0.0.1:9200/_cat/indices?v
// http://127.0.0.1:9200/phantomas_test/_search?q=foo:bar&sort=reportDate:desc&size=1
// http://127.0.0.1:9200/phantomas_test/report_test/AVdxouBSKV-iX4VpGWnz
describe('elasticsearch', () => {
	it('returns stored results', (done) => {
		var elasticsearch = require('elasticsearch'),
			client = new elasticsearch.Client(),
			results = getResultsMock();

		// https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference-1-4.html#api-get-1-4
		client.get({'index': ELASTICSEARCH_INDEX, 'type': ELASTICSEARCH_TYPE, 'id': resultId}, (err, resp) => {
			assert.ok(err === undefined);
			console.log(resp);

			var res = resp._source;

			assert.equal(res.url, results.getUrl());
			assert.equal(res.requests, results.getMetric('requests'));
			assert.equal(res.loadTime, results.getMetric('loadTime'));
			assert.equal(res.foo, results.getMetric('foo'));

			done();
		});
	});
});
