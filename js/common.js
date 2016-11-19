/**
 * Created by wangj on 2016/9/29.
 */

var cookie = {
    setCookie: function(key, value, options){
        if(!options) {
            options = {};
        }
        var d = new Date();
        options.exp = options.exp || 86400000;
        var str = key + '=' + value + ';expires=' + d.setDate(d.getTime() + options.exp);
        if(options.path) {
            str += '; path=' + options.path;
        }
        if(options.domain) {
            str += ';domain=' + options.domain;
        }
        if(options.secure) {
            str += 'secure';
        }
        document.cookie = str;
    },
    getCookie: function(key) {
        var reg = new RegExp("(^| )"+key+"=([^;]*)(;|$)");
        var name = document.cookie.match(reg);
        if(name != null) {
            return name[2];
        } else {
            return false;
        }
    },
    removeCookie: function(key) {
        cookie.setCookie(key,cookie.getCookie(),-1);
    }
};

var xhr = {
    formatParam: function (data){
        var arr = [];
        var str = '';
        for(var name in data){
            if(data[name] instanceof Array && data[name].constructor == Array) {
                for(var i = 0; i < data[name].length; i++) {
                    str += '&' + name + '=' + encodeURIComponent(data[name][i]);
                }
            } else {
                arr.push(encodeURIComponent(name) + "=" + encodeURIComponent(data[name]));
            }
        }
        if(arr.length) {
            return arr.join('&') + str;
        } else {
            return str.substring(1);
        }
    },
    ajax: function(option) {
        var x = new XMLHttpRequest();
        if(option.type.toLowerCase() == 'get') {
            if(option.data) {
                x.open('get', option.url + '?' + xhr.formatParam(option.data), true);
            } else {
                x.open('get', option.url, true);
            }
            xhr.setHeader(x, option.header);
            x.send();
        } else if(option.type.toLowerCase() == 'post') {
            x.open('post', option.url, true);
            xhr.setHeader(x, {"Content-Type": "application/x-www-form-urlencoded"});
            xhr.setHeader(x, option.header);
            x.send(xhr.formatParam(option.data));
        }
        x.onreadystatechange = function () {
            if(x.readyState == 4) {
                if(x.status == 200) {
                    var res = x.response;
                    if(option.dataType && option.dataType.toLowerCase() == 'json') {
                        res = JSON.parse(x.response);
                    }
                    option.success && option.success(res, x);
                } else {
                    option.error && option.error(x);
                }
                option.complete && option.complete(x)
            }
        }
    },
    setHeader: function(x,obj) {
        if(obj){
            for(var name in obj){
                x.setRequestHeader(name,obj[name]);
            }
        }
    }
};

var time = {
    toTime: function(tt) {
        var date = new Date();
        date.setTime(tt);
        var d = date.getFullYear() + "-" + time.numFormat(date.getMonth() + 1) + "-" + time.numFormat(date.getDate());
        var t = time.numFormat(date.getHours()) + ":" + time.numFormat(date.getMinutes());
        return ({ date: d, time: t, full: d + " " + t });
    },
    numFormat: function(num) {
        return (Math.abs(num) < 10) ? "0" + parseInt(num) : num;
    }
};

var king = {
    queryString: function(name) {
        var reg = new RegExp("(^|&)"+name+"=([^&]*(&|$))");
        var r = window.location.search.substr(1).match(reg);
        if(r!=null) {
            return decodeURI(r[2]);
        }
        return null;
    },
    setOpacity:function(element,opacity){
        opacity = opacity>1?1:opacity;
        opacity = opacity<0?0:opacity;
        if(document.all){
            element.filter.alpha.opacity = opacity*100;
            element.style.zoom = 1;
        }else{
            element.style.opacity = opacity;
        }
        return  opacity;
    },
    fadeIn:function(element,time){
        var start = new Date()*1;
        element.style.display = 'block';
        king.setOpacity(element,0);
        var fadeInPlay = setInterval(function(){
            var end = new Date()*1;
            if(king.setOpacity(element,(end-start)/time)>=1){
                clearInterval(fadeInPlay);
            }
        },25);
    },
    fadeOut:function(element,time){
        if(time == 0) {
            king.setOpacity(element, 0);
            element.style.display = 'none';
            return;
        }
        var start = new Date()*1;
        element.style.display = 'block';
        king.setOpacity(element,1);
        var fadeOutPlay = setInterval(function(){
            var end = new Date()*1;
            if(king.setOpacity(element,1-((end-start)/time))<=0){
                clearInterval(fadeOutPlay);
                element.style.display = 'none';
            }
        },25);
    },
    tag: function(tagName,props){
        var Tag = document.createElement(tagName);
        if(typeof props == 'string'){
            Tag.className = props;
        }
        else{
            if(props != undefined){
                /*if(props.style){
                 updateObject(props.style,tag.style);
                 delete props.style;
                 }*/
                king.updateObject(props,Tag);
            }
        }
        Tag.append = function (tagName, props) {
            return Tag.appendChild(king.tag(tagName, props));
        };
        return Tag;
    },
    updateObject: function(inputValue,outputValue){
        for(var key in inputValue) {
            if (inputValue[key] && inputValue[key].constructor == Object) {
                outputValue[key] = this.updateObject(inputValue[key], outputValue[key]);
            }
            else if (inputValue[key] != undefined) {
                outputValue[key] = inputValue[key];
            }
        }
        return outputValue;
    }
};

/*
* tips.show({
*   text:'',
*   autoHide:boolean,
*   confirm:boolean,
*   cancel:boolean,
*   callback:{
*       confirm:fun,
*       cancel:fun
*   }
* })
* */
var tips = (function(){
    var out = king.tag('div','tipspop');
    out.style.display = 'none';
    out.style.position = 'fixed';
    var main = out.append('div','popshow-tips');
    var op = out.append('div','tc mt10');
    var close = function(){
        king.fadeOut(out,200);
    };
    var show = function(option){
        document.body.appendChild(out);
        if(!option){
            option = {
                callback:{}
            };
        } else {
            if(!option.callback) {
                option.callback = {};
            }
        }
        var config = {
            img:option.img||'<span class="mr5"></span>',
            text:option.text||'',
            autoHide:option.autoHide&&true,
            confirm:option.confirm||false,
            cancel:option.cancel||false,
            callback:{
                confirm:option.callback.confirm||false,
                cancel:option.callback.cancel||false
            }
        };
        main.innerHTML = config.img+config.text;
        out.style.display = 'block';
        out.style.left = (window.innerWidth-out.offsetWidth)/2+'px';
        out.style.top = (window.innerHeight-out.offsetHeight)/2+'px';
        king.fadeIn(out,200);
        out.style.zIndex = 2000;
        if(config.confirm) {
            if (!out.confirm) {
                var confirm = op.append('div', 'btn btn-primary btn-sm mr10');
                out.confirm = confirm;
                confirm.innerHTML = config.confirm;
                confirm.addEventListener('click', function () {
                    tips.close();
                    if (config.callback.confirm) {
                        config.callback.confirm();
                    }
                })
            }
        }else {
            if (out.confirm) {
                op.removeChild(out.confirm);
                out.confirm = false;
            }
        }
        if(config.cancel){
            if(config.cancel){
                if(!out.cancel){
                    var cancel = op.append('div','btn btn-default btn-sm');
                    out.cancel = cancel;
                    cancel.innerHTML = config.cancel;
                    cancel.addEventListener('click',function(){
                        tips.close();
                        if(config.callback.cancel){
                            config.callback.cancel();
                        }
                    })
                }
            }
        }else{
            if(out.cancel){
                op.removeChild(out.cancel);
                out.cancel = false;
            }
        }
        if(config.autoHide){
            setTimeout(tips.close,2000);
        }
    };
    return {
        show:show,
        close:close
    }
})();

var win = {
    baseWin: function(option) {
        var win = king.tag("div", "pop hack-pop");
        var mask = win.append("div", "pop-backdrop fade in");
        win.style.display = 'none';
        king.setOpacity(win, 0);
        win.mask = mask;
        var main = win.append("div", "pop-dialog pop-form").append("div", "pop-modal-content");
        var head = main.append("div", "pop-modal-header");
        var close = head.append("button", "close");
        close.append("i", "fa close-icon");
        close.append("span", {
            className: "sr-only",
            innerHTML: "Close"
        });
        var title = head.append("h4", {
            className: "modal-title",
            innerHTML: option.title || ""
        });
        var content = main.append("div", "pop-form-horizontal");
        if (option.content) {
            win.content = content.appendChild(option.content);
        }
        if (option.footer) {
            win.footer = main.append("div", "pop-modal-footer");
            win.footer.appendChild(option.footer);
        }
        win.config = function(option) {
            title.innerHTML = option.title;
            content.innerHTML = "";
            content.appendChild(option.content);
        };
        document.body.appendChild(win);
        win.show = function(time, callback) {
            king.fadeIn(win, time || 200);
            if(callback) {
                callback();
            }
        };
        win.hide = function(time, callback) {
            king.fadeOut(win, time || 200);
            if(callback) {
                callback();
            }
        };
        //win.hide(0);
        mask.onclick = function() {
            win.hide();
        };
        close.onclick = function() {
            win.hide();
        };
        return win;
    }
};

window.id = '582d34c1eab14410a0f6c3f5';


