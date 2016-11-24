/**
 * Created by wangj on 2016/8/13.
 */

var KEObject = {
    kETool_down:document.getElementById('kETool_LH').getElementsByClassName('kETool_down')[0],
    kETool_LHDown:document.getElementById('kETool_LH').getElementsByClassName('kETool_LHDown')[0]
};
var KEStatus = {
    selection:undefined,
    range:undefined,
    list:[],//保存历史操作，用于撤销
    redoList:[],//保存撤销历史操作，用于恢复撤销
    emptyList:[],//用于去除上次操作产生的空节点
    status:{},//用于保存当前range选中的状态
    isKEMCDown:false,//焦点是否位于编辑区内
    isEmptyNode: function(node) {//判断是否为空节点
        if(!node) {
            return false;
        }
        if(node.nodeType == 3 && (node.data == "​" || node.data == '')){
            return true;
        }
        if(node.nodeType == 1) {
            var arr = [];
            if(!node.childNodes.length) {
                return true;
            }
            for(var i = 0; i < node.childNodes.length; i++) {
                if(!KEStatus.isEmptyNode(node.childNodes[i])) {
                    return false;
                }
            }
            return true;
        }
        return false;
    },
    //恢复range
    setFocus:function(){
        kEMain.focus();
        KEStatus.range.setStart(KEStatus.range.startContainer,KEStatus.range.startOffset);
        KEStatus.range.setEnd(KEStatus.range.endContainer,KEStatus.range.endOffset);
        KEStatus.select();
    },
    //保存range
    saveCusorPos:function(){
        KEStatus.selection = window.getSelection?window.getSelection():document.selection;
        KEStatus.range = KEStatus.selection.createRange?KEStatus.selection.createRange():KEStatus.selection.getRangeAt(0);
        KEStatus.delEmptyList();
    },
    //选中range
    select:function(){
        KEStatus.selection.removeAllRanges();
        KEStatus.selection.addRange(KEStatus.range);
    },
    //去除标签占位符
    delEmptyList:function(){
        while(KEStatus.emptyList.length) {
            obj = KEStatus.emptyList.pop();
            if(obj.parentNode.parentNode) {
                if(obj.length == 1) {
                    if(obj.parentNode.innerHTML.length > 0) {
                        obj.parentNode.removeChild(obj);
                    } else {
                        obj.parentNode.parentNode.removeChild(obj.parentNode);
                    }
                } else if (obj.length > 1) {
                    var start = KEStatus.range.startOffset;
                    var end = KEStatus.range.endOffset;
                    obj.data = obj.data.substr(1);
                    if(KEStatus.range.startContainer == obj) {
                        KEStatus.range.setStart(obj, start-1);
                    }
                    if(KEStatus.range.endContainer == obj) {
                        KEStatus.range.setEnd(obj, end-1);
                    }
                }
                KEStatus.select();
            }
         /*   if(obj != KEStatus.range.commonAncestorContainer){
                if(obj.childNodes&&obj.childNodes.length==1&&obj.childNodes[0].nodeType==3&&obj.childNodes[0].length==1){
                    obj.parentNode&&obj.parentNode.removeChild(obj);
                }else if(obj.nodeType==3&&(obj.data=="​"||obj.data=='')){
                    obj.parentNode&&obj.parentNode.removeChild(obj);
                }else if(obj.childNodes&&obj.childNodes.length&&obj.childNodes[0].nodeType==3&&obj.childNodes[0].length>1){
                    var s = KEStatus.range.startOffset,e = KEStatus.range.endOffset;
                    obj.childNodes[0].data = obj.childNodes[0].data.replace("​",'');
                    if(s!=KEStatus.range.startOffset){
                        KEStatus.range.setStart(KEStatus.range.startContainer,s-1);
                    }
                    if(e!=KEStatus.range.endOffset){
                        KEStatus.range.setEnd(KEStatus.range.endContainer,e-1);
                    }
                }else if(obj.nodeType==3){
                    s = KEStatus.range.startOffset,e = KEStatus.range.endOffset;
                    obj.data = obj.data.replace("​",'');
                    if(s!=KEStatus.range.startOffset){
                        KEStatus.range.setStart(KEStatus.range.startContainer,s-1);
                    }
                    if(e!=KEStatus.range.endOffset){
                        KEStatus.range.setEnd(KEStatus.range.endContainer,e-1);
                    }
                }
            }*/
        }
        KEStatus.emptyList.length = 0;
    },
    //命令入口
    execCommand:function(command, option){
        if(!KEStatus.range){
            kEMain.focus();
            KEStatus.saveCusorPos();
        }
        KEStatus.delEmptyList();
        KECommands['save']();
        KECommands[command](option);
        KEStatus.select();
        KEStatus.initTools();
    },
    //去除子节点相同的节点
    mergeChild: function(element, tagName, option){
        var tags = element.getElementsByTagName(tagName), child, nodes = [];
        for(var i=0; i < tags.length; i++){
            nodes[i] = tags[i];
        }
        if(option){
            for(i = 0; i < nodes.length; i++) {
                if(!KEStatus.compare(option,nodes[i])) {
                    nodes.splice(i, 1);
                    i--;
                }
            }
        }
        for(i = 0, j=nodes.length; i < j; i++) {//将相同节点的子节点一个一个移至父节点下，最后删除该节点
            while(child = nodes[i].firstChild) {
                nodes[i].parentNode.insertBefore(child, nodes[i]);
            }
            nodes[i].parentNode.removeChild(nodes[i]);
        }
    },
    //合并前后相同的节点
    mergeParent:function(element){
        var prev = element.previousSibling, next = element.nextSibling,
            i, child = element.firstChild, parent = element.parentNode;
        merge(prev,1);
        merge(next,2);
        function merge(ele,type) {
            /*while(ele&&ele.nodeType==3&&(ele.data==''||ele.data=="​")){
                if(type==1){
                    ele = ele.previousSibling;
                    if(ele){
                        ele.parentNode.removeChild(ele.nextSibling);
                    }
                }else{
                    ele = ele.nextSibling;
                    if(ele){
                        ele.parentNode.removeChild(ele.previousSibling);
                    }
                }
            }*/
            if(ele && ele.nodeName == element.nodeName) {
                while(ele.childNodes.length){
                    if(type==1){
                        element.insertBefore(ele.childNodes[0],child);
                    }else{
                        element.appendChild(ele.childNodes[0]);
                    }
                }
                parent.removeChild(ele);
            }
        }
    },
    //获取range的递归最后节点
    getRangeEndContainer:function(b){
        while(b.lastChild){
            b = b.lastChild;
        }
        return b;
    },
    //获取range的递归起始节点
    getRangeStartContainer:function(b){
        while(b.firstChild){
            b = b.firstChild;
        }
        return b;
    },
    //获取节点递归父节点的p节点
    getFatherP: function(node) {
        while(node.nodeName != 'P') {
            node = node.parentNode;
            if(node == kEMain) {
                return;
            }
        }
        return node;
    },
    //去除前后空白节点
    mergeEmpty:function(b) {
        mergeChild(b.previousSibling);
        mergeChild(b.nextSibling);
        function mergeChild(ele) {
            if(KEStatus.isEmptyNode(ele)) {
                ele.parentNode.removeChild(ele);
            } else {
                if(ele && ele.firstChild) {
                    mergeChild(ele.firstChild);
                }
            }
        }
    },
    //初始化工具栏
    initTools:function(){
        setTools('isBold','B',kETool_b);
        setTools('isItalic','I',kETool_i);
        setTools('isUnderline','U',kETool_u);
        setTools('isBorder','SPAN',kETool_border,{style:{border:'1px solid rgb(0, 0, 0)'}});
        //判断选中多行-start
        var s = KEStatus.range.startContainer,e = KEStatus.range.endContainer;
        while(s.parentNode!=kEMainContent){
            s = s.parentNode;
        }
        while(e.parentNode!=kEMainContent){
            e = e.parentNode;
        }
        if(s!=e){
            KEStatus.isMultiLine = {
                start:s,
                end:e
            };
        }else{
            KEStatus.isMultiLine = false;
        }
        //判断选中多行-end
        //行高-start
        s = KEStatus.range.startContainer;
        var lhMap = {
            '1':0,'1.5':1,'1.75':2,'2':3,'3':4,'4':5,'5':6
        };
        while(s.parentNode!==kEMainContent){
            s = s.parentNode;
        }
        if(s.style.lineHeight){
            var lh = s.style.lineHeight;
            var n = lh.substring(0,lh.length-2);
            KEObject.kETool_LHDown.getElementsByClassName('on')[0].className = 'option';
            KEObject.kETool_LHDown.children[lhMap[n]].className = 'option on';
        }else{
            if(KEObject.kETool_LHDown.getElementsByClassName('on')[0]){
                KEObject.kETool_LHDown.getElementsByClassName('on')[0].className = 'option';
            }
            KEObject.kETool_LHDown.children[0].className = 'option on';
        }
        //行高-end
        function setTools(status,nodeName,element,option){//状态，节点标签，节点
            var node = KEStatus.range.startContainer;
            while(node!=kEMainContent){
                if(node.nodeName==nodeName){
                    if(option){
                       if(KEStatus.compare(option,node)){
                           break;
                       }
                    }else{
                        break;
                    }
                }
                node = node.parentNode;
            }
            if(node==kEMainContent){
                KEStatus.status[status] = {status:false};
                element.className = 'kETool_btn kETool_bg';
            }else{
                element.className = 'kETool_btn kETool_bg checked';
                KEStatus.status[status] = {status:true,node:node};
            }
        }
    },
    //保存工作
    saveWork:function(arr){
        arr.push({
            content:kEMainContent.innerHTML.trim(),
            range:(function(){
                var start = [],end = [];
                start.push(KEStatus.range.startOffset);
                end.push(KEStatus.range.endOffset);
                rangeMap(start,KEStatus.range.startContainer);
                rangeMap(end,KEStatus.range.endContainer);
                function rangeMap(array,element){
                    var parent = element;
                    while(parent!=kEMainContent){
                        var i=0;
                        var prev = parent.previousSibling;
                        while(prev){
                            if(prev.nodeType==3&&(prev.data=="​"||prev.data=='')){
                                prev = prev.previousSibling;
                                continue;
                            }
                            if(!(prev.nodeType==3&&prev.previousSibling&&prev.previousSibling.nodeType==3)){
                                i++;
                            }
                            prev = prev.previousSibling;
                        }
                        array.push(i);
                        parent = parent.parentNode;
                    }
                }
                return {
                    start:start,
                    end:end
                }
            })()
        });
    },
    //还原工作
    setWork:function(arr){
        var last = arr.pop();
        function unrangeMap(array){
            var root = kEMainContent,container;
            for(var i=array.length-1;i>0;i--){
                container = root.childNodes[array[i]];
                root = container;
            }
            return {
                start:array[0],
                container:container
            }
        }
        kEMainContent.innerHTML = last.content;
        var s = unrangeMap(last.range.start);
        var e = unrangeMap(last.range.end);
        KEStatus.range.setStart(s.container, s.start);
        KEStatus.range.setEnd(e.container, e.start);
        KEStatus.select();
    },
    compare:function(inputValue,outputValue){
        for(var key in inputValue) {
            if (inputValue[key] && inputValue[key].constructor == Object) {
                if(!KEStatus.compare(inputValue[key], outputValue[key])){
                    return false;
                }
            }
            else if (inputValue[key] != outputValue[key]) {
                return false
            }
        }
        return true;
    },
    updateObject:function (inputValue,outputValue){
        for(var key in inputValue) {
            if (inputValue[key] && inputValue[key].constructor == Object) {
                KEStatus.updateObject(inputValue[key], outputValue[key]);
            }
            else if (inputValue[key] != undefined) {
                outputValue[key] = inputValue[key];
            }
        }
        return outputValue;
    },
    paste:function(e){
        var html = e.clipboardData.getData('text/html');
        if(html){
            KECommands.save();
            //屏蔽值
            var styleSheet = {
                'color': 'rgb(0, 0, 0)',
                /*'font-family': 'Simsun',*/
                'font-size': 'medium',
                'font-style': 'normal',
                'font-variant-ligatures': 'normal',
                'font-variant-caps': 'normal',
                'font-weight': 'normal',
                'letter-spacing': 'normal',
                'line-height': 'normal',
                'orphans': '2',
                'text-align': 'start',
                'text-indent': '0px',
                'text-transform': 'none',
                'white-space': 'normal',
                'widows': '2',
                'word-spacing': '0px',
                '-webkit-text-stroke-width': '0px',
                'float': 'none',
                'display': 'inline'
            };
            //屏蔽属性
            var styleSheetKey = {
                'font-family': true
            };
            e.preventDefault();
            html = html.replace(/strong>/g,'b>');
            html = html.replace(/<em>/g,'i>');
            var span = document.createElement('span'),ele,flag=false;
            var a = html.match(/<!--StartFragment-->(.*)<!--EndFragment-->/);
            if(a && a.length) {
                span.innerHTML = html.match(/<!--StartFragment-->(.*)<!--EndFragment-->/)[1];
            } else {
                var b = html.match(/<body>(.*)<\/body>/);
                if(b && b.length) {
                    span.innerHTML = html.match(/<body>(.*)<\/body>/)[1];
                } else {
                    return;
                }
            }
            var block = KEStatus.isBlock(span.firstChild);//是否是块级
            var range = KEStatus.range.cloneRange();
            if(!range.collapsed) {
                range.extractContents();
            }
            //var end = span.lastChild;
            if(block) {
                if(range.endContainer != kEMainContent) {
                    range.setEndAfter(KEStatus.getFatherP(range.endContainer));
                } else {
                    range.setEndAfter(kEMainContent.childNodes[range.endOffset]);
                }
                var bottom = range.extractContents();
                while(ele = span.lastChild) {
                    var obj = document.createElement(ele.nodeName);
                    obj.innerHTML = ele.innerHTML;
                    if(!flag){
                        flag = obj;
                    }
                    for(var key = 0; key < ele.style.length; key++){
                        var t = ele.style[key], ts = ele.style[t];
                        if(ts != styleSheet[t] && !styleSheetKey[t]){
                            obj.style[t] = ts;
                        }
                    }
                    span.removeChild(ele);
                    ele = span.lastChild;
                    range.insertNode(obj);
                }
                var collrange = range.cloneRange();
                collrange.collapse(false);
                collrange.insertNode(bottom);
            } else {
                while(ele = span.lastChild) {
                    obj = document.createElement(ele.nodeName);
                    obj.innerHTML = ele.innerHTML;
                    if(!flag){
                        flag = obj;
                    }
                    for(key=0;key<ele.style.length;key++){
                        t = ele.style[key];
                        ts = ele.style[t];
                        if(ts != styleSheet[t] && !styleSheetKey[t]){
                            obj.style[t] = ts;
                        }
                    }
                    span.removeChild(ele);
                    ele = span.lastChild;
                    range.insertNode(obj);
                }
            }
            KEStatus.mergeEmpty(flag);
            KEStatus.mergeEmpty(obj);
            var node = KEStatus.getRangeEndContainer(flag);
            range.setEnd(node, node.length);
            range.setStart(KEStatus.getRangeStartContainer(obj), 0);
            KEStatus.range = range;
            KEStatus.select();
            /*var block = KEStatus.isBlock(span),range;
            while(ele = span.lastChild){
                var obj = document.createElement(ele.nodeName);
                obj.innerHTML = ele.innerHTML;
                if(!flag){
                    flag = obj;
                }
                for(var key=0;key<ele.style.length;key++){
                    var t = ele.style[key],ts = ele.style[t];
                    if(ts!=styleSheet[t]){
                        obj.style[t] = ts;
                    }
                }
                range = KEStatus.range.cloneRange();
                if(!obj.style.length&&obj.nodeName=='SPAN'){
                    range.insertNode(obj);
                    range.setEndBefore(obj);
                    while(obj.firstChild){
                        obj.parentNode.insertBefore(obj.firstChild,obj);
                    }
                    if(flag==obj){
                        flag = obj.previousSibling;
                    }
                    obj.parentNode.removeChild(obj);
                    KEStatus.select();
                }else{
                    range.insertNode(obj);
                    range.setEndBefore(obj);
                    KEStatus.select();
                }
                span.removeChild(ele);
            }
            obj = KEStatus.getRangeEndContainer(flag);
            KEStatus.range.setEnd(obj,obj.length);
            KEStatus.range.collapse(false);
            KEStatus.select();*/
        }else{
            KEStatus.pastePlain(e);
        }
    },
    pastePlain:function(e){
        e.preventDefault();
        var text =  e.clipboardData.getData("text/plain");
        if(text){
            KECommands['save']();
            var textRange = KEStatus.range;

            if(window.clipboardData && clipboardData.setData) {
                // IE
                text = window.clipboardData.getData('text');
            } else {
                text =  e.clipboardData.getData("text/plain");
                text = text.replace(/(\r\n){2}/g,'\r\n');
            }
            if (document.body.createTextRange) {
                textRange.text = text;
                textRange.collapse(false);
                textRange.select();
            } else {
                // Chrome之类浏览器
                document.execCommand("insertText", false, text);
            }
        }
    },
    isBlock:function(element) {
        return (element.style.display == 'block' || (element.style.display == '' && element.nodeName == 'P'));
    }
};
var KECommands = {
    execCommandTag: function(status, nodeName, option) {
        var b,obj,ec,range,length;
        if(!KEStatus.isMultiLine) {//单行操作
            if(!KEStatus.status[status].status) {//添加效果
                b = tag(nodeName,option);
                if(KEStatus.range.collapsed) {//选中为空
                    KEStatus.range.insertNode(b);
                    b.innerHTML = '&#8203;';
                    KEStatus.emptyList.push(b.firstChild);
                    KEStatus.range.setEnd(b.firstChild,1);
                    KEStatus.range.collapse(false);
                    //KEStatus.select();
                } else {
                    /*
                    * <p>abc<i>【abc】</i>abc</p>单个标签首尾
                    * <p>abc<i>【ab】c</i>abc</p>单个标签首中
                    * <p>abc<i>a【bc】</i>abc</p>单个标签中尾
                    * <p>abc<i>a【b】c</i>abc</p>单个标签中中
                    * <p>【abc<i>a】bc</i>abc</p>多标签首中
                    * <p>【abc<i>abc】</i>abc</p>多标签首尾
                    * <p>a【bc<i>a】bc</i>abc</p>多标签中中
                    * <p>a【bc<i>abc】</i>abc</p>多标签中尾
                    * <p>abc<i>abc</i>abc</p>
                    * 单行加粗测试没问题
                    * */
                    b.appendChild(KEStatus.range.extractContents());//将选中内容取出并添加到标签中
                    KEStatus.mergeChild(b, nodeName, option);//选中的标签内可能有和外加标签相同，需要去除子节点相同标签
                    KEStatus.range.insertNode(b);//将处理好的标签插入文本
                    KEStatus.mergeEmpty(b);//移除因为取出产生的空白标签或文本
                    KEStatus.range.setStart(KEStatus.getRangeStartContainer(b), 0);//恢复选中状态
                    obj = KEStatus.getRangeEndContainer(b);
                    KEStatus.range.setEnd(obj,obj.length);
                    //KEStatus.select();//选中
                    KEStatus.mergeParent(b);//若兄弟节点属同类标签将其合并
                }
            } else{
                var node = KEStatus.status[status].node;
                //截取前半部分-start
                range = KEStatus.range.cloneRange();
                while(true){
                    if(range.startContainer.nodeType==3){
                        if(range.startOffset==0||(range.startOffset==1&&range.startContainer.data[0]=='')){
                            range.setStartBefore(range.startContainer);
                        }else{
                            break;
                        }
                    }else{
                        if(range.startOffset==0){
                            range.setStartBefore(range.startContainer);
                        }else{
                            break;
                        }
                    }
                }
                range.collapse(true);
                range.setStart(node,0);
                b = tag(nodeName,option);
                b.appendChild(range.extractContents());
                if((b.childNodes.length&&b.childNodes[0].data=="​") || !b.childNodes.length){
                }else{
                    node.parentNode.insertBefore(b,node);
                }
                //截取前半部分-end
                //截取中间部分-start
                range = KEStatus.range.cloneRange();
                while(range.startContainer!=node&&range.endContainer!=range.commonAncestorContainer){
                    if(range.startContainer.nodeType==3){
                        if(range.startOffset==0||(range.startOffset==1&&range.startContainer.data[0]=='')){
                            range.setStartBefore(range.startContainer);
                        }else{
                            break;
                        }
                    }else{
                        if(range.startOffset==0){
                            range.setStartBefore(range.startContainer);
                        }else{
                            break;
                        }
                    }
                }
                while(range.endContainer!=node&&range.endContainer!=range.commonAncestorContainer){
                    if(range.endContainer.nodeType==3) {
                        if(range.endContainer.length==range.endOffset){
                            range.setEndAfter(range.endContainer);
                        }else{
                            break;
                        }
                    }else{
                        if(range.endContainer.childNodes.length==range.endOffset){
                            range.setEndAfter(range.endContainer);
                        }else{
                            break;
                        }
                    }
                }
                if(KEStatus.range.collapsed){
                    ec = tag(nodeName,option);
                    ec.innerHTML = '&#8203;';
                    range.setStart(ec,0);
                    range.setEnd(ec,1);
                    ec = range.extractContents();
                    node.parentNode.insertBefore(ec,node);
                    KEStatus.emptyList.push(node.previousSibling);
                    KEStatus.range.setEnd(node.previousSibling,1);
                    if(node.previousSibling.previousSibling&&node.previousSibling.previousSibling.nodeType==3){
                        KEStatus.range.setStartBefore(node.previousSibling);
                        KEStatus.range.collapse(true);
                        node.parentNode.removeChild(node.previousSibling);
                    }
                    KEStatus.range.collapse(false);
                    //KEStatus.select();
                }else{
                    ec = range.extractContents();
                    b = tag(nodeName,option);
                    b.appendChild(ec);
                    KEStatus.mergeChild(b,nodeName,option);
                    range.setStart(b,0);
                    obj = KEStatus.getRangeEndContainer(b);
                    range.setEnd(obj,obj.length);
                    ec = range.extractContents();
                    obj = node.previousSibling;
                    node.parentNode.insertBefore(ec,node);
                    if(!obj){
                        obj = node.parentNode.firstChild;
                    }else{
                        obj = obj.nextSibling;
                    }
                    KEStatus.range.setStart(KEStatus.getRangeStartContainer(obj),0);
                    obj = KEStatus.getRangeEndContainer(node.previousSibling);
                    KEStatus.range.setEnd(obj,obj.length);
                    //KEStatus.select();
                }
                //截取中间部分-end
                while(node.childNodes.length&&node.firstChild.nodeType==3&&(node.firstChild.data=="​"||node.firstChild.data=='')){
                    node.removeChild(node.firstChild);
                }
                if(!node.childNodes.length){
                    node.parentNode.removeChild(node);
                }
            }
        } else {
            var s = KEStatus.isMultiLine.start,e = KEStatus.isMultiLine.end;
            if(!KEStatus.status[status].status){
                while(true){
                    var rg = KEStatus.range.cloneRange();
                    if(s != KEStatus.isMultiLine.start){
                        rg.setStart(s,0);
                    }
                    if(s !=e ){
                        rg.setEndAfter(s.lastChild);
                        b = tag(nodeName,option);
                        b.appendChild(rg.extractContents());
                        KEStatus.mergeChild(b,nodeName,option);
                        rg.insertNode(b);
                        KEStatus.mergeEmpty(b);
                        if(s==KEStatus.isMultiLine.start){
                            KEStatus.range.setStart(KEStatus.getRangeStartContainer(b), 0);
                            KEStatus.mergeParent(b);
                        }
                    }else{
                        b = tag(nodeName,option);
                        b.appendChild(rg.extractContents());
                        KEStatus.mergeChild(b,nodeName,option);
                        rg.insertNode(b);
                        KEStatus.mergeEmpty(b);
                        KEStatus.range.setEndAfter(b.lastChild);
                        break;
                    }
                    s = s.nextSibling;
                }
                //KEStatus.select();
            }else{
                while(true){
                    rg = KEStatus.range.cloneRange();
                    if(s==KEStatus.isMultiLine.start){
                        rg.setEndAfter(s);
                        b = rg.extractContents();
                        KEStatus.mergeChild(b.firstChild,nodeName,option);
                        rg.setEndAfter(s.lastChild);
                        while(length = b.childNodes[0].childNodes.length){
                            if(b.childNodes[0].childNodes[length-1].nodeName=='BR'){
                                b.childNodes[0].removeChild(b.childNodes[0].childNodes[length-1]);
                                continue;
                            }
                            obj = b.childNodes[0].childNodes[length-1];
                            rg.insertNode(obj);
                        }
                        KEStatus.range.setStart(KEStatus.getRangeStartContainer(obj),0);
                        KEStatus.mergeEmpty(obj);
                    }else if(s!=e){
                        KEStatus.mergeChild(s,nodeName,option);
                    }else if(s==e){
                        rg.setStartBefore(s);
                        b = rg.extractContents();
                        KEStatus.mergeChild(b.firstChild,nodeName,option);
                        rg.setStart(s,0);
                        obj = null;
                        while(length = b.childNodes[0].childNodes.length){
                            if(b.childNodes[0].childNodes[length-1].nodeName=='BR'){
                                b.childNodes[0].removeChild(b.childNodes[0].childNodes[length-1]);
                                continue;
                            }
                            if(!obj){
                                obj = b.childNodes[0].childNodes[length-1];
                            }
                            rg.insertNode(b.childNodes[0].childNodes[length-1]);
                        }
                        b = KEStatus.getRangeEndContainer(obj);
                        KEStatus.range.setEnd(b, b.length);
                        KEStatus.mergeEmpty(obj);
                        //KEStatus.select();
                        break;
                    }
                    s = s.nextSibling;
                }
            }
        }
        function tag(nodeName,option){
            var ele = document.createElement(nodeName);
            if(option){
                KEStatus.updateObject(option,ele);
            }
            return ele;
        }
    },
    execCommandBlock: function(option) {
        if(!KEStatus.isMultiLine) {
            var node = KEStatus.range.startContainer;
            while(node.nodeName != 'P') {
                node = node.parentNode;
            }
            KEStatus.updateObject(option,node);
           /* for(var key in option) {
                for(var name in option[key]) {
                    node[key][name] = option[key][name];
                }
            }*/
        } else {
            var s = KEStatus.isMultiLine.start,e = KEStatus.isMultiLine.end;
            while(s != e) {
                /*for(key in option) {
                    for(name in option[key]) {
                        s[key][name] = option[key][name];
                    }
                }*/
                KEStatus.updateObject(option,s);
                s = s.nextSibling;
            }
            /*for(key in option) {
                for(name in option[key]) {
                    s[key][name] = option[key][name];
                }
            }*/
            KEStatus.updateObject(option,s);
        }
        //KEStatus.select();
    },
    Bold: function() {
        KECommands.execCommandTag('isBold', 'b');
    },
    Italic: function() {
        KECommands.execCommandTag('isItalic','i');
    },
    Underline: function() {
        KECommands.execCommandTag('isUnderline','u');
    },
    Border: function() {
        KECommands.execCommandTag('isBorder','span',{style:{border: '1px solid rgb(0, 0, 0)'}});
    },
    LineHeight: function(em) {
        KECommands.execCommandBlock({style:{'line-height': em + 'em'}});
    },
    save: function(){
        KEStatus.redoList = [];
        KEStatus.saveWork(KEStatus.list);
    },
    undo: function(){
        if(KEStatus.list.length){
            KEStatus.saveWork(KEStatus.redoList);
            KEStatus.setWork(KEStatus.list);
        }
    },
    redo: function(){
        if(KEStatus.redoList.length){
            KEStatus.saveWork(KEStatus.list);
            KEStatus.setWork(KEStatus.redoList);
        }
    }
};

//记录用户选中-start
kEMainContent.onmousedown = function(){
    KEStatus.isKEMCDown = true;
};
kEMainContent.onmouseup = function(){
    if(KEStatus.isKEMCDown){
        KEStatus.saveCusorPos();
        KEStatus.initTools();
    }
};
document.onmouseup = function(e){
    if(KEStatus.isImgDown){
        KEStatus.isImgDown = false;
    }
};
kEMain.onblur = function(){
    KEStatus.isKEMCDown = false;
    KEStatus.saveCusorPos();
    KEStatus.initTools();
};
//记录用户选中-end
//内容为空无法删除-start
kEMain.addEventListener('keydown',function(e){
    if(e.keyCode==8){
        if(kEMainContent.childNodes[0].innerHTML=='<br>' && kEMainContent.childNodes.length < 3){
            e.preventDefault();
            e.stopPropagation();
        }
//内容为空无法删除-end
    }else if(e.keyCode==90){
        event.preventDefault();
        KECommands['undo']();
    }else if(e.keyCode==89){
        event.preventDefault();
        KECommands['redo']();
    }/*else if(e.keyCode==67){
        KECommands['copy']();
    }*/
});
kEMain.onpaste = function(e){
    KEStatus.paste(e);
};
kEMain.oncopy = function(){
    KEStatus.delEmptyList();
};
kEMain.addEventListener('keyup',function(){
    KEStatus.saveCusorPos();
    KEStatus.initTools();
});
kETools.onclick = function(e){
    switch(e.target.id) {
        case 'kETool_b':
            KEStatus.execCommand( 'Bold');
            break;
        case 'kETool_i':
            KEStatus.execCommand( 'Italic');
            break;
        case 'kETool_u':
            KEStatus.execCommand( 'Underline');
            break;
        case 'kETool_border':
            KEStatus.execCommand( 'Border');
            break;
        case 'kETool_LHL':
            KEStatus.execCommand( 'LineHeight', KEObject.kETool_LHDown.getElementsByClassName('on')[0].innerText);
            break;
        case 'kETool_p':
            if(!KEStatus.range){
                kEMain.focus();
                KEStatus.saveCusorPos();
                KEStatus.initTools(KEStatus.range);
            }
            KEStatus.setFocus();
            //KECommands.save();
            if(kETool_p.className == 'kETool_btn kETool_bg checked'){
                kETool_p.className = 'kETool_btn kETool_bg';
                kEMain.onpaste = function(e){
                    KEStatus.paste(e);
                }
            } else{
                kETool_p.className = 'kETool_btn kETool_bg checked';
                kEMain.onpaste = KEStatus.pastePlain;
            }
            break;
    }
};
kETool_img.addEventListener('change',function(){
    if(!KEStatus.range){
        kEMain.focus();
        KEStatus.saveCusorPos();
    }
    KEStatus.setFocus();
    var img = document.createElement('img');
    var st = KEStatus.selection;
    var r = KEStatus.range;
    var s = function(e){
        event.stopPropagation();
    };
    var n = function(){
        focusImg.style.display = 'none';
        KEStatus.modifyImg = undefined;
        KEStatus.selection = st;
        KEStatus.range = r;
        KEStatus.setFocus();
    };
    //img.setAttribute('id','image');
    KEStatus.range.insertNode(img);
    KEStatus.range.setStartAfter(img);
    KEStatus.range.setEndAfter(img);
    st = KEStatus.selection;
    r = KEStatus.range;
    var form = new FormData();
    form.append("file", document.getElementById('kETool_img').files[0]);
    var xhr = new XMLHttpRequest();
    xhr.open('post', '/api/upload', true);
    xhr.send(form);
    xhr.onreadystatechange = function () {
        if(xhr.readyState == 4) {
            if(xhr.status == 200) {
                var res = JSON.parse(xhr.response);
                img.src = res.url;
                img.onclick = function(){
                    KEStatus.range.selectNode(img);
                    KEStatus.modifyImg = img;
                    KEStatus.setFocus();
                    modifyImg.removeEventListener('click',s);
                    focusImg.removeEventListener('click',n);
                    modifyImg.style.left = img.offsetLeft+'px';
                    modifyImg.style.top = (img.offsetTop-kEMainContent.scrollTop)+'px';
                    modifyImg.style.width = img.clientWidth+'px';
                    modifyImg.style.height = img.clientHeight+'px';
                    focusImg.style.display = 'block';
                    modifyImg.addEventListener('click',s);
                    focusImg.addEventListener('click',n);
                };
                console.log(res.url);
            } else {
                console.log(0);
                img.parentNode.removeChild(img);
            }
        }
    };
    //document.execCommand("inserthtml",'<img src=\"\" id=\"load\"/>');
    //KEStatus.saveCusorPos();
    //me.execCommand('inserthtml', '<img class="loadingclass" id="' + loadingId + '" src="' + me.options.themePath + me.options.theme +'/images/spacer.gif" title="' + (me.getLang('simpleupload.loading') || '') + '" >');
   /* if(typeof FileReader != 'undefined'){
        var acceptedTypes = {
            'image/png':true,
            'image/jpeg':true,
            'image/gif':true
        };
        if(acceptedTypes[document.getElementById('kETool_img').files[0].type] === true){
            var reader = new FileReader();
            reader.onload = function(event){
                img.setAttribute('src',event.target.result);
                img.onclick = function(){
                    KEStatus.range.selectNode(img);
                    KEStatus.modifyImg = img;
                    KEStatus.setFocus();
                    modifyImg.removeEventListener('click',s);
                    focusImg.removeEventListener('click',n);
                    modifyImg.style.left = img.offsetLeft+'px';
                    modifyImg.style.top = (img.offsetTop-kEMainContent.scrollTop)+'px';
                    modifyImg.style.width = img.clientWidth+'px';
                    modifyImg.style.height = img.clientHeight+'px';
                    focusImg.style.display = 'block';
                    modifyImg.addEventListener('click',s);
                    focusImg.addEventListener('click',n);
                };
                img.removeAttribute('id');
                KEStatus.setFocus();
            };
            reader.readAsDataURL(document.getElementById('kETool_img').files[0]);
        }
    }*/
});
modifyImg.addEventListener('mousedown',function(e){
    KEStatus.isImgDown = true;
    KEStatus.modifyTarget = e.target;
});
document.body.addEventListener('mousemove',function(e){
    if(!KEStatus.isImgDown){
        return;
    }
    var setPosition = function(){
        modifyImg.style.left = KEStatus.modifyImg.offsetLeft+'px';
        modifyImg.style.top = KEStatus.modifyImg.offsetTop-kEMainContent.scrollTop+'px';
        modifyImg.style.width = KEStatus.modifyImg.clientWidth+'px';
        modifyImg.style.height = KEStatus.modifyImg.clientHeight+'px';
    };
    var x = modifyImg.style.width.substring(0,modifyImg.style.width.length-2);
    var y = modifyImg.style.height.substring(0,modifyImg.style.height.length-2);
    if(KEStatus.modifyTarget.getAttribute('id')=='modifyImg_lt'){
        KEStatus.modifyImg.style.width = x-e.movementX+'px';
        KEStatus.modifyImg.style.height = y-e.movementY+'px';
        setPosition();
    }
    else if(KEStatus.modifyTarget.getAttribute('id')=='modifyImg_mt'){
        KEStatus.modifyImg.style.width = x+'px';
        KEStatus.modifyImg.style.height = y-e.movementY+'px';
        setPosition();
    }
    else if(KEStatus.modifyTarget.getAttribute('id')=='modifyImg_rt'){
        KEStatus.modifyImg.style.width = x*1+e.movementX+'px';
        KEStatus.modifyImg.style.height = y-e.movementY+'px';
        setPosition();
    }
    else if(KEStatus.modifyTarget.getAttribute('id')=='modifyImg_lm'){
        KEStatus.modifyImg.style.width = x-e.movementX+'px';
        KEStatus.modifyImg.style.height = y+'px';
        setPosition();
    }
    else if(KEStatus.modifyTarget.getAttribute('id')=='modifyImg_rm'){
        KEStatus.modifyImg.style.width = x*1+e.movementX+'px';
        KEStatus.modifyImg.style.height = y+'px';
        setPosition();
    }
    else if(KEStatus.modifyTarget.getAttribute('id')=='modifyImg_lb'){
        KEStatus.modifyImg.style.width = x-e.movementX+'px';
        KEStatus.modifyImg.style.height = y*1+e.movementY+'px';
        setPosition();
    }
    else if(KEStatus.modifyTarget.getAttribute('id')=='modifyImg_mb'){
        KEStatus.modifyImg.style.width = x+'px';
        KEStatus.modifyImg.style.height = y*1+e.movementY+'px';
        setPosition();
    }
    else if(KEStatus.modifyTarget.getAttribute('id')=='modifyImg_rb'){
        KEStatus.modifyImg.style.width = x*1+e.movementX+'px';
        KEStatus.modifyImg.style.height = y*1+e.movementY+'px';
        setPosition();
    }
});
KEObject.kETool_down.onclick = function(){
    event.stopPropagation();
    event.preventDefault();
    var ele = KEObject.kETool_LHDown;
    if(ele.className=='kETool_LHDown'){
        ele.className = 'kETool_LHDown on';
    }else{
        ele.className = 'kETool_LHDown';
    }
};
KEObject.kETool_LHDown.addEventListener('click',function(e){
    e.stopPropagation();
    e.preventDefault();
    var tar = e.target;
    if(tar.className=='option'||tar.className=='option on'){
        if(!KEStatus.range){
            kEMain.focus();
            KEStatus.saveCusorPos();
        }
        var on = this.getElementsByClassName('on')[0];
        if(on){
            on.className = 'option';
        }
        tar.className = 'option on';
        this.className = 'kETool_LHDown';
        var em = tar.innerText;
        KEStatus.execCommand('LineHeight', em);
    }
});