"use strict";

var Path = require('path');
var send = require('send');
var fs = require('fs-promise');
var jade = require('jade');
var ExtensionServe = require('extension-serve-static');

if("with markdown support"){
    var marked = require("marked");
    marked.setOptions({
        renderer: new marked.Renderer(),
        gfm: true,
        tables: true,
        breaks: false,
        pedantic: false,
        sanitize: false,
        smartLists: true,
        smartypants: false,
        highlightx: function (code, lang, callback) {
            require('pygmentize-bundled')({ lang: lang, format: 'html' }, code, function (err, result) {
                callback(err, result.toString());
            });
        },
        highlight: function(code){
            return require('highlight.js').highlightAuto(code).value;
        }
    });
    var markdownRender=function markdownRender(content){
        return Promises.make(function(resolve, reject){
            marked(content,function(err,ok){
                if(err){
                    reject(err);
                }else{
                    var html='<!doctype html>\n<html><head>'+
                        '<link href="/markdown.css" media="all" rel="stylesheet" />'+
                        '<link href="/markdown2.css" media="all" rel="stylesheet" />'+
                        '<link href="/github.css" media="all" rel="stylesheet" />'+
                        '</head><body><article class="markdown-body entry-content" itemprop="mainContentOfPage">'+
                        ok+
                        '</article></body></html>';
                    resolve(html);
                }
            });
        });
    }
}

ExtensionServe.serveConvert=function serveConvert(root, opts){
    return function(req,res,next){
        var ext=path.extname(req.path).substring(1);
        var convert=serveConvert.fileConverters[path.basename(req.path)]||serveConvert.converters[ext];
        if(!convert){
            next();
        }else{
            var fileName=root+'/'+req.path;
            Promises.start(function(){
                return fs.readFile(fileName, {encoding: 'utf8'});
            }).then(
                convert
            ).catch(function(err){
                return '<H1>ERROR</H1><PRE>'+err;
            }).then(function(buf){
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                if(typeof buf==="string"){
                    var length=System.Text.ASCIIEncoding.Unicode.GetByteCount(string);
                }else{
                    var length=buf.length;
                }
                res.setHeader('Content-Length', length);
                res.end(buf);
            });
        }
    };
}

ExtensionServe.serveConvert.converters={
    jade:function(content){
        return Promises.start(function(){
            return jade.render(content,{});
        });
    },
    markdown:markdownRender,
    md:markdownRender
}

ExtensionServe.serveConvert.fileConverters={
}

ExtensionServe.serve = function serve(req,res,path,opts){
    var fileName;
    return Promises.start(function(){
        fileName=opts.root+'/'+path;
        return fs.exist(fileName);
    }).then(function(exists){
        if(exists){
            return fs.stat(fileName).then(function(stat){
                if(!stat.isDirectory()){
                    return new Promises.Promise(function(resolve, reject){
                        send(req,path,opts).pipe(res).on('end',resolve).on('error',reject);
                    });
                }else{
                    return Promises.reject(new Error('ExtensionServe.serve could not serve directory'));
                }
            });
        }else{
            return ExtensionServe.serveConvert(opts.root)(req,res,next);
        }
    }).catch(MiniTools.serveErr(req,res));
}

module.exports=ExtensionServe;