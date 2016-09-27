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
	ELASTICSEARCH_TYPE = 'report_test';

describe('Reporter', () => {
	it('sends data to elasticsearch', (done) => {
		var options = {
			'elasticsearch-index': ELASTICSEARCH_INDEX,
			'elasticsearch-type': ELASTICSEARCH_TYPE,
		};

		reporter(getResultsMock(), [], options).render(done);
	});
});

// http://127.0.0.1:9200/_cat/indices?v
// http://127.0.0.1:9200/phantomas_test/_search?q=foo:bar&sort=reportDate:desc&size=1
describe('elasticsearch', () => {
	it('returns stored results', (done) => {
		// https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-search
		var elasticsearch = require('elasticsearch'),
			client = new elasticsearch.Client(),
			results = getResultsMock();

		client.search({'index': ELASTICSEARCH_INDEX, 'q': 'foo:bar', 'sort': 'reportDate:desc', 'size': 1}, function(err, resp) {
			assert.ok(err === undefined);
			console.log(resp);

			var res = resp.hits.hits[0]._source;

			assert.equal(res.url, results.getUrl());
			assert.equal(res.requests, results.getMetric('requests'));
			assert.equal(res.loadTime, results.getMetric('loadTime'));
			assert.equal(res.foo, results.getMetric('foo'));

			done();
		});
	});
});
