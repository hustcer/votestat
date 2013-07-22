/*
 * Author: MJ
 * Date  : 2013/07/20
 * Desc  : A vote statistic tool for ps
*/
jQuery(function($){

    var validCouter = 19, validLimit = 100, totalRole = 211, histLimit = 9;
    var sto         = window.localStorage;
    var votesItem   = '__preVotes',
        votesBkItem = '__preVotes_bk',
        histItem    = '__votesHist';
    var fid  = null, lid = null, shiftdown = false;
    var msgs = {
        'support'      : '恭喜！您的浏览器可以正确支持该投票统计工具，可放心使用！',
        'noSupport'    : '很遗憾！您的浏览器缺乏一些特性，无法完全支持该统计工具，推荐您使用最新版本的Chrome浏览器！',
        'clearData'    : '警告：您确定要清空所有投票结果么？该操作将删除之前所有的统计数据，将其清零，之前所有的努力都付之一炬了，请三思啊！',
        'exportData'   : '请将以下数据导出结果复制出来，交给作者处理！',
        'exportOkay'   : '数据导出成功！请查看页面底部输出结果.',
        'revertAlert'  : '您确信要撤销前一次的统计数据么？',
        'revertOkay'   : '撤销前一次的统计数据成功!',
        'noRevertData' : '没有可以撤销的操作!',
        'aInvalid'     : 'A 区块选票数目不足' + validCouter + '票，该选票无效！',
        'bInvalid'     : 'B 区块选票数目不足' + validCouter + '票，该选票无效！',
        'invalid'      : '选票总数目超过' + validLimit + '票，该选票无效！',
        'success'      : '投票成功, 选票分别投给了：',
        'clearAll'     : '所有数据已被清空！',
        'clearCurr'    : '当前选票数据已被清空！',
        'ratioError'   : '放大系数输入非法，请输入大于等于1的整数！',
        'revertLabel'  : '撤销前一次统计',
        'noData'       : '无数据'
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
        },
        initHandler: function(){
            var addTdHandler = function($elem, cStr){
                $('td', $elem).not('td.empty').on({
                    'click': function(){
                        fid = lid;
                        lid = $(this).data('id');
                        $(this).toggleClass('selected');
                        if(shiftdown){
                            for (var i = fid; i < lid; i++) {
                                $('table.table td[data-id="' + i + '"]').toggleClass('selected', true);
                            }
                        }
                        var c  = $('td.selected', $elem).length;
                        $('td.' + cStr, $elem).text(c);
                        if(c >= validCouter){
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
            $('a.revert').on('click', function(){mo.revertAlert();});
            $('a.export').on('click', function(){mo.exportData();});
            $('a.clearall').on('click', function(){mo.clearAllAlert();});
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
        },
        loadData: function(){
            var prev = sto.getItem(votesItem);
            prev     = JSON.parse(prev);
            mo.updateData(prev);
        },
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
                ho             = hist.pop();
                prev.totalT   -= ho.totalT;
                prev.validT   -= ho.validT;
                prev.invalidT -= ho.invalidT;
                prev.totalV   -= ho.totalV;
                for (var i = 0, l = ho.data.length; i < l; i++) {
                    for (var j = 0, m = prev.data.length; j < m; j++) {
                        if(prev.data[j].key == ho.data[i].key){
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
            $('a.revert').text(msgs.revertLabel + '(' + hist.length + ')');
            mo.showMsg(msgs.revertOkay);
        },
        clearAllAlert: function(){
            mo.showMsg(msgs.clearData);
            $('#msgbox').append('<a href="javascript:;" class="clearallConfirm warning-btn">确认清除</a>');
            $('a.clearallConfirm').on('click', function(){mo.clearAll();});
        },
        clearAll: function(){
            sto.setItem(votesBkItem, sto.getItem(votesItem));
            sto.removeItem(votesItem);
            sto.removeItem(histItem);
            $('a.clearallConfirm').off('click');
            mo.updateData({'totalT':0,'validT':0,'invalidT':0,'totalV':0, 'data':mo.getInitData()});
            mo.showMsg(msgs.clearAll);
        },
        showMsg: function(msg){
            $('#msgbox').html(msg);
            $('#msgbox').hide().fadeIn();
        },
        getInitData: function(){
            var data = [];
            for (var i = 0; i <= totalRole; i++) {
                data.push({'key':i, 'val':0});
            }
            return data;
        },
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
                    'maxWidth'  : 400,
                    'minHeight' : 150
                });
            } else{
                mo.showMsg(msgs.ratioError);
            }
            return false;
        },
        submitVotes: function(){
            var valid = true,
                msg   = [],
                base  = +$('#zoom-ration').val();
                prev  = sto.getItem(votesItem),
                hist  = sto.getItem(histItem),
                dt    = mo.buildVoteData(),
                al    = $('table.atable td.selected').length,
                bl    = $('table.btable td.selected').length;

            if(al < validCouter){ msg.push(msgs.aInvalid); }
            if(bl < validCouter){ msg.push(msgs.bInvalid); }
            if(al + bl > validLimit){ msg.push(msgs.invalid); }
            if(msg.length > 0){
                valid = false;
                mo.showMsg(msg.join(','));
            }

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
                        if(prev.data[j].key == dt[i].key){
                            prev.data[j].val += 1*base;
                            break;
                        }
                    }
                }
                mo.showMsg(msgs.success + keys.join(','));
            }

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
            $('#zoom-ration').val('1');
            return false;
        },
        updateData: function(dt){
            var hist  = sto.getItem(histItem);
            if(hist == null){
                $('a.revert').text(msgs.revertLabel + '(0)');
            }else{
                hist = JSON.parse(hist)||[];
                $('a.revert').text(msgs.revertLabel + '(' + hist.length + ')');
            }

            if(dt == null){return;}
            $('#counter td.t-tickets').text(dt.totalT);
            $('#counter td.v-tickets').text(dt.validT);
            $('#counter td.i-tickets').text(dt.invalidT);
            $('#counter td.t-votes').text(dt.totalV);
            var d = dt.data, $cell, nzArr = [];
            for (var i = 0, l = d.length; i < l; i++) {
                $cell = $('table.table td[data-id="' + d[i].key + '"]');
                $cell.find('em').text('(' + d[i].val + ')');
                if(d[i].val > 0){
                    nzArr.push(d[i]);
                }
            }
            var sorted = nzArr.sort(function(a, b){
                return b.val - a.val;
            });
            var out = [];
            for (var i = 0, l = sorted.length; i < l; i++) {
                out.push(sorted[i].key + ':' + sorted[i].val + '票');
            }
            $('div.output h5').show();
            out.push('其它0票.');
            $('div.outcontent').text(out.join(','));

        },
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
                    // NOTICE:此处不能使用 "===" 替换 '==' 否则localStorage检测失败
                    result = storage.getItem(uid) == uid;
                    storage.removeItem(uid);
                    return result && storage;
              } catch(e) {}
        }())
    };

    mo.init();

});

