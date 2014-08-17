
var templateCache = new Array();
function getTemplate(path, callback){
    if(path in templateCache){
        callback(templateCache[path]);
    }
    else {
        $.get(path, function(template){
            templateCache[path] = template;
            callback(template);
        });
    }
}

var plotlist = new Array();
var staggerSizeKB = 1024;
var totalKB = 256*1024*1024;

function start() {
    var plot0 = {
        nonceCount : 1048576,
        nonceStart : 0
    };
    plotlist.push(plot0);
}

function addplot() {
    getTemplate('templates/plotitem.template', function(template){
        var plotId = plotlist.length;
        var plotIdStr = plotId;
        if(plotId < 10) {
            plotIdStr = '0'+plotId;
        }
        plotIdStr = '#'+plotIdStr;
        var plotStart = plotlist[plotlist.length-1].nonceStart + plotlist[plotlist.length-1].nonceCount + 1;
        var html = Mustache.render(template, {
            PLOT_ID:plotId
        });
        var plotItem = $('#plotitem_container').append($(html));
        $('#PlotStartValue_'+plotId).val(plotStart);
        $('#PlotItemLabel_'+plotId).html(plotIdStr);
        var plotData = {
            nonceCount : 1048576,
            nonceStart : plotStart
        };
        plotlist.push(plotData);
    });
}

function onStaggerUnitChanged() {
    var unit = $('#select_staggersize_unit').val();
    if(unit == 'KB'){
        $('#staggerSizeValue').val(staggerSizeKB);
    }
    else {
        $('#staggerSizeValue').val(staggerSizeKB/1024);
    }
}

function onStaggerValueChanged() {
    var value = $('#staggerSizeValue').val();
    var unit = $('#select_staggersize_unit').val();

    if(unit == 'MB') {
        value = value * 1024;
    }

    if(value < 256) {
        value = 256;
    } else if( value >= 8192) {
        value = 8191;
    }
    staggerSizeKB = value;

    if(unit == 'MB') {
        $('#staggerSizeValue').val(staggerSizeKB/1024);
    }
    else {
        $('#staggerSizeValue').val(staggerSizeKB);
    }
}

function onPlotUnitChanged(id){
    var unitType = $('#PlotSizeType_'+id).val();
    var nonceCount = plotlist[parseInt(id)].nonceCount;
    if(unitType == 'nonce') {
        $('#PlotSizeUnit_'+id).hide();
        $('#PlotSizeValue_'+id).val(nonceCount);
    } else {
        $('#PlotSizeUnit_'+id).show();
        onPlotSizeUnitChanged(id);
    }
}

function onPlotSizeUnitChanged(id) {
    var nonceCount = plotlist[parseInt(id)].nonceCount;
    var byteUnit = $('#PlotSizeUnit_'+id).val();
    if(byteUnit == 'KB') {
        $('#PlotSizeValue_'+id).val(nonceCount*256);
    } else if (byteUnit == 'MB') {
        $('#PlotSizeValue_'+id).val(nonceCount*256/1024);
    }
    else if (byteUnit == 'GB') {
        $('#PlotSizeValue_'+id).val(nonceCount*256/(1024*1024));
    }
    else if (byteUnit == 'TB') {
        $('#PlotSizeValue_'+id).val(nonceCount*256/(1024*1024*1024));
    }
}

$("#fieldName").prop("readonly",true);