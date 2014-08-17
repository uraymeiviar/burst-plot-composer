
var templateCache = [];
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

var plotlist = [];
var staggerSizeKB = 1024;
var totalKB = 256*1024*1024;
var javaVM = 768;

function start() {
    var plot0 = {
        nonceCount : 1048576,
        nonceStart : 0,
        nonceAligned : false,
        enabled : true
    };
    plotlist.push(plot0);
}

function updateTotalKB(){
    totalKB = 0;
    for(var i=0 ; i<plotlist.length ; i++){
        if( plotlist[i].enabled === true) {
            totalKB += plotlist[i].nonceCount*256;
        }
    }
    var totalSizeUnit = $('#select_totalsize_unit').val();
    var totalSize = 0;
    if(totalSizeUnit == 'GB') {
        totalSize = totalKB / (1024*1024);
    }
    else if(totalSizeUnit == 'MB') {
        totalSize = totalKB / 1024;
    }
    else if(totalSizeUnit == 'TB') {
        totalSize = totalKB / (1024 * 1024 * 1024);
    }
    else {
        totalSize = totalKB / 256;
    }
    $('#totalSize').html(totalSize.toFixed(2));
}

function onTotalSizeUnitChanged() {
    updateTotalKB();
}

function addplot() {
    var plotId = plotlist.length;
    getTemplate('templates/plotitem.template', function(template){
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
        $('#PlotStartValueAligned_'+plotId).html(plotStart);
        $('#PlotItemLabel_'+plotId).html(plotIdStr);
        var plotData = {
            nonceCount : 1048576,
            nonceStart : plotStart,
            nonceAligned : true,
            enabled : true
        };
        plotlist.push(plotData);
        updateTotalKB();
    });

    getTemplate('templates/plotcmd.template', function(template){
        var html = Mustache.render(template, {
            PLOT_ID:plotId
        });
        $('#plotcmd_container').append($(html));
        updatePlotCmd();
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

    updatePlotCmd();
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
    else {
        $('#PlotSizeValue_'+id).val(nonceCount);
    }
}

function onNonceAlignChange(id) {
    var switchBtn = $('#alignSwitch_'+id);
    if(switchBtn.is(':checked')) {
        $("#PlotStartValue_"+id).hide();
        $("#PlotStartValueAligned_"+id).show();
        plotlist[id].nonceAligned = true;
        updateStartNonceFrom(id);
    }
    else {
        $("#PlotStartValue_"+id).show();
        $("#PlotStartValueAligned_"+id).hide();
        plotlist[id].nonceAligned = false;
    }
}

function onStartNonceChanged(id){
    var val = parseInt($('#PlotStartValue_'+id).val(),10);
    if(isNaN(val)) {
        val = 0;
    }
    plotlist[id].nonceStart = val;
    updateStartNonceFrom(id);
}

function updateStartNonceFrom(id) {
    var prevStart = plotlist[id].nonceStart;
    var prevCount = plotlist[id].nonceCount;
    for(var i=id+1 ; i<plotlist.length ; i++) {
        if(plotlist[i].enabled === true) {
            if(plotlist[i].nonceAligned === true) {
                plotlist[i].nonceStart = prevStart + prevCount + 1;
                prevStart = plotlist[i].nonceStart;
                prevCount = plotlist[i].nonceCount;
                $('#PlotStartValue_'+i).val(plotlist[i].nonceStart);
                $('#PlotStartValueAligned_'+i).html(plotlist[i].nonceStart);
            }
            else break;
        }
    }
    updatePlotCmd();
}

function onPlotSizeChanged(id) {
    var plotUnit = $('#PlotSizeUnit_'+id).val();
    var plotSize = parseInt($('#PlotSizeValue_'+id).val(), 10);
    if(isNaN(plotSize)) {
        plotSize = 0;
    }
    var plotNonceSize = plotSize;
    if(plotUnit == 'KB') {
        plotNonceSize = parseInt(plotSize / 256, 10);
    } 
    else if (plotUnit == 'MB') {
        plotNonceSize = plotSize * 4;
    }
    else if (plotUnit == 'GB') {
        plotNonceSize = plotSize * 4 * 1024;
    }
    else if (plotUnit == 'TB') {
        plotNonceSize = plotSize * 4 * 1024 * 1024;
    }
    else {
        plotNonceSize = plotSize;
    }
    
    plotlist[id].nonceCount = plotNonceSize;
    updateStartNonceFrom(id);
    updateTotalKB();
    updatePlotCmd();
}

function deletePlot(id){
    plotlist[id].enabled = false;
    $('#Plot_'+id).remove();
    $('#plotcmd_'+id).remove();
    updateStartNonceFrom(id-1);
    updateTotalKB();
    updatePlotCmd();
}

function onThreadCountChange() {
    var value = parseInt($('#threadCount').val(),10);
    if(isNaN(value)){
        value = 0;
    }
    for(var i=0 ; i<plotlist.length ; i++){
        if(plotlist[i].enabled === true) {
            var element = $('#plotcmd-threads_'+i);
            if(element.length > 0){
                element.html(value);
            }
        }
    }
}

function onJVMChange() {
    var value = parseInt($('#jvmSize').val(),10);
    if(isNaN(value)){
        value = 0;
    }
    for(var i=0 ; i<plotlist.length ; i++){
        if(plotlist[i].enabled === true) {
            var element = $('#plotcmd-jvm_'+i);
            if(element.length > 0){
                element.html(value);
            }
        }
    }
}

function updatePlotCmd(){
    var jvmValue = parseInt($('#jvmSize').val(),10);
    if(isNaN(jvmValue)){
        jvmValue = 0;
    }

    var threadValue = parseInt($('#threadCount').val(),10);
    if(isNaN(threadValue)){
        threadValue = 0;
    }

    var accountNum = $('#accountNumber').val();

    for(var i=0 ; i<plotlist.length ; i++){
        if(plotlist[i].enabled === true) {
            var element = $('#plotcmd-jvm_'+i);
            if(element.length > 0){
                element.html(jvmValue);
            }

            element = $('#plotcmd-threads_'+i);
            if(element.length > 0){
                element.html(threadValue);
            }

            element = $('#plotcmd-account_'+i);
            if(element.length > 0){
                element.html(accountNum);
            }

            element = $('#plotcmd-stagsize_'+i);
            if(element.length > 0){
                element.html(staggerSizeKB);
            }

            element = $('#plotcmd-startnonce_'+i);
            if(element.length > 0){
                element.html(plotlist[i].nonceStart);
            }

            element = $('#plotcmd-noncecount_'+i);
            if(element.length > 0){
                element.html(plotlist[i].nonceCount);
            }
        }
    }
}