"use strict";

var ExtensionServe=function(){
    return ExtensionServeStatic.getMiddleware.apply(ExtensionServe,arguments);
};

var Path = require('path');
var send = require('send');
var Promises = require('best-promise');
var fs = require('fs-promise');
var jade = require('jade');
var ExtensionServeStatic = require('extension-serve-static');
var MiniTools = require('mini-tools');

ExtensionServe.getMiddleware=function(){
    
}

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
        if(opts.directFilename){
            var fileName=root;
        }else{
            var fileName=root+'/'+req.path;
        }
        var ext=Path.extname(fileName).substring(1);
        var convert=ExtensionServe.serveConvert.fileConverters[Path.basename(fileName)]||ExtensionServe.serveConvert.converters[ext];
        if(!convert){
            return Promises.start(function(){
                return next();
            });
        }else{
            return Promises.start(function(){
                return fs.readFile(fileName, {encoding: 'utf8'});
            }).then(
                convert
            ).then(function(buf){
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                if(typeof buf==="string"){
                    var otherbuf=new Buffer(buf);
                    var length=otherbuf.length;
                }else{
                    var length=buf.length;
                }
                res.setHeader('Content-Length', length);
                res.end(buf);
            }).catch(function(err){
                console.log('ERROR CONVERT',err);
                console.log('stack',err.stack);
                throw err;
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

ExtensionServe.serveFile = function serveFile(req,res,path,opts){
    var fileName;
    return Promises.start(function(){
        fileName=opts.root+'/'+path;
        ExtensionServe.serveConvert(fileName,{directFilename:true})(req,res,function(){
            return fs.stat(fileName).then(function(stat){
                if(!stat.isDirectory()){
                    return new Promises.Promise(function(resolve, reject){
                        send(req,path,opts).pipe(res).on('end',resolve).on('error',reject);
                    });
                }else{
                    return Promises.reject(new Error('ExtensionServe.serveFile could not serve directory'));
                }
            });
        });
    }).catch(MiniTools.serveErr(req,res));
}

module.exports=ExtensionServe;