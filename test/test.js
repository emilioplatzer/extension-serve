"use strict";

var assert = require('assert');
var http = require('http');
var path = require('path');
var request = require('supertest');
var extensionServe = require('../bin/extension-serve.js');

var fixtures = __dirname + '/fixtures';
var relative = path.relative(process.cwd(), fixtures);

var skipRelative = ~relative.indexOf('..') || path.resolve(relative) === relative;

describe('extensionServe()', function(){
    describe('basic operations', function(){
        var server;
        before(function () {
            server = createServer(null,{staticExtensions:['','txt','png','html','php','specialtext','jade']});
        });
    
        it('should serve static files', function(done){
            request(server)
            .get('/todo.txt')
            .expect(200, '- groceries', done);
        });

        it('should skip not mentioned extensions', function(done){
            request(server)
            .get('/a_program.js')
            .expect(404, 'sorry!', done);
        });

        it('should render jade', function(done){
            request(server)
            .get('/a_jade.jade')
            .expect(200, '<div id=example><div class=result><a href="/here">aquí</a></div></div>', done);
        });

        it('should not skip special mimed extensions', function(done){
            var mime = extensionServeStatic.mime;
            mime.types.specialtext = 'text/special';
            request(server)
            .get('/this.specialtext')
            .expect(200, 'this special text', done);
        });

        it('should require options', function(){
            assert.throws(extensionServeStatic.bind(null,'/'), /options required/);
        });
    
        it('should require staticExtensions', function(){
            assert.throws(extensionServeStatic.bind(null,'/',{}), /options.staticExtensions required/);
        });
    })
});

function createServer(dir, opts, fn) {
  dir = dir || fixtures;

  var _serve = extensionServe(dir, opts);

  return http.createServer(function (req, res) {
    fn && fn(req, res);
    _serve(req, res, function (err) {
      res.statusCode = err ? (err.status || 500) : 404;
      res.end(err ? err.stack : 'sorry!');
    });
  });
}

