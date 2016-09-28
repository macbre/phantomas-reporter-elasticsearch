# phantomas-reporter-elasticsearch
elasticsearch reporter for phantomas

## Parameters

* `--elasticsearch-host=[ip]` Elasticsearch instance ip (default : 127.0.0.1)
* `--elasticsearch-port=[port]` Elasticsearch instance port (default : 9200)
* `--elasticsearch-index=[index_name]` Name of the index to use
* `--elasticsearch-type=[type_name]` Name of the document type to use

Or by using reporter options - `<host>:<port>:<index>:<type>`.

## Usage

* Install phantomas-reporter-elasticsearch to your phantomas project dependencies (`npm install --save phantomas-reporter-elasticsearch`)
* Use it as specified in the [phantomas reporter docs](https://github.com/macbre/phantomas#reporters)

```
$ phantomas http://app.net/start -R elasticsearch:es.app.net::app:phantomas_metrics
```

> Note: as `<port>` option was skipped a default value will be used (`9200`).

## Debugging

```
$ npm install phantomas-reporter-elasticsearch
$ DEBUG=phantomas:reporter:elasticsearch ./bin/phantomas.js http://example.com -R elasticsearch
  phantomas:reporter:elasticsearch Parameters: {"host":"localhost:9200","type":"report","index":"phantomas"} +0ms
  phantomas:reporter:elasticsearch Stored under id AVdx20wbKV-iX4VpGWoL +611ms
```
