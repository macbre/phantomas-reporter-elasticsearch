/**
 * Reporter for storing data in ElasticSearch
 *
 * --reporter elasticsearch
 * --elasticsearch-host localhost
 * --elasticsearch-port 9200
 * --elasticsearch-index "myapp"
 * --elasticsearch-type "phantomas-report"
 *
 * Debugging:
 *  curl -s -XGET 'http://localhost:9200/phantomas/report/<id>/_source'
 *
 * Options:
 *  <host>:<port>:<index>:<type>
 */
'use strict';

module.exports = function (results, reporterOptions, options) {
    var debug = require('debug')('phantomas:reporter:elasticsearch'),
        publicIp = require('public-ip'),
        params;
    // -R elasticsearch:<host>:<port>:<index>:<type>
    if (reporterOptions.length > 0) {
        options['elasticsearch-host'] = reporterOptions[0];
        options['elasticsearch-port'] = reporterOptions[1];
        options['elasticsearch-index'] = reporterOptions[2];
        options['elasticsearch-type'] = reporterOptions[3];
    }

    params = {
        host: (options['elasticsearch-host'] || 'localhost') + ':' + (options['elasticsearch-port'] || 9200),
        type: (options['elasticsearch-type'] || 'report'),
        index: (options['elasticsearch-index'] || 'phantomas')
    };

    debug('Parameters: %j', params);

    // public API
    return {
        render: function (done) {
            publicIp.v4().then(function (ip) {

                var elasticsearch = require('elasticsearch'),
                    client = new elasticsearch.Client({
                        host: params.host,
                        log: 'trace'
                    }),
                    metrics = results.getMetricsNames(),
                    documentBody = {
                        url: results.getUrl(),
                        reportDate: new Date(),
                        from: ip
                    },
                    mappingFields = {
                        url: {
                            type: 'keyword',
                            index: true
                        },
                        reportDate: {
                            type: 'date'
                        },
                        from: {
                            type: 'ip'
                        }
                    };

                // create and index an elasticsearch document with metrics data
                function indexReport(documentBody) {
                    client.index({
                        index: params.index,
                        type: params.type,
                        body: documentBody
                    }, function (error, data) {
                        if (typeof error != "undefined") {
                            done(new Error('Indexing error: ' + error));
                        } else {
                            debug('Stored under id %s', data._id);
                        }
                        done(undefined, {id: data._id});
                    });
                }

                // store metrics value and mapping types
                metrics.forEach(function (metric) {
                    var value = results.getMetric(metric);
                    documentBody[metric] = value;

                    mappingFields[metric] = {
                        type: (isNaN(value) ? 'text' : 'integer')
                    };
                });

                client.indices.exists({
                    index: params.index
                }, function (err, exists) {
                    if (typeof(err) == "undefined") {
                        // index does not exists, we have to create it and define the mapping
                        if (!exists) {
                            client.indices.create({
                                index: params.index
                            }, function (err) {
                                if (typeof(err) == "undefined") {
                                    var mapping = {};
                                    mapping[params.type] = {
                                        properties: mappingFields
                                    };
                                    client.indices.putMapping({
                                        type: params.type,
                                        index: params.index,
                                        body: mapping
                                    }, function (err, data) {
                                        if (typeof err == "undefined") {
                                            indexReport(documentBody);
                                        } else {
                                            done(new Error('Create mapping error: ' + err));
                                        }
                                    });
                                } else {
                                    done(new Error('Create index error: ' + err));
                                }
                            });
                        } else {
                            indexReport(documentBody);
                        }
                    } else {
                        done(new Error('Index exists check error:' + err));
                    }
                });
            });
        }
    };
};
