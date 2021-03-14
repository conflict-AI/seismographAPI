
// Global variables
var mapSVG; 
var svgInit = false;
var svgLoaded = false;
var conflictWorldMap; // For svg-world-map.js
var svgPanZoom; // For svg-pan-zoom.js
var conflictData = {}; // Empty object for conflict data
var predictionData = {}; // Empty object for prediction data
var shapleyData = {}; // Empty object for shapley data
var colorData; 
//var dayData = {}; // Empty object for all days complete data 
var timeData = []; // Empty array for time controls
var detailcountry = 'World'; // 'World'
var detailprovince = false; 
var smallScreen = false; 
var isMobile = false; 
var day = 0;

// Startup 
checkSize();
checkMobile();
loadConflictData();
initStartup();
initCharts();

// Wait untill everything is fully loaded
function initStartup() {

    //countryData = 1; // TODO: Remove this line(= set to undefined) when implementing countryData!
    timeData = [ 0, 1 ]; // TODO: Remove this line(= set to empty object) when implementing countryData!

    var waitcounter = 0;
    var startuptimer = window.setInterval(function() {
        waitcounter++
        /*
        console.log(svgInit);
        console.log(svgLoaded);
        console.log(countryData);
        console.log(conflictData);
        console.log(timeData.length);
        console.log("------------");
        */
        if (waitcounter > 20) { // Wait 20 * 500ms = 10s for data answer
            window.clearInterval(startuptimer);
            document.getElementById('loading').innerHTML = '~~~ There seems to be a problem ~~~<br><br>Please try a <a href="javascript:location.reload()">relaod</a>';
        } else if (conflictData == undefined) {
            document.getElementById('loading').innerHTML = '~~~ Loading Data ~~~'; //'~~~ Loading Conflict Data ~~~'
        } else if (svgInit == false && svgLoaded == false && colorData != undefined && conflictData != undefined && timeData.length > 1) {
            document.getElementById('loading').innerHTML = '~~~ Loading Map ~~~'; //'~~~ Loading SVG Map ~~~'
            loadSVGMap();
            svgInit = true;
        // TODO: Remove timeData globally with conflictData?
        } else if (svgLoaded == true && colorData != undefined && conflictData != undefined && timeData.length > 1 && document.getElementById('map-slider') != null) {
            window.clearInterval(startuptimer);
            document.getElementById('loading').innerHTML = '~~~ All Data Loaded ~~~';
            initSVGMap();
        }
    }, 500);
}

// Load SVG World Map
async function loadSVGMap() {
    // Custom options
    var options = { 
        //libPath: '//conflict-ai.org/map/src/', // Point to /src-folder 
        bigMap: false, // Use small map
        showOcean: false, // Show or hide ocean layer
        showAntarctica: false, // Show or hide antarctic layer
        showLabels: true, // Show country labels
        showInfoBox: true, // Show info box
        worldColor: '#EFEFEF', 
        labelFill: { out: '#666666',  over: '#444444',  click: '#444444' }, 
        //countryStroke: { out: '#999999',  over: '#999999',  click: '#999999' }, 
        //provinceFill: { out: '#FFFFFF',  over: '#FFFFFF',  click: '#999999' }, 
        provinceStroke: { out: '#CCCCCC',  over: '#999999',  click: '#999999' }, 
        provinceStrokeWidth: { out: '0.3',  over: '0.3',  click: '0.5' }, 
        timeControls: true, // Time data to activate time antimation controls
        timePause: true, // Set pause to false for autostart
        timeLoop: false // Loop time animation
    };
    // Startup SVG World Map
    //myWorldMap = await svgWorldMap(options, false);
    //conflictWorldMap = await svgWorldMap(params, countryData, timeData);
    conflictWorldMap = await svgWorldMap(options, false, colorData);
    mapSVG = conflictWorldMap.worldMap;
    svgLoaded = true;
}

// SVG map start
function initSVGMap() {
    if (svgLoaded == true && timeData.length > 1) { // TODO: Remove timeData and replace globally with conflictData or colorData?
        // Change start day
        document.getElementById('map-slider').value = Object.keys(conflictData).length - 12; // Start 12 months ago
        document.getElementById('map-slider').oninput();
        document.getElementById('map-control-play-pause').click();
        // Build country list 
        initCountryList();
        // Init svgPanZoom library
        svgPanZoom = svgPanZoom(mapSVG, { minZoom: 1, dblClickZoomEnabled: false });  //controlIconsEnabled: true, beforePan: beforePan
        if (smallScreen == false) {
            svgPanZoom.pan({ x: -90, y: 0 }); // Set map to better start position for big horizontal screens
        } else if (smallScreen == 'portrait') {
            svgPanZoom.pan({ x: -5, y: 170 }); // Set map to better start position for small vertical screens
            svgPanZoom.zoomBy(1.4); // Zoom in for small screens
        } else if (smallScreen == 'landscape') {
            svgPanZoom.pan({ x: -5, y: 20 }); // Set map to better start position for small horizontal screens
            svgPanZoom.zoomBy(1.1); // Zoom in for small screens
        }
        // Hide loading and show boxes and map after startup
        toggleBox('loading');
        toggleBox('settings');
        toggleBox('conflicts');
        if (smallScreen != 'landscape') {
            toggleBox('details'); 
        }
        if (smallScreen == false) {
            toggleBox('countries');
        }
        // Fadein with opacity 
        document.getElementById('details').style.visibility = 'visible';
        document.getElementById('settings').style.visibility = 'visible';
        document.getElementById('countries').style.visibility = 'visible';
        document.getElementById('conflicts').style.visibility = 'visible';
        document.getElementById('svg-world-map-container').style.visibility = 'visible';
        setTimeout(function() {
            document.getElementById('details').style.opacity = 1;
            document.getElementById('settings').style.opacity = 1;
            document.getElementById('countries').style.opacity = 1;
            document.getElementById('conflicts').style.opacity = 1;
            document.getElementById('svg-world-map-container').style.opacity = 1;
        }, 200);
    }
}

// Callback function from the time control module, defined in 'options.mapDate'
function mapDate(updateDate) {
    day = updateDate;
    updateDetails();
    // Update day date info
    var daydate = new Date(document.getElementById('map-date').innerHTML).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    //if (daydate[1] != 'May') { daydate[1] = daydate[1] + '.' }
    document.getElementById('map-date').innerHTML = daydate;
}

// Wait for JSON load and pass data to library 
function loadConflictData() {
   loadShapleyData('World');
    var conflictJson = "data/conflict_gt.json";
    loadFile(conflictJson, function(conflictResponse) {
        conflictData = JSON.parse(conflictResponse); 
        initColorData();
        var predictionJson = "data/conflict_pred.json";
        loadFile(predictionJson, function(predictionResponse) {
            predictionData = JSON.parse(predictionResponse);
            initConflictData();
        });
    });
}

// Wait for JSON load and pass data to shapley chart 
function loadShapleyData() {
    //console.log(detailcountry);
    if (shapleyData[detailcountry] == undefined) {
        var shapleyJson = "data/" + detailcountry + ".json";
        //console.log(shapleyJson);
        loadFile(shapleyJson, function(shapleyResponse) {
            //console.log(shapleyResponse);
            shapleyData[detailcountry] = JSON.parse(shapleyResponse); 
            updateDetails();
        });
    } else {
        //console.log('yoli... :)');
        updateDetails();
    }
}

// Sort conflict data for map countries
function initColorData() {
    colorData = JSON.parse(JSON.stringify(conflictData)); // Copy conflict object 
    for (var date in conflictData) {
        for (var country in conflictData[date]) {
            var value = conflictData[date][country] * 255;
            var rgb = 'rgb(255,' + (255-value) + ',' + (255-value) + ')';
            colorData[date][country] = rgb;
        }
    }
}

// Sort conflict data for conflict chart
// Format: ground data, prediction
function initConflictData() {
    chartconflict.data.labels = Object.keys(conflictData);
    //chartcountry.data.labels = Object.keys(conflictData);
    for (var date in conflictData) {
        for (var country in conflictData[date]) {
            if (country == 'World') {
               chartconflict.data.datasets[0].data.push(predictionData[date][country]);
               chartconflict.data.datasets[1].data.push(conflictData[date][country]);
               //chartcountry.data.datasets[0].data.push(predictionData[date][country]);
               //chartcountry.data.datasets[1].data.push(conflictData[date][country]);
            }
        }
    }
    chartconflict.update();
    //chartcountry.update();
}

// Update details
function updateDetails() {
    var date = Object.keys(conflictData)[day];
    // Set vertical line
    chartconflict.data.lineAtIndex = day;
    chartconflict.update();
    //chartcountry.data.lineAtIndex = day;
    //chartcountry.update();
    // Update info
    if (detailcountry == 'World') {
        document.getElementById('countrytitle').innerHTML =  'World';
        document.getElementById('countrytitlebottom').innerHTML =  'World';
        document.getElementById('countrytitleinfo').innerHTML =  '(click a country for details)';
    } else {
        document.getElementById('countrytitle').innerHTML = conflictWorldMap.countries[detailcountry].name;
        document.getElementById('countrytitlebottom').innerHTML = conflictWorldMap.countries[detailcountry].name;
        document.getElementById('countrytitleinfo').innerHTML =  '(<a onclick="console.log(\'yoli?\');mapClick(\'World\')">back to global view</a>)';
    }
    if (predictionData[date] != undefined) {
        document.getElementById('countryinfo').innerHTML = 'Date: ' + date + '<br>Predicted: ' + predictionData[date][detailcountry] + '<br>Ground Truth: ' + conflictData[date][detailcountry];
    }
    if (shapleyData[detailcountry][date] != undefined) {
        var pull = Object.entries(shapleyData[detailcountry][date].pull);
        var push = Object.entries(shapleyData[detailcountry][date].push);
        var ppinfo = '<table><tr><th colspan=2>Pull factors</th></tr>';
        for (var i=0; i<5; i++) {
            ppinfo += '<tr><td>' + pull[i][1] + '</td><td>' + pull[i][0] + '</td></tr>';
        }
        ppinfo += '</table>';
        ppinfo += '<table><tr><th colspan=2>Push factors</th></tr>';
        for (var i=0; i<5; i++) {
            ppinfo += '<tr><td>' + push[i][1] + '</td><td>' + push[i][0] + '</td></tr>';
        }
        ppinfo += '</table>';
        document.getElementById('pushpullinfo').innerHTML = ppinfo;
        // Update charts
        updateCharts();
    }
    // Update country list
    updateCountryList();
}

// Update charts for world and selected country
// Format: [0] = pull, [1] = push
function updateCharts() {
    var date = Object.keys(conflictData)[day];
    // Shapley chart
    /*//var labeltext = { labels: { title: { color: 'green', text: '123' }, value: { text: '123' } } };
    var labeltext = { labels: { title: { color: 'green', text: '123' }, value: { text: '123' } } };
    /*Object.keys(shapleyData[detailcountry][date].pull).forEach(function() {

    });
    console.log(labeltext);
    chartpushpull.data.datasets[0].datalabels = labeltext;
    console.log(chartpushpull.data.datasets[0].datalabels);
    console.log(chartpushpull);*/
    chartpushpull.data.datasets[0].labels = Object.keys(shapleyData[detailcountry][date].pull);
    chartpushpull.data.datasets[1].labels = Object.keys(shapleyData[detailcountry][date].push);
    chartpushpull.data.datasets[0].data = changeToNegative(Object.values(shapleyData[detailcountry][date].pull));
    chartpushpull.data.datasets[1].data = Object.values(shapleyData[detailcountry][date].push);
    chartpushpull.update();
}

// Show or hide box
function toggleBox(targetid) {
    var target = document.getElementById(targetid);
    if (target.classList.contains("hidden")) {
        target.classList.remove("hidden");
    } else {
        target.classList.add("hidden");
    }
}

// Country list
function initCountryList() {
    var countylist = '<ul>';
    for (var country in conflictWorldMap.countries) {
        var countrycode = conflictWorldMap.countries[country].id;
        var countryname = conflictWorldMap.countries[country].name;
        if (country != 'World') {
            countylist += '<li id="' + countrycode + '" data-name="' + countryname + '" data-conflict="" data-prediciton="" onmouseover="conflictWorldMap.over(\'' + countrycode + '\')" onmouseout="conflictWorldMap.out(\'' + countrycode + '\')" onclick="countryListClick(\'' + countrycode + '\')">' + countryname + '</li>';
        /*if (dayData[countrycode] != undefined && country != 'World') {
            // Main country
            //if (dayData[countrycode].provinces == undefined) {
                countylist += '<li id="' + countrycode + '" data-name="' + countryname + '" data-confirmed="" onmouseover="conflictWorldMap.over(\'' + countrycode + '\')" onmouseout="conflictWorldMap.out(\'' + countrycode + '\')" onclick="countryListClick(\'' + countrycode + '\')">' + countryname + '</li>';
            // Province
            //} else {
                //for (var province in dayData[countrycode].provinces) {
                //}
            //}
        /*} else {
            console.log('No data: ' + countrycode + ' / ' + countryname);*/
        }
    }
    countylist += '</ul>';
    document.getElementById("countrylist").innerHTML = countylist;
}

// Update country list
function updateCountryList() {
    var date = Object.keys(conflictData)[day];
    if (conflictWorldMap != undefined) {
        for (var country in conflictWorldMap.countries) {
            var countrycode = conflictWorldMap.countries[country].id;
            if (conflictData[date][countrycode] != undefined) {
                // Add conflict to countrylist
                if (document.getElementById(countrycode) != null) {
                    var conflictday = conflictData[date][countrycode];
                    var predicitonday = predictionData[date][countrycode];
                    var countryname = document.getElementById(countrycode).dataset.name;
                    if (conflictday > 0) { 
                        document.getElementById(countrycode).dataset.conflict = conflictday;
                        document.getElementById(countrycode).dataset.prediciton = predicitonday;
                        document.getElementById(countrycode).innerHTML = '<span class="small red">' + formatInteger(conflictday) + '</span> <span class="small grey">' + formatInteger(predicitonday) + '</span>' + countryname;
                    } else {
                        document.getElementById(countrycode).dataset.conflict = '';
                        document.getElementById(countrycode).dataset.prediciton = '';
                        document.getElementById(countrycode).innerHTML = countryname;
                    }
                }
            }
        }
        // Sort country list with new conflict data
        sortCountryList();
    }
}

// Sort countrylist by conflict data helper function
function sortCountryList() {
    var list, i, switching, b, shouldSwitch;
    list = document.getElementById("countrylist");
    switching = true;
    while (switching) {
        switching = false;
        b = list.getElementsByTagName("li");
        for (i = 0; i < (b.length - 1); i++) {
            shouldSwitch = false;
            if (Number(b[i].dataset.conflict) < Number(b[i + 1].dataset.conflict)) {
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            b[i].parentNode.insertBefore(b[i + 1], b[i]);
            switching = true;
        }
    }
}

// Country search
function searchCountry() {
    // Declare variables
    var input = document.getElementById('search');
    var searchval = input.value.toUpperCase();
    var li = document.getElementById('countrylist').getElementsByTagName('li');
    // Loop through all list items, and hide those who don't match the search query
    for (i = 0; i < li.length; i++) {
        if (li[i].dataset.name.toUpperCase().indexOf(searchval) > -1) {
            li[i].style.display = "";
        } else {
            li[i].style.display = "none";
        }
    }
}

// Country list click
function countryListClick(countrycode) {
    conflictWorldMap.click(countrycode);
    detailcountry = countrycode;
    // Pan map to country (label)
    /*if (smallScreen == false) {
        var coordsX = 500 - parseInt(conflictWorldMap.countryLabels[countrycode].getAttribute("x")); // 500 = SVG width / 2
        var coordsY = 253 - parseInt(conflictWorldMap.countryLabels[countrycode].getAttribute("y")); // 253 = SVG height / 2
        svgPanZoom.reset();
        svgPanZoom.pan({ x: coordsX, y: coordsY });
    }*/
}

// Callback function from SVG World Map JS
function mapClick(path) {
    if (path.country != undefined || path.id == 'Ocean' || path.id == 'World' || path == 'World') {
        if (path.id == 'Ocean' || path.id == 'World' || path == 'World') {
            var countryid = 'World';
            var countryname = 'World';
        } else {
            var countryid = path.country.id;
            var countryname = path.country.name;
        }
        detailcountry = countryid;
        loadShapleyData();
        // Update conflict chart
        chartconflict.data.datasets[0].data = [];
        chartconflict.data.datasets[1].data = [];
        for (var date in conflictData) {
            for (var country in conflictData[date]) {
                if (country == detailcountry) {
                   chartconflict.data.datasets[0].data.push(predictionData[date][country]);
                   chartconflict.data.datasets[1].data.push(conflictData[date][country]);
                }
            }
        }
        chartconflict.update();
        // Update country chart
        /*chartcountry.data.datasets[0].data = [];
        chartcountry.data.datasets[1].data = [];
        for (var date in conflictData) {
            for (var country in conflictData[date]) {
                if (country == detailcountry) {
                   chartcountry.data.datasets[0].data.push(predictionData[date][country]);
                   chartcountry.data.datasets[1].data.push(conflictData[date][country]);
                }
            }
        }
        chartcountry.update();*/
    }
}

// Click info button
function clickInfo() {
    if (smallScreen != false) {
        if (document.getElementById('countries').classList.contains("hidden") == false) {
            document.getElementById('countries').classList.add("hidden");
        }
        if (document.getElementById('details').classList.contains("hidden") == false) {
            document.getElementById('details').classList.add("hidden");
        }
    }
    toggleBox('info');
    toggleBox('logo');
}

// Chart legend padding
Chart.Legend.prototype.afterFit = function() {
    this.height = this.height + 10;
};

// Tooltip position
Chart.Tooltip.positioners.custom = function(elements, eventPosition) {
    //var tooltip = this;
    //console.log(elements);
    //console.log(eventPosition);
    return {
        x: eventPosition.x,
        y: 0
    };
};

// Chart vertical line
var originalLineDraw = Chart.controllers.line.prototype.draw;
Chart.helpers.extend(Chart.controllers.line.prototype, {
    draw: function() {
        originalLineDraw.apply(this, arguments);
        var chart = this.chart;
        var ctx = chart.chart.ctx;
        var index = chart.config.data.lineAtIndex;
        if (index) {
            var xaxis = chart.scales['x-axis-0'];
            //var yaxis = chart.scales['y-axis-0'];
            var yaxis = chart.scales['CP'];
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(xaxis.getPixelForValue(undefined, index), yaxis.top);
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 1;
            ctx.lineTo(xaxis.getPixelForValue(undefined, index), yaxis.bottom);
            ctx.stroke();
            ctx.restore();
        }
    }
});

// Chart init
function initCharts() {
    var chartLabel;
    // Options for conflict charts
    var chartoptions = { 
        maintainAspectRatio: false, 
        legend: { /*position: 'bottom',*/ labels: { usePointStyle: true, fontColor: "#666666", fontSize: 11 } }, /*reverse: true,*/
        elements: { point:{ radius: 0 } }, 
        scales: { 
            xAxes: [{ fontColor: "#FF0000", ticks: {
                callback: function(label, index, labels) {
                    if (chartLabel != label.substr(0, 4)) {
                        chartLabel = label.substr(0, 4);
                    } else {
                        chartLabel = '';
                    }
                    return chartLabel;
                }
            }, gridLines: { display: true } }], 
            yAxes: [{ ticks: { fontColor: "#FF0000", /*suggestedMin: 0, fontColor: '#ECB0B0'*/
                    /*callback: function(label, index, labels) {
                        if (label >= 1000000) {
                            return label/1000000+'m';
                        } else  if (label >= 1000) {
                            return label/1000+'k';
                        } else {
                            return label;
                        }
                    }*/
                }
            }]
        },
        tooltips: {
            mode: 'index',
            intersect: false,
            position: 'custom',
            caretSize: 0,
            backgroundColor: 'rgba(250, 250, 250, 0.9)',
            titleFontSize: 14,
            titleFontColor: '#666666',
            bodyFontSize: 13,
            bodyFontColor: '#666666',
            borderWidth: 1,
            borderColor: '#CCCCCC'
            /*callbacks: {
                label: function (tooltipItems, data) {
                    console.log(tooltipItems.index);
                    //console.log(data);
                }
            }*/
        },
        plugins: {
            datalabels: false,
            /*crosshair: {
                line: {
                    color: '#F66',        // crosshair line color
                    width: 1,             // crosshair line width
                    dashPattern: [5, 5]   // crosshair line dash pattern
                },
                sync: {
                    enabled: true,            // enable trace line syncing with other charts
                    group: 1,                 // chart group
                    suppressTooltips: false   // suppress tooltips when showing a synced tracer
                },
                zoom: {
                    enabled: false,                                      // enable zooming
                    /*zoomboxBackgroundColor: 'rgba(66,133,244,0.2)',     // background color of zoom box 
                    zoomboxBorderColor: '#48F',                         // border color of zoom box
                    zoomButtonText: 'Reset Zoom',                       // reset zoom button text
                    zoomButtonClass: 'reset-zoom',                      // reset zoom button class
                },
                callbacks: {
                    beforeZoom: function(start, end) {                  // called before zoom, return false to prevent zoom
                        return false;
                    },
                    afterZoom: function(start, end) {                   // called after zoom
                    }
                }
            }*/
        }
    };
    // Change chart y axis label for conflict chart
    //chartoptions.scales.yAxes[0].ticks.maxTicksLimit = 3;
    //chartoptions.legend.reverse = false;
    chartoptions.scales.yAxes = [{
        id: 'CP',
        type: 'linear',
        position: 'left',
        ticks: { maxTicksLimit: 5, beginAtZero: true }
    }, {
        id: 'CG',
        type: 'linear',
        position: 'right',
        ticks: { maxTicksLimit: 5, beginAtZero: true, fontColor: '#ECB0B0' }
    }];
    // Hover / click position callback
    chartoptions.hover = {
        mode: 'index',
        intersect: false,
        onHover: function (event, item) {
            if (item.length && (event.type == 'click' || event.type == 'mousemove')) {
                //console.log(event.type);
                //console.log(item[0]._index);
                document.getElementById('map-slider').value = item[0]._index;
                document.getElementById('map-slider').dispatchEvent(new Event("input"));
            }
        }
    };
    // Conflict charts
    chartconflict = new Chart(conflictcanvas, {
        type: 'line',
        //plugins: [ChartRough],
        data: {
            labels: [],
            datasets: [{
                label: 'Conflict Prediciton',
                yAxisID: 'CP',
                data: [],
                borderWidth: 1,
                backgroundColor: 'rgba(128, 128, 128, .3)'
            }, {
                label: 'Ground Truth',
                yAxisID: 'CG',
                data: [],
                borderWidth: 1,
                backgroundColor: 'rgba(200, 0, 0, .3)'
            }]
        },
        //lineAtIndex: 20,
        options: chartoptions
    });
    // Change chart y axis label for conflict chart
    chartoptions.scales.xAxes[0].gridLines.display = false;
    chartoptions.scales.xAxes[0].ticks.display = false;
    //chartoptions.scales.yAxes[1].gridLines.display = false;
    //console.log(chartoptions.scales.xAxes);
    /*chartcountry = new Chart(countrycanvas, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Conf. Pred.',
                yAxisID: 'CP',
                data: [],
                borderWidth: 1,
                backgroundColor: 'rgba(128, 128, 128, .3)'
            }, {
                label: 'Ground Truth',
                yAxisID: 'CG',
                data: [],
                borderWidth: 1,
                backgroundColor: 'rgba(200, 0, 0, .3)'
            }]
        },
        options: chartoptions
    });*/
    // Push / pull chart
    chartpushpull = new Chart(pushpullcanvas, {
        type: 'horizontalBar',
        //plugins: [ChartRough],
        options: {
            // Elements options apply to all of the options unless overridden in a dataset
            elements: {
                rectangle: {
                    borderWidth: 1,
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            legend: {
                //position: 'bottom',
                display: false
            },
            title: {
                display: true,
                text: 'Pull factors                Push factors'
            },
            tooltips: false,
            //plugins: { crosshair: { sync: { enabled: false } } },
            plugins: { 
                crosshair: false,
                /*rough: {
                    roughness: 2
                }*/
                datalabels: {
                    display: true,
                    align: function(value, context) {
                        if (value.datasetIndex != undefined) {
                            if (value.datasetIndex == 0) {
                                return 'left';
                            } else {
                                return 'right';
                            }
                        }
                    },
                    anchor: function(value, context) {
                        if (value.datasetIndex != undefined) {
                            if (value.datasetIndex == 0) {
                                return 'end';
                            } else {
                                return 'start';
                            }
                        }
                    },
                    //anchor: 'start',
                    formatter: function(value, context) {
                        //return context.chart.data.labels[context.dataIndex];
                        if (context.dataset.labels != undefined) {
                            //console.log(context.dataIndex);
                            //console.log(context.dataset.labels);
                            //console.log(context.dataset.labels[context.dataIndex]);
                            //return context.dataset.labels[0];
                            return context.dataset.labels[context.dataIndex];
                        }
                        //return context.dataset.labels[0];
                    }
                    /*color: 'blue',
                    labels: {
                        title: {
                            font: {
                                weight: 'bold'
                            }
                        },
                        value: {
                            color: 'green'
                        }
                    }*/
                }
             },
            scales: {
                xAxes: [{
                    ticks: {
                        min: -0.05, 
                        max: 0.08,
                    }, 
                    gridLines: {
                        lineWidth: 0,
                        zeroLineWidth: 1
                    }
                }],
                yAxes: [{
                    stacked: true,
                    ticks: {
                        //display: false,
                        //mirror: true // Show y-axis labels inside horizontal bars
                    }, 
                    gridLines: {
                        lineWidth: 0,
                        zeroLineWidth: 0
                    }
                }],
                /*yAxes: [{
                    id: 'Pull',
                    position: 'left',
                    stacked: true
                }, {
                    id: 'Push',
                    position: 'right',
                    stacked: true
                }]*/
            },
            /*tooltips: {
                callbacks: {
                    title: function(tooltipItems, data) {
                        return data.datasets[tooltipItems[0].datasetIndex].label;
                    },
                    label: function(tooltipItem, data) {
                        return '$' +tooltipItem.yLabel.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    }
                }
            }*/
        },
        data: {
            labels: ["", "", "", "", ""],
            datasets: [{
                //yAxisID: 'Pull',
                //label: ["Pull 1", "Pull 2", "3", "4", "5"],
                data: [-0.05, -0.04, -0.03, -0.02, -0.01],
                backgroundColor: "rgba(128, 128, 128, .3)",
                hoverBackgroundColor: "rgba(128, 128, 128, .6)"
            }, {
                //yAxisID: 'Push',
                //label: ["Push 1", "Push 2", "3", "4", "5"],
                data: [0.05, 0.04, 0.03, 0.02, 0.01],
                backgroundColor: "rgba(200, 0, 0, .3)",
                hoverBackgroundColor: "rgba(200, 0, 0, .6)"
            }]
            /*labels: [],
            datasets: [
                { label: '1', data: [ -5, 5 ], backgroundColor: [ 'rgba(128, 128, 128, .3)', 'rgba(200, 0, 0, .3)' ] },
                { label: '2', data: [ -4, 4 ], backgroundColor: [ 'rgba(128, 128, 128, .3)', 'rgba(200, 0, 0, .3)' ] },
                { label: '3', data: [ -3, 3 ], backgroundColor: [ 'rgba(128, 128, 128, .3)', 'rgba(200, 0, 0, .3)' ] },
                { label: '4', data: [ -2, 2 ], backgroundColor: [ 'rgba(128, 128, 128, .3)', 'rgba(200, 0, 0, .3)' ] },
                { label: '5', data: [ -1, 1 ], backgroundColor: [ 'rgba(128, 128, 128, .3)', 'rgba(200, 0, 0, .3)' ] }
            ]*/
        }
    });
}

// Load file helper function
function loadFile(url, callback) {
    var xobj = new XMLHttpRequest();
    xobj.open('GET', url, true);
    xobj.onreadystatechange = function() {
        if (xobj.readyState === 4 && xobj.status === 200) {
            callback(xobj.responseText);
        }
    };
    xobj.send(null);
}

// Number format helper function
function formatInteger(number) {
    return new Intl.NumberFormat('en-GB').format(number);
}

// Numbers to negative helper function
function changeToNegative(arr) {
    return arr.reduce((acc, val) => {
       const negative = val < 0 ? val : val * -1;
       return acc.concat(negative);
    }, []);
 };

// Mobile device detection
function checkMobile() {
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) { 
        isMobile = true;
    }
}

// Check screen size
function checkSize() {
    if (screen.width < 999) {
        if (screen.width < screen.height) {
            smallScreen = 'portrait';
        } else {
            smallScreen = 'landscape';
        }
    }
}
