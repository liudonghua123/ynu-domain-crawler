#!/usr/bin/env node
'use strict';

const { ArgumentParser } = require('argparse');
const { version } = require('./package.json');

const parser = new ArgumentParser({
  description: 'Argparse example'
});

parser.add_argument('-v', '--version', { action: 'version', version });
parser.add_argument('-f', '--foo', { help: 'foo bar', default: 'abc' });
parser.add_argument('-b', '--bar', { help: 'bar foo', default: 'efg' });
parser.add_argument('--baz', { help: 'baz bar' });

console.info(parser.parse_args());