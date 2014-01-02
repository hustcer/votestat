/*
 * Author: MJ
 * Date  : 2013/07/20
 * Desc  : A vote statistic tool for ps
*/
jQuery(function($){

    var sto         = window.localStorage;
    var validCouter = 10,   // 各区块的最少有效票数
        validLimit  = 20,  // 总体有效票数
        totalRole   = 28,  // 总投票候选实体数
        rowCount    = 18,   // 每行记录数目
        histLimit   = 12;   // 历史记录数目
    var votesItem   = '__preVotes',     // 选票统计信息存储对应的key
        votesBkItem = '__preVotes_bk',
        histItem    = '__votesHist';    // 选票统计历史存储对应的key

    var fid       = null,       // 选中的前一个id
        lid       = null,       // 选中的后一个id
        altdown   = false,      // 是否按下 alt key
        shiftdown = false;      // 是否按下 shift key

    var msgs = {
        'support'        : '恭喜！您的浏览器可以正确支持该投票统计工具，可放心使用！',
        'noSupport'      : '很遗憾！您的浏览器缺乏一些特性，无法完全支持该统计工具，推荐您使用最新版本的Chrome浏览器！',
        'clearData'      : '警告：您确定要清空所有投票结果么？该操作将删除之前所有的统计数据，将其清零，之前所有的努力都付之一炬了，请三思啊！',
        'exportData'     : '请将以下数据导出结果复制出来，交给作者处理！',
        'exportOkay'     : '数据导出成功！请查看页面底部输出结果.',
        'revertAlert'    : '您确信要撤销前一次的统计数据么？',
        'revertOkay'     : '撤销前一次的统计数据成功!',
        'noRevertData'   : '没有可以撤销的操作!',
        'aInvalid'       : 'A 区块选票数目超过' + validCouter + '票，该选票无效！',
        'bInvalid'       : 'B 区块选票数目超过' + validCouter + '票，该选票无效！',
        'invalid'        : '选票总数目超过' + validLimit + '票，该选票无效！',
        'success'        : '投票成功, 选票分别投给了：',
        'clearAll'       : '所有数据已被清空！',
        'clearCurr'      : '当前选票数据已被清空！',
        'ratioError'     : '放大系数输入非法，请输入大于等于1的整数！',
        'revertLabel'    : '撤销前一次统计',
        'noDataToMerge'  : '没有可供合并的数据',
        'noDataToImport' : '没有可供导入的数据',
        'importSuccess'  : '数据导入成功!',
        'mergeSuccess'   : '数据合并成功!',
        'dataFormatErr'  : '数据格式错误!',
        'noData'         : '无数据'
    };

    var mo = {
        init: function(){
            if(this.supportLocalStorage){
                mo.showMsg(msgs.support);
            }else{
                mo.showMsg(msgs.noSupport);
            }
            mo.initHandler();
            mo.loadData();
            // 显示放大系数功能
            if(window.location.hash !== '#zoom'){
                $('div.zoom-div').hide();
            }
            // 显示数据合并功能
            if(window.location.hash !== '#merge'){
                $('div.oparea a.merge').hide();
            }
            // 显示数据导入功能
            if(window.location.hash !== '#import'){
                $('div.oparea a.import').hide();
            }
        },
        initHandler: function(){
            var addTdHandler = function($elem, cStr){
                $('td', $elem).not('td.empty').on({
                    'click': function(){
                        fid = lid;
                        lid = $(this).data('id');
                        $(this).toggleClass('selected');
                        // 按下shift后可以连续多选
                        if(shiftdown){
                            for (var i = fid; i < lid; i++) {
                                $('table.table td[data-id="' + i + '"]').toggleClass('selected', true);
                            }
                        }else if(altdown && (fid < lid)){
                            for (var m = fid; m < lid; m += rowCount) {
                                $('table.table td[data-id="' + m + '"]').toggleClass('selected', true);
                            }
                        }
                        var c  = $('td.selected', $elem).length;
                        // 更新选中记录总数
                        $('td.' + cStr, $elem).text(c);
                        if(c <= validCouter){
                            $('td.' + cStr, $elem).toggleClass('valid', true);
                        }else{
                            $('td.' + cStr, $elem).toggleClass('valid', false);
                        }
                    }
                });
            };
            addTdHandler($('table.atable'), 'acounter');
            addTdHandler($('table.btable'), 'bcounter');
            $('a.help').on('click', function(){mo.showHelp();});
            $('a.okay').on('click', function(){mo.checkBeforeSubmit();});
            // $('a.okay').on('click', function(){mo.submitVotes();});
            $('a.clear').on('click', function(){mo.clearCurrent();});
            $('a.merge').on('click', function(){mo.showMerge();});
            $('a.import').on('click', function(){mo.showImport();});
            $('a.export').on('click', function(){mo.exportData();});
            $('a.revert').on('click', function(){mo.revertAlert();});
            $('a.clearall').on('click', function(){mo.clearAllAlert();});
            $('a.merge-confirm').on('click', function(){mo.mergeData();});
            $('a.import-confirm').on('click', function(){mo.importData();});
            $('a.viewResult').on('click', function(){
                mo.loadData();
                window.location.hash = '';
                window.location.hash = 'output';
                $('div.outcontent').hide().fadeIn();
            });

            Mousetrap.bind(['shift' ], function() {
                shiftdown = true;
            }, 'keypress');

            Mousetrap.bind(['shift' ], function() {
                shiftdown = false;
            }, 'keyup');

            Mousetrap.bind(['alt', 'ctrl'], function() {
                altdown = true;
            }, 'keypress');

            Mousetrap.bind(['alt', 'ctrl'], function() {
                altdown = false;
            }, 'keyup');
        },
        /**
         * 加载数据刷新结果
         */
        loadData: function(){
            var prev = sto.getItem(votesItem);
            prev     = JSON.parse(prev);
            mo.updateData(prev);
        },
        showImport: function(){
            $('h3, table','div.content').hide();
            $('div.input-div').fadeIn();
            $('a.import-confirm').show();
        },
        /**
         * 数据导入替换
         */
        importData: function(){
            var v = $.trim($('#data-area').val()), d;
            if(!v){
                mo.showMsg(msgs.noDataToImport);
                return;
            }

            try{
                d = JSON.parse(v);
            }catch(e){
                mo.showMsg(msgs.dataFormatErr);
                return;
            }
            mo.showMsg(msgs.importSuccess);
            sto.setItem(votesItem, JSON.stringify(d));
            mo.updateData(d);
        },
        showMerge: function(){
            $('h3, table','div.content').hide();
            $('div.input-div').fadeIn();
            $('a.merge-confirm').show();
        },
        /**
         * 数据合并累加
         */
        mergeData: function(){
            var v = $.trim($('#data-area').val()), d;
            if(!v){
                mo.showMsg(msgs.noDataToMerge);
                return;
            }

            try{
                d = JSON.parse(v);
            }catch(e){
                mo.showMsg(msgs.dataFormatErr);
                return;
            }

            var prev = sto.getItem(votesItem);
            prev     = JSON.parse(prev);

            if(prev == null){
                mo.showMsg(msgs.mergeSuccess);
                sto.setItem(votesItem, JSON.stringify(d));
                mo.updateData(d);
                return;
            }

            if(!!prev && !!d){
                prev.totalT   += d.totalT;
                prev.validT   += d.validT;
                prev.invalidT += d.invalidT;
                prev.totalV   += d.totalV;
                for (var i = 0, l = d.data.length; i < l; i++) {
                    for (var j = 0, m = prev.data.length; j < m; j++) {
                        if(prev.data[j].key === d.data[i].key){
                            prev.data[j].val += d.data[i].val;
                            break;
                        }
                    }
                }
                sto.setItem(votesItem, JSON.stringify(prev));
                mo.updateData(prev);
            }
        },
        /**
         * 导出数据
         */
        exportData: function(){
            var prev = sto.getItem(votesItem);
            mo.showMsg(msgs.exportOkay);
            $('div.output h5').hide();
            if(prev == null){
                $('div.outcontent').html(msgs.noData);
            }else{
                $('div.outcontent').html(msgs.exportData + '<br/><br/>' + prev);
            }
            window.location.hash = '';
            window.location.hash = 'output';
            $('div.outcontent').hide().fadeIn();
        },
        showHelp: function(){
            window.location.hash = '';
            window.location.hash = 'help';
            $('div.help').hide().fadeIn();
        },
        clearCurrent: function(){
            $('table.atable td, table.btable td').removeClass('selected');
            $('table td.count').text(0).removeClass('valid');
        },
        revertAlert: function(){
            mo.showMsg(msgs.revertAlert);
            $('#msgbox').append('<a href="javascript:;" class="revertConfirm warning-btn">确认撤销</a>');
            $('a.revertConfirm').on('click', function(){mo.revertOne();});
        },
        /**
         * 撤销一次统计操作
         */
        revertOne: function(){
            $('a.revertConfirm').off('click');
            var prev = sto.getItem(votesItem),
                hist = sto.getItem(histItem);

            if(prev == null|| hist == null){
                mo.showMsg(msgs.noRevertData);
                return;
            }
            prev    = JSON.parse(prev);
            hist    = JSON.parse(hist)||[];
            if(hist.length > 0){
                var ho         = hist.pop();
                prev.totalT   -= ho.totalT;
                prev.validT   -= ho.validT;
                prev.invalidT -= ho.invalidT;
                prev.totalV   -= ho.totalV;
                for (var i = 0, l = ho.data.length; i < l; i++) {
                    for (var j = 0, m = prev.data.length; j < m; j++) {
                        if(prev.data[j].key === ho.data[i].key){
                            if(ho.base){
                                prev.data[j].val -= 1*ho.base;
                            }else{
                                prev.data[j].val --;
                            }
                            break;
                        }
                    }
                }
                sto.setItem(histItem, JSON.stringify(hist));
                sto.setItem(votesItem, JSON.stringify(prev));
                mo.updateData(prev);
            }else{
                mo.showMsg(msgs.noRevertData);
                return;
            }
            // 更新剩余还可以撤销的统计次数
            $('a.revert').text(msgs.revertLabel + '(' + hist.length + ')');
            mo.showMsg(msgs.revertOkay);
        },
        clearAllAlert: function(){
            mo.showMsg(msgs.clearData);
            $('#msgbox').append('<a href="javascript:;" class="clearallConfirm warning-btn">确认清除</a>');
            $('a.clearallConfirm').on('click', function(){mo.clearAll();});
        },
        /**
         * 清除统计结果及历史记录
         */
        clearAll: function(){
            sto.setItem(votesBkItem, sto.getItem(votesItem));
            sto.removeItem(votesItem);
            sto.removeItem(histItem);
            $('a.clearallConfirm').off('click');
            mo.updateData({'totalT':0,'validT':0,'invalidT':0,'totalV':0, 'data':mo.getInitData()});
            mo.showMsg(msgs.clearAll);
        },
        /**
         * 显示特定统计信息
         */
        showMsg: function(msg){
            $('#msgbox').html(msg);
            $('#msgbox').hide().fadeIn();
        },
        /**
         * 初始化初始数据
         */
        getInitData: function(){
            var data = [];
            for (var i = 0; i <= totalRole; i++) {
                data.push({'key':i, 'val':0});
            }
            return data;
        },
        /**
         * 如果放大倍数为1则直接提交数据，大于1则需要用户确认之后再提交
         */
        checkBeforeSubmit: function(){
            var ratio = +$('#zoom-ration').val();
            if(ratio === 1){
                mo.submitVotes();

            } else if(ratio > 1){
                $('#zoom-confirm em').text(ratio);
                $('#pop-cancel').off('click');
                $('#pop-confirm').off('click');
                $('#pop-cancel').on('click', function(){$.modal.close();});
                $('#pop-confirm').on('click', function(){
                    $.modal.close();
                    mo.submitVotes();
                    return false;
                });
                $.modal($('#zoom-confirm'), {
                    // 此配置项不可少否则表单数据加载会出现问题
                    'persist'   : true,
                    'maxWidth'  : 420,
                    'minHeight' : 160
                });
            } else{
                mo.showMsg(msgs.ratioError);
            }
            return false;
        },
        /**
         * 提交投票，统计投票，更新历史记录，刷新结果等
         */
        submitVotes: function(){
            var valid = true,
                msg   = [],
                base  = +$('#zoom-ration').val(),
                prev  = sto.getItem(votesItem),
                hist  = sto.getItem(histItem),
                dt    = mo.buildVoteData(),
                al    = $('table.atable td.selected').length,
                bl    = $('table.btable td.selected').length;

            if(al > validCouter){ msg.push(msgs.aInvalid); }
            if(bl > validCouter){ msg.push(msgs.bInvalid); }
            if(al + bl > validLimit){ msg.push(msgs.invalid); }
            if(msg.length > 0){
                valid = false;
                mo.showMsg(msg.join(','));
            }

            // 更新统计结果
            var vc   = valid ? 1*base : 0, ic = valid ? 0 : 1*base;
            var tt   = valid ? dt.length * base : 0;
            if(prev == null){
                prev = {'totalT':1*base,'validT':vc,'invalidT':ic,'totalV':tt,'base':base,'data':mo.getInitData()};
            }else{
                prev = JSON.parse(prev);
                prev.totalT   += 1*base;
                prev.validT   += vc;
                prev.invalidT += ic;
                prev.totalV   += tt;
            }
            if(valid){
                var keys = [];
                for (var i = 0, l = dt.length; i < l; i++) {
                    keys.push(dt[i].key);
                    for (var j = 0, m = prev.data.length; j < m; j++) {
                        if(prev.data[j].key === dt[i].key){
                            prev.data[j].val += 1*base;
                            break;
                        }
                    }
                }
                mo.showMsg(msgs.success + keys.join(','));
            }

            // 更新历史记录
            hist = JSON.parse(hist)||[];
            if(hist.length >= histLimit){
                hist.shift();
            }
            if(valid){
                hist.push({'totalT':1*base,'validT':vc,'invalidT':ic,'totalV':tt,'base':base,'data':dt});
            }else{
                hist.push({'totalT':1*base,'validT':vc,'invalidT':ic,'totalV':tt,'base':base,'data':[]});
            }
            $('a.revert').text(msgs.revertLabel + '(' + hist.length + ')');

            sto.setItem(histItem, JSON.stringify(hist));
            sto.setItem(votesItem, JSON.stringify(prev));
            mo.updateData(prev);
            mo.clearCurrent();
            // 提交完成后将放大倍数改成默认值
            $('#zoom-ration').val('1');
            return false;
        },
        /**
         * 刷新投票结果
         */
        updateData: function(dt, showTable, showAll){
            showTable  = false;
            showAll    = false;
            var sorted = null;
            var out    = [];
            var hist   = sto.getItem(histItem);

            if(hist == null){
                $('a.revert').text(msgs.revertLabel + '(0)');
            }else{
                hist = JSON.parse(hist)||[];
                $('a.revert').text(msgs.revertLabel + '(' + hist.length + ')');
            }

            if(dt == null){return;}
            $('#counter td.t-votes').text(dt.totalV);
            $('#counter td.t-tickets').text(dt.totalT);
            $('#counter td.v-tickets').text(dt.validT);
            $('#counter td.i-tickets').text(dt.invalidT);
            var d = dt.data, $cell, nzArr = [];
            for (var i = 0, l = d.length; i < l; i++) {
                $cell = $('table.table td[data-id="' + d[i].key + '"]');
                $cell.find('em').text('(' + d[i].val + ')');
                if(d[i].val > 0){
                    nzArr.push(d[i]);
                }
            }

            if(showAll){
                sorted = dt.data;
            }else{
                sorted = nzArr.sort(function(a, b){
                    return b.val - a.val;
                });
            }

            for (var m = 0, len = sorted.length; m < len; m++) {
                if(showTable){
                    out[m] = '<tr><th>' + sorted[m].key + '</th><td>' + sorted[m].val + '</td></tr>';
                }else{
                    out[m] = sorted[m].key + ':' + sorted[m].val + '票';
                }
            }
            $('div.output h5').show();
            if(showTable){
                $('div.outcontent').html('<table><th>编号</th><td>票数</td>' + out.join('') + '</table>');
            }else{
                out.push('其它0票.');
                $('div.outcontent').html(out.join(','));
            }
        },
        /**
         * 构建选中的投票数据
         */
        buildVoteData: function(){
            var data = [];
            var $selected = $('table.table td.selected');
            $selected.each(function(idx, elem){
                var id = $(elem).data('id');
                data.push({'key':id, 'val':1});
            });
            return data;
        },
        supportLocalStorage: (function() {
              var uid = new Date(), storage, result;
              try {
                    (storage = window.localStorage).setItem(uid, uid);
                    result = storage.getItem(uid).toString() === uid.toString();
                    storage.removeItem(uid);
                    return !!(result && storage);
              } catch(e) {}
        }())
    };

    mo.init();

});

