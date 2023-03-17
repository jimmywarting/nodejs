/*
 * (c) Copyright IBM Corp. 2021
 * (c) Copyright Instana Inc. and contributors 2019
 */

/* eslint-disable no-console */

'use strict';

import instanaFactory from '../../../src/index.js';
const instana = instanaFactory();

import getAppPort from '../../test_util/app-port.js';
const port = getAppPort();

import express from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';

const app = express();
const logPrefix = `API: Server (${process.pid}):\t`;

if (process.env.WITH_STDOUT) {
  app.use(morgan(`${logPrefix}:method :url :status`));
}

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendStatus(200);
});

app.get('/span/active', (req, res) => {
  const span = instana.currentSpan();
  res.json({
    span: serialize(span)
  });
});

app.get('/span/annotate-path-flat-string', (req, res) => {
  const span = instana.currentSpan();
  span.annotate('sdk.custom.tags.key', 'custom nested tag value');
  span.annotate('http.path_tpl', '/custom/{template}');
  span.annotate('..redundant....dots..', 'will be silently dropped');
  res.json({
    span: serialize(span)
  });
});

app.get('/span/annotate-path-array', (req, res) => {
  const span = instana.currentSpan();
  span.annotate(['sdk', 'custom', 'tags', 'key'], 'custom nested tag value');
  span.annotate(['http', 'path_tpl'], '/custom/{template}');
  res.json({
    span: serialize(span)
  });
});

app.get('/span/manuallyended', (req, res) => {
  const span = instana.currentSpan();
  span.disableAutoEnd();
  setTimeout(() => {
    span.end(42);
    res.json({
      span: serialize(span)
    });
  }, 50);
});

app.listen(port, () => {
  log(`Listening on port: ${port}`);
});

function serialize(span) {
  return {
    traceId: span.getTraceId(),
    spanId: span.getSpanId(),
    parentSpanId: span.getParentSpanId(),
    name: span.getName(),
    isEntry: span.isEntrySpan(),
    isExit: span.isExitSpan(),
    isIntermediate: span.isIntermediateSpan(),
    timestamp: span.getTimestamp(),
    duration: span.getDuration(),
    errorCount: span.getErrorCount(),
    data: span.span ? span.span.data : null,
    handleConstructorName: span.constructor.name
  };
}

function log() {
  const args = Array.prototype.slice.call(arguments);
  args[0] = logPrefix + args[0];
  console.log.apply(console, args);
}