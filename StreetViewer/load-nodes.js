﻿var fs = require('fs');
var through2 = require('through2');
var split2 = require('split2');
var levelup = require('level');
var LevelBatch = require('level-batch-stream');
var BatchStream = require('batch-stream');

var DATABASE_NAME = 'streetviewer';
var INPUT_FILE = 'output/nodes.txt';

var i = 0;

console.log('creating levelDB database ' + DATABASE_NAME);
levelup(DATABASE_NAME, function (err, db) {
    fs.createReadStream(INPUT_FILE, { encoding: 'utf8' })
    .pipe(split2())
    .pipe(through2.obj(function (line, enc, next) {
        var parts = line.split(',');
        this.push({
            key: parts[0],
            value: parts[1] + "," + parts[2]
        });
        
        if (i++ > 999) {
            setImmediate(next);
            i = 0;
        } else {
            next();
        }
    }))
    .pipe(new BatchStream({ size: 100 }))
    .pipe(new LevelBatch(db))
    .on('finish', function () {
        console.log('Finished importing nodes into the database ' + DATABASE_NAME);
    });
});