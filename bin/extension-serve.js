"use strict";

var Path = require('path');
var send = require('send');
var fs = require('fs-promise');
var jade = require('jade');
var extensionServe = require('extension-serve-static');

ExensionServe.serveConvert=function serveConvert(root, opts){
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

extensionServe.serveConvert.converters={
    jade:function(content){
        return Promises.start(function(){
            return jade.render(content,{});
        });
    },
    markdown:markdownRender,
    md:markdownRender
}

extensionServe.serveConvert.fileConverters={
}

extensionServe.serve = function serve(req,res,path,opts){
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
                    return Promises.reject(new Error('extensionServe.serve could not serve directory'));
                }
            });
        }else{
            return ExensionServe.serveConvert(opts.root)(req,res,next);
        }
    }).catch(MiniTools.serveErr(req,res));
}

module.exports=extensionServe;