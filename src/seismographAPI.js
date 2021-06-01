/**
 * SeismographAPI
 * v0.1.7
 * 
 * Description: A Javascript API built upon SVG World Map JS and Chart.JS for time series data visualization. 
 * Author: Raphael Lepuschitz <raphael.lepuschitz@gmail.com>
 * Copyright: Raphael Lepuschitz
 * URL: https://github.com/conflictAI/seismographAPI
 * License: MIT
 **/

 var seismographAPI = (function() { 

    // Global variables
    var mapSVG; 
    var svgInit = false;
    var svgLoaded = false;
    var seismographMap; // For svg-world-map.js
    var svgPanZoom; // For svg-pan-zoom.js
    var timelineData = {}; // Empty object for timeline data
    var detailData = {}; // Empty object for detail data
    var colorData = {}; // Empty object for color data
    var syncData = false; // Sync conflict prediction and ground truth
    var detailCountry = 'World'; // 'World'
    var detailProvince = false; 
    var smallScreen = false; 
    var isMobile = false; 
    var day = 0;

    // Main function: SVG map init call, options handling, return the map object
    async function seismographAPI() {
        // Load CSS
        document.getElementsByTagName('head')[0].insertAdjacentHTML('beforeend', '<link rel="stylesheet" href="src/seismographAPI.css" />');
        // Load JS
        loadScript('lib/svg-world-map.js')
        .then(() => loadScript('lib/svg-pan-zoom.min.js'))
        .then(() => loadScript('lib/chart.min.js'))
        .then(() => loadScript('lib/chartjs-plugin-datalabels.js'))
        .then(() => {
            // Startup after all scripts are loaded
            initUI();
            checkSize();
            checkMobile();
            loadTimelineData();
            initChartOptions();
            initCharts();
            initStartup();
        }).catch(() => console.error('Something went wrong.'));
    }

    // Wait untill everything is fully loaded
    function initStartup() {
        var waitcounter = 0;
        var startuptimer = window.setInterval(function() {
            waitcounter++
            if (waitcounter > 20) { // Wait 20 * 500ms = 10s for data answer
                window.clearInterval(startuptimer);
                document.getElementById('loading').innerHTML = '~~~ There seems to be a problem ~~~<br><br>Please try a <a href="javascript:location.reload()">relaod</a>';
            } else if (timelineData == undefined) {
                document.getElementById('loading').innerHTML = '~~~ Loading Data ~~~'; 
            } else if (svgInit == false && svgLoaded == false && colorData != undefined && timelineData != undefined && detailData != undefined) {
                document.getElementById('loading').innerHTML = '~~~ Loading Map ~~~'; 
                loadSVGMap();
                svgInit = true;
            } else if (svgLoaded == true && colorData != undefined && timelineData != undefined && detailData != undefined && document.getElementById('map-slider') != null) {
                window.clearInterval(startuptimer);
                document.getElementById('loading').innerHTML = '~~~ All Data Loaded ~~~';
                initSVGMap();
            }
        }, 500);
    }

    // Load SVG World Map
    async function loadSVGMap() {
        // Custom options
        var svgMapOptions = { 
            libPath: 'lib/', // Point to lib-folder 
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
        seismographMap = await svgWorldMap(svgMapOptions, false, colorData);
        mapSVG = seismographMap.worldMap;
        svgLoaded = true;
        return seismographMap;
    }

    // SVG map start
    function initSVGMap() {
        if (svgLoaded == true) {
            // Change start day
            document.getElementById('map-slider').value = Object.keys(timelineData[1]).length - 12; // Start 12 months ago
            document.getElementById('map-slider').oninput();
            document.getElementById('map-control-play-pause').click();
            // Build country list 
            initCountryList();
            // Init svgPanZoom library
            svgPanZoom = window.svgPanZoom(mapSVG, { minZoom: 1, dblClickZoomEnabled: false });  //controlIconsEnabled: true, beforePan: beforePan
            if (smallScreen == false) {
                svgPanZoom.pan({ x: -90, y: 0 }); // Set map to better start position for big horizontal screens
            } else if (smallScreen == 'portrait') {
                svgPanZoom.pan({ x: -5, y: 170 }); // Set map to better start position for small vertical screens
                svgPanZoom.zoomBy(1.4); // Zoom in for small screens
            } else if (smallScreen == 'landscape') {
                svgPanZoom.pan({ x: -5, y: 20 }); // Set map to better start position for small horizontal screens
                svgPanZoom.zoomBy(1.1); // Zoom in for small screens
            }
            // Uncheck checkbox
            document.getElementById('predsync').checked = false;
            // Hide loading and show boxes and map after startup
            toggleBox('loading');
            //toggleBox('settings');
            //toggleBox('timeline');
            if (smallScreen != 'landscape') {
                //toggleBox('details'); 
            }
            if (smallScreen == true) {
                toggleBox('countries');
            }
            // Fadein with opacity 
            document.getElementById('details').style.visibility = 'visible';
            document.getElementById('settings').style.visibility = 'visible';
            document.getElementById('countries').style.visibility = 'visible';
            document.getElementById('timeline').style.visibility = 'visible';
            document.getElementById('svg-world-map-container').style.visibility = 'visible';
            setTimeout(function() {
                document.getElementById('details').style.opacity = 1;
                document.getElementById('settings').style.opacity = 1;
                document.getElementById('countries').style.opacity = 1;
                document.getElementById('timeline').style.opacity = 1;
                document.getElementById('svg-world-map-container').style.opacity = 1;
                setTimeout(function() {
                    document.getElementById('map-control-buttons').style.opacity = 1;
                    document.getElementById('map-date').style.opacity = 1;
                    setTimeout(function() {
                        document.getElementById('map-speed-controls').style.opacity = 1;
                    }, 200);
                }, 400);
            }, 200);
        }
    }

    // Wait for JSON load and pass data to library 
    function loadTimelineData() {
        var timelineJson = "data/conflict/Timeline.json";
        loadFile(timelineJson, function(timelineResponse) {
            var timelineDataParsed = JSON.parse(timelineResponse); 
            var timelineDataKeys = Object.keys(timelineDataParsed); 
            for(var i=0; i<timelineDataKeys.length; i++) {
                timelineData[i] = timelineDataParsed[timelineDataKeys[i]];
            }
            chartconflict.data.labels = Object.keys(timelineData[1]);
            loadDetailData();
            initColorData();
            updateTimeline();
        });
    }

    // Wait for JSON load and pass data to detail chart 
    function loadDetailData() {
        if (detailData[detailCountry] == undefined) {
            var detailJson = "data/conflict/" + detailCountry + ".json";
            loadFile(detailJson, function(detailResponse) {
                detailData[detailCountry] = JSON.parse(detailResponse); 
                updateDetails();
            });
        } else {
            updateDetails();
        }
    }

    // Sort conflict data for map countries
    function initColorData() {
        colorData = JSON.parse(JSON.stringify(timelineData[1])); // Copy conflict object 
        for (var date in timelineData[1]) {
            for (var country in timelineData[1][date]) {
                var value = timelineData[1][date][country] * 255;
                var rgb = 'rgb(255,' + (255-value) + ',' + (255-value) + ')';
                colorData[date][country] = rgb;
            }
        }
    }

    // Update timeline chart
    function updateTimeline() {
        chartconflict.data.datasets[0].data = [];
        chartconflict.data.datasets[1].data = [];
        for (var date in timelineData[1]) {
            for (var country in timelineData[1][date]) {
                if (country == detailCountry) {
                    chartconflict.data.datasets[0].data.push(timelineData[0][date][country]);
                    chartconflict.data.datasets[1].data.push(timelineData[1][date][country]);
                }
            }
        }
        // Sync data = prepend 6 months in proediction
        if (syncData) {
            var length = chartconflict.data.datasets[0].data.length;
            var prepend = [0, 0, 0, 0, 0, 0];
            chartconflict.data.datasets[0].data = prepend.concat(chartconflict.data.datasets[0].data);
            chartconflict.data.datasets[0].data = chartconflict.data.datasets[0].data.slice(0, length);
        }
        chartconflict.update();
    }

    // Update details
    function updateDetails() {
        var date = Object.keys(timelineData[1])[day];
        // Set vertical line
        chartconflict.data.lineAtIndex = day;
        chartconflict.update();
        // Update info
        if (detailCountry == 'World') {
            //document.getElementById('countrytitle').innerHTML =  'World';
            document.getElementById('timeline-title').innerHTML =  'World';
            document.getElementById('timeline-back').innerHTML =  '(click a country for details)';
        } else {
            //document.getElementById('countrytitle').innerHTML = seismographMap.countries[detailCountry].name;
            document.getElementById('timeline-title').innerHTML = seismographMap.countries[detailCountry].name;
            document.getElementById('timeline-back').innerHTML =  '(<a onclick="mapClick(\'World\')">back to global view</a>)';
        }
        if (timelineData[0][date] != undefined) {
            var countryinfo = '<table>';
            countryinfo += '<tr><td><b>' + document.getElementById('timeline-title').innerHTML + '</b></td><td><b>' + date + '</b></td></tr>';
            countryinfo += '<tr><td>Probability of Conf.<br><small>(+6 months)</small></td><td>Conflict Intensity<br><small>(ground truth)</small></td></tr>';
            countryinfo += '<tr><td><b>' + timelineData[0][date][detailCountry] + '</b></td><td><b>' + timelineData[1][date][detailCountry] + '</b></td></tr>';
            countryinfo += '</table>';
            document.getElementById('details-info').innerHTML = countryinfo;
        }
        if (detailData[detailCountry][date] != undefined) {
            var pull = Object.entries(detailData[detailCountry][date].pull);
            var push = Object.entries(detailData[detailCountry][date].push);
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
            document.getElementById('details-legend').innerHTML = ppinfo;
            // Update detail chart
            updateDetailChart();
        }
        // Update country list
        updateCountryList();
    }

    // Update detail chart
    // Format: [0] = pull, [1] = push
    function updateDetailChart() {
        var date = Object.keys(timelineData[1])[day];
        chartpushpull.data.datasets[0].labels = Object.keys(detailData[detailCountry][date].pull);
        chartpushpull.data.datasets[1].labels = Object.keys(detailData[detailCountry][date].push);
        chartpushpull.data.datasets[0].data = changeToNegative(Object.values(detailData[detailCountry][date].pull));
        chartpushpull.data.datasets[1].data = Object.values(detailData[detailCountry][date].push);
        chartpushpull.update();
    }

    // Country list
    function initCountryList() {
        var countylist = '<ul>';
        for (var country in seismographMap.countries) {
            var countryCode = seismographMap.countries[country].id;
            var countryName = seismographMap.countries[country].name;
            if (country != 'World') {
                countylist += '<li id="' + countryCode + '" data-name="' + countryName + '" data-conflict="" data-prediciton="" onmouseover="countryOver(\'' + countryCode + '\')" onmouseout="countryOut(\'' + countryCode + '\')" onclick="countryListClick(\'' + countryCode + '\')">' + countryName + '</li>';
            /*} else {
                console.log('No data: ' + countryCode + ' / ' + countryName);*/
            }
        }
        countylist += '</ul>';
        document.getElementById("countries-list").innerHTML = countylist;
    }

    // Update country list
    function updateCountryList() {
        var date = Object.keys(timelineData[1])[day];
        if (seismographMap != undefined) {
            for (var country in seismographMap.countries) {
                var countryCode = seismographMap.countries[country].id;
                if (timelineData[1][date][countryCode] != undefined) {
                    if (document.getElementById(countryCode) != null) {
                        var conflictday = timelineData[1][date][countryCode];
                        var predicitonday = timelineData[0][date][countryCode];
                        var countryName = document.getElementById(countryCode).dataset.name;
                        if (conflictday > 0) { 
                            document.getElementById(countryCode).dataset.conflict = conflictday;
                            document.getElementById(countryCode).dataset.prediciton = predicitonday;
                            document.getElementById(countryCode).innerHTML = '<span class="small red">' + formatInteger(conflictday) + '</span> <span class="small grey">' + formatInteger(predicitonday) + '</span>' + countryName;
                        } else {
                            document.getElementById(countryCode).dataset.conflict = '';
                            document.getElementById(countryCode).dataset.prediciton = '';
                            document.getElementById(countryCode).innerHTML = countryName;
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
        list = document.getElementById("countries-list");
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
    window.searchCountry = function() {
        // Declare variables
        var input = document.getElementById('search');
        var searchval = input.value.toUpperCase();
        var li = document.getElementById('countries-list').getElementsByTagName('li');
        // Loop through all list items, and hide those who don't match the search query
        for (i = 0; i < li.length; i++) {
            if (li[i].dataset.name.toUpperCase().indexOf(searchval) > -1) {
                li[i].style.display = "";
            } else {
                li[i].style.display = "none";
            }
        }
    }

    // Callback function from the time control module, defined in 'options.mapDate'
    window.mapDate = function(updateDate) {
        day = updateDate;
        updateDetails();
        // Update day date info
        var daydate = new Date(document.getElementById('map-date').innerHTML).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
        //if (daydate[1] != 'May') { daydate[1] = daydate[1] + '.' }
        document.getElementById('map-date').innerHTML = daydate;
    }

    // Country list click
    window.countryListClick = function(countryCode) {
        countryPath = seismographMap.countries[countryCode];
        //countryClick(countryCode);
        mapClick(countryPath);
        detailCountry = countryCode;
        // Pan map to country (label)
        /*if (smallScreen == false) {
            var coordsX = 500 - parseInt(seismographMap.countryLabels[countryCode].getAttribute("x")); // 500 = SVG width / 2
            var coordsY = 253 - parseInt(seismographMap.countryLabels[countryCode].getAttribute("y")); // 253 = SVG height / 2
            svgPanZoom.reset();
            svgPanZoom.pan({ x: coordsX, y: coordsY });
        }*/
    }

    // Callback function from SVG World Map JS
    window.mapClick = function(path) {
        if (path.country != undefined || path.id == 'Ocean' || path.id == 'World' || path == 'World') {
            if (path.id == 'Ocean' || path.id == 'World' || path == 'World') {
                var countryid = 'World';
                var countryName = 'World';
            } else {
                var countryid = path.country.id;
                var countryName = path.country.name;
            }
            detailCountry = countryid;
            loadDetailData();
            chartconflict.options.animation.duration = 1000; // Animate lines
            updateTimeline();
            chartconflict.options.animation.duration = 0; // Don't animate lines
        }
    }

    // Show or hide box
    window.toggleBox = function(targetid) {
        var target = document.getElementById(targetid);
        if (target.classList.contains("hidden")) {
            target.classList.remove("hidden");
            target.style.visibility = 'visible';
            setTimeout(function() {
                target.style.opacity = 1;
            }, 100);
        } else {
            target.style.opacity = 0;
            setTimeout(function() {
                target.style.visibility = 'hidden';
                target.classList.add("hidden");
            }, 500);
        }
    }

    // Click info button
    window.toggleInfo = function() {
        if (smallScreen != false) {
            if (document.getElementById('countries').classList.contains("hidden") == false) {
                document.getElementById('countries').classList.add("hidden");
            }
            if (document.getElementById('details').classList.contains("hidden") == false) {
                document.getElementById('details').classList.add("hidden");
            }
        }
        toggleBox('overlay');
        toggleBox('info');
        //toggleBox('logo');
        // Fadein with opacity 
        document.getElementById('details').style.visibility = 'visible';
        document.getElementById('settings').style.visibility = 'visible';
        document.getElementById('countries').style.visibility = 'visible';
        document.getElementById('timeline').style.visibility = 'visible';
        document.getElementById('svg-world-map-container').style.visibility = 'visible';
        setTimeout(function() {
            document.getElementById('details').style.opacity = 1;
            document.getElementById('settings').style.opacity = 1;
            document.getElementById('countries').style.opacity = 1;
            document.getElementById('timeline').style.opacity = 1;
            document.getElementById('svg-world-map-container').style.opacity = 1;
        }, 200);
    }

    // Sync prediction with ground truth
    window.syncPrediction = function() {
        syncData = document.getElementById('predsync').checked;
        updateTimeline();
    }

    // Switch to dark mode
    window.toggleDarkMode = function() {
        if (document.getElementsByTagName('body')[0].classList.contains('dark')) {
            document.getElementsByTagName('body')[0].classList.remove('dark');
        } else {
            document.getElementsByTagName('body')[0].classList.add('dark');
        }
    }

    // Zoom in
    window.zoomIn = function() {
        svgPanZoom.zoomIn();
    }

    // Zoom out
    window.zoomOut = function() {
        svgPanZoom.zoomOut();
    }

    // HTML for UI
    function initUI() {
        // Avoid double loading
        if (document.getElementById('seismograph-api-container') == null) {
            // Add seimographAPI container HTML
            var container = document.createElement("div");
            container.setAttribute("id", "seismograph-api-container");
            document.body.prepend(container);
            // UI elements
            var uiElements = {
                // Countries
                'countries': { tag: 'div', append: 'seismograph-api-container' }, 
                'countries-search': { tag: 'div', append: 'countries' }, 
                'countries-search-inner': { tag: 'div', append: 'countries-search', icon: 'search', click: 'return false' }, 
                'countries-search-input': { tag: 'input', append: 'countries-search-inner' }, 
                'countries-list': { tag: 'div', append: 'countries' }, 
                // Settings
                'settings': { tag: 'div', append: 'seismograph-api-container' }, 
                'settings-zoom-in': { tag: 'button', append: 'settings', icon: 'zoom-in', click: 'zoomIn()' }, 
                'settings-zoom-out': { tag: 'button', append: 'settings', icon: 'zoom-out', click: 'zoomOut()' }, 
                'settings-labels': { tag: 'button', append: 'settings', icon: 'globe', click: 'toggleMapLabels(\'all\')' }, 
                'settings-dark-mode': { tag: 'button', append: 'settings', icon: 'contrast', click: 'toggleDarkMode()' }, 
                'settings-countries': { tag: 'button', append: 'settings', icon: 'menu', click: 'toggleBox(\'countries\')' }, 
                'settings-timeline': { tag: 'button', append: 'settings', icon: 'timeline', click: 'toggleBox(\'timeline\');toggleBox(\'map-controls\')' }, 
                'settings-details': { tag: 'button', append: 'settings', icon: 'chart', click: 'toggleBox(\'details\')' }, 
                // Details
                'details': { tag: 'div', append: 'seismograph-api-container' }, 
                'details-title': { tag: 'span', append: 'details' }, 
                'details-inner': { tag: 'div', append: 'details' }, 
                'details-info': { tag: 'div', append: 'details-inner' }, 
                'details-chart': { tag: 'div', append: 'details-inner' }, 
                'details-chart-canvas': { tag: 'canvas', append: 'details-chart' }, 
                'details-legend': { tag: 'div', append: 'details-inner' }, 
                'details-help': { tag: 'div', append: 'details' }, 
                // Timeline
                'timeline': { tag: 'div', append: 'seismograph-api-container' }, 
                'timeline-info': { tag: 'div', append: 'timeline' }, 
                'timeline-title': { tag: 'span', append: 'timeline-info' }, 
                'timeline-back': { tag: 'span', append: 'timeline-info' }, 
                'timeline-chart': { tag: 'div', append: 'timeline' }, 
                'timeline-chart-canvas': { tag: 'canvas', append: 'timeline-chart' }, 
                // Overlay, Information, Loading
                'overlay': { tag: 'div', append: 'seismograph-api-container', click: 'toggleInfo()' }, 
                'info': { tag: 'div', append: 'seismograph-api-container' }, 
                'info-close': { tag: 'button', append: 'info', icon: 'cross', click: 'toggleInfo()' }, 
                'info-inner': { tag: 'div', append: 'info' }, 
                'loading': { tag: 'div', append: 'seismograph-api-container' }, 
            };
            // Create all elements dynamically
            for (var element in uiElements) {
                window[element] = document.createElement(uiElements[element].tag);
                window[element].setAttribute("id", element);
                window[uiElements[element].append].appendChild(window[element]);
                if (uiElements[element].icon != undefined) {
                    var i = document.createElement('i');
                    i.setAttribute("class", "flaticon-" + uiElements[element].icon);
                    window[element].appendChild(i);
                }
                if (uiElements[element].click != undefined) {
                    window[element].setAttribute("onclick", uiElements[element].click);
                }
            }
            // Add missing attributes to elements
            document.getElementById("countries-search-input").setAttribute("type", "text");
            document.getElementById("countries-search-input").setAttribute("autocomplete", "off");
            document.getElementById("countries-search-input").setAttribute("onkeyup", "searchCountry()");
            document.getElementById("countries-search-input").setAttribute("onfocusout", "(keyctrl = true)");
            document.getElementById("countries-search-input").setAttribute("placeholder", "Search country...");
            // Add help and loading text
            document.getElementById("details-help").innerHTML = '<span class="big top">How to use</span><div class="bgbox"><ul><li><b>Click on a country</b> for detailed information</li><li>Use the <b>timeline controls</b> or the <b>slider</b></li><li><b>Zoom</b> with mouse wheel</li><li><b>Drag</b> the map with click and hold</li><!--<li>Double-clicking on a country will zoom it in, double-clicking on the ocean will zoom out</li>--></ul></div><span class="big top">Keyboard commands</span><div class="bgbox"><ul><li>"<b> &nbsp; </b>" (Space): Pause</li><li><b>+ -</b> (Plus &amp; minus): Play animation faster or slower</li><li><b>⯅ ⯆ ⯇ ⯈</b> (Arrow keys): Start, end, one day back or forward</li><!--<li><b>C</b>, <b>D</b>, <b>I</b> and <b>L</b>: Show or hide the country list, details, info or labels</li>--></ul></div>';
            document.getElementById("loading").innerHTML = '~~~ Loading ~~~';
            // Hide elements
            toggleBox('overlay');
            toggleBox('info');
            // Load info text
            var infoText = "conflict-prediction-info.html";
            loadFile(infoText, function(infoResponse) { document.getElementById("info-inner").innerHTML = infoResponse; });
            // Ony for development
            document.getElementById("details-title").innerHTML = 'Neural Network SHAP Interpretability';
            document.getElementById("timeline-info").innerHTML += '<span><input type="checkbox" id="predsync" name="predsync" onclick="syncPrediction()"><label for="predsync">Sync prediction with ground truth</label></span>';
            document.getElementById("timeline-info").innerHTML += '<div id="about"><a onclick="toggleInfo()">About <i class="flaticon-question"></i></a></div>';
        }
    }

    // Chart.js options
    function initChartOptions() {
        // Chart legend padding
        Chart.Legend.prototype.afterFit = function() {
            this.height = this.height + 10;
        };
        // Tooltip position
        Chart.Tooltip.positioners.custom = function(elements, eventPosition) {
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
    }

    // Chart init
    function initCharts() {
        var chartLabel;
        // Options for conflict charts
        var chartoptions = { 
            animation: { duration: 0 }, 
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
            },
            plugins: {
                datalabels: false,
            }
        };
        // Change chart y axis label for conflict chart
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
                    document.getElementById('map-slider').value = item[0]._index;
                    document.getElementById('map-slider').dispatchEvent(new Event("input"));
                }
            }
        };
        // Timeline chart
        var timelineCanvas = document.getElementById('timeline-chart-canvas').getContext('2d');
        chartconflict = new Chart(timelineCanvas, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Probability of Conflict (6 months ahead)',
                    yAxisID: 'CP',
                    data: [],
                    borderWidth: 1,
                    backgroundColor: 'rgba(128, 128, 128, .3)'
                }, {
                    label: 'Composite Conflict Intensity (ground truth)',
                    yAxisID: 'CG',
                    data: [],
                    borderWidth: 1,
                    backgroundColor: 'rgba(200, 0, 0, .3)'
                }]
            },
            options: chartoptions
        });
        // Change chart y axis label for conflict chart
        chartoptions.scales.xAxes[0].gridLines.display = false;
        chartoptions.scales.xAxes[0].ticks.display = false;
        // Push / pull chart
        var detailCanvas = document.getElementById('details-chart-canvas').getContext('2d');
        chartpushpull = new Chart(detailCanvas, {
            type: 'horizontalBar',
            options: {
                elements: {
                    rectangle: {
                        borderWidth: 1,
                    }
                },
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    fontSize: 13,
                    text: 'Pull factors                Push factors'
                },
                tooltips: false,
                plugins: { 
                    crosshair: false,
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
                        formatter: function(value, context) {
                            if (context.dataset.labels != undefined) {
                                return context.dataset.labels[context.dataIndex];
                            }
                        }
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
                        gridLines: {
                            lineWidth: 0,
                            zeroLineWidth: 0
                        }
                    }],
                },
            },
            data: {
                labels: ["", "", "", "", ""],
                datasets: [{
                    data: [-0.05, -0.04, -0.03, -0.02, -0.01],
                    backgroundColor: "rgba(128, 128, 128, .3)",
                    hoverBackgroundColor: "rgba(128, 128, 128, .6)"
                }, {
                    data: [0.05, 0.04, 0.03, 0.02, 0.01],
                    backgroundColor: "rgba(200, 0, 0, .3)",
                    hoverBackgroundColor: "rgba(200, 0, 0, .6)"
                }]
            }
        });
    }

    // Load javascript helper function
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.onload = resolve;
            script.onerror = reject
            script.src = src;
            document.head.append(script);
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

    // Return the main function
    return seismographAPI;

})();
