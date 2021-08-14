/**
 * SeismographAPI
 * v0.2.2
 * 
 * Description: A Javascript API built upon SVG World Map JS and Chart.JS for time series data visualization. 
 * Author: Raphael Lepuschitz <raphael.lepuschitz@gmail.com>
 * Copyright: Raphael Lepuschitz
 * URL: https://github.com/conflict-AI/seismographAPI
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

    // Default options
    var options = {
        infoTitle: 'SeismographAPI', // Map info title
        dataPath: '', // Point to data path, e.g. 'data/'
        showCountryList: true, // Show or hide country list
        showDetails: true, // Show or hide details
        showTimeline: true, // Show or hide timeline
        darkMode: false, // Toggle dark mode
        svgMapOptions: {}, // SVG World Map options
        chartDetailOptions: {}, // Chart.js options
        chartTimelineOptions: {}, // Chart.js options
    };

    // Main function: SVG map init call, options handling, return the map object
    async function seismographAPI(initOptions) {
        // Overwrite default options with initOptions
        for (var option in initOptions) {
            if (initOptions.hasOwnProperty(option)) { 
                options[option] = initOptions[option];
            }
        }
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
            initDataLoading();
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
            } else if (options.dataPath == '') {
                document.getElementById('loading').innerHTML = '~~~ No Dataset ~~~'; 
            } else if (timelineData == undefined) {
                document.getElementById('loading').innerHTML = '~~~ Loading Data ~~~'; 
            } else if (svgInit == false && svgLoaded == false && Object.keys(colorData).length > 0 && timelineData != undefined && detailData != undefined) {
                document.getElementById('loading').innerHTML = '~~~ Loading Map ~~~'; 
                loadSVGMap();
                svgInit = true;
            } else if (svgLoaded == true && timelineData != undefined && detailData != undefined && document.getElementById('map-slider') != null) {
                window.clearInterval(startuptimer);
                document.getElementById('loading').innerHTML = '~~~ All Data Loaded ~~~';
                initSVGMap();
            }
        }, 500);
    }

    // Load SVG World Map
    async function loadSVGMap() {
        // SVG World Map options fallback
        if (Object.keys(options.svgMapOptions).length === 0) {
            options.svgMapOptions = { 
                libPath: 'lib/', // Point to lib-folder 
                bigMap: false, // Use small map
                showOcean: false, // Show or hide ocean layer
                showAntarctica: false, // Show or hide antarctic layer
                showInfoBox: true, // Show info box
                worldColor: '#EFEFEF', 
                labelFill: { out: '#666666',  over: '#444444',  click: '#444444' }, 
                provinceStroke: { out: '#CCCCCC',  over: '#999999',  click: '#999999' }, 
                provinceStrokeWidth: { out: '0.3',  over: '0.3',  click: '0.5' }, 
                timeControls: true, // Time data to activate time antimation controls
            };
        }
        // Init SVG World Map
        seismographMap = await svgWorldMap(options.svgMapOptions, false, colorData);
        mapSVG = seismographMap.worldMap;
        svgLoaded = true;
        return seismographMap;
    }

    // SVG map start
    function initSVGMap() {
        if (svgLoaded == true) {
            // Change start day
            if (timelineData[1] != undefined) {
                document.getElementById('map-slider').value = Object.keys(timelineData[1]).length - 12; // Start 12 months ago
            } else {
                document.getElementById('map-slider').value = Object.keys(timelineData).length - 5; // Start 5 years ago
            }
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
            // Uncheck checkbox, only for conflict map
            if (document.getElementById('predsync') != undefined) {
                document.getElementById('predsync').checked = false;
            }
            // Hide loading and show boxes and map after startup
            toggleBox('loading');
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

    // Check data source and switch loading
    function initDataLoading() {
        if (options.dataPath.indexOf('http') == -1) {
            loadTimelineData();
        } else {
            loadExternalData();
        }
    }

    // Wait for JSON load and pass data to library 
    function loadExternalData() {
        loadFile(options.dataPath, function(dataResponse) {
            var externalDataParsed = JSON.parse(dataResponse);
            //console.log(externalDataParsed);
            for (var dataObject in externalDataParsed[1]) {
                var date = externalDataParsed[1][dataObject].date;
                var country = externalDataParsed[1][dataObject].country.id;
                var value = externalDataParsed[1][dataObject].value;
                // Add timeline data
                if (timelineData[date] == undefined) {
                    timelineData[date] = {};
                }
                if (timelineData[date][country] == undefined) {
                    timelineData[date][country] = value;
                }
                // Add detail data
                if (detailData[country] == undefined) {
                    detailData[country] = {};
                }
                if (detailData[country][date] == undefined) {
                    detailData[country][date] = value;
                }
                // Add world timeline data
                if (country == '1W') {
                    timelineData[date]['World'] = value;
                }
            }
            // Add world detail data
            detailData['World'] = detailData['1W'];
            // Add chart data labels
            timelineChart.data.labels = Object.keys(timelineData);
            // Startup
            updateDetails();
            initColorData();
            updateTimeline();
        });
    }

    // Wait for JSON load and pass data to library 
    function loadTimelineData() {
        var timelineJson = options.dataPath + "Timeline.json";
        loadFile(timelineJson, function(timelineResponse) {
            var timelineDataParsed = JSON.parse(timelineResponse); 
            var timelineDataKeys = Object.keys(timelineDataParsed); 
            for (var i=0; i<timelineDataKeys.length; i++) {
                timelineData[i] = timelineDataParsed[timelineDataKeys[i]];
            }
            timelineChart.data.labels = Object.keys(timelineData[1]);
            loadDetailData();
            initColorData();
            updateTimeline();
        });
    }

    // Wait for JSON load and pass data to detail chart 
    function loadDetailData() {
        if (detailData[detailCountry] == undefined) {
            var detailJson = options.dataPath + detailCountry + ".json";
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
        if (timelineData[1] != undefined) {
            timelineDataset = timelineData[1];
        } else {
            timelineDataset = timelineData;
        }
        colorData = JSON.parse(JSON.stringify(timelineDataset)); // Copy conflict object 
        for (var date in timelineDataset) {
            for (var country in timelineDataset[date]) {
                if (timelineData[1] != undefined) {
                    var value = timelineDataset[date][country] * 255;
                    var rgb = 'rgb(255,' + (255-value) + ',' + (255-value) + ')';
                    colorData[date][country] = rgb;
                } else {
                    //var modulo = timelineDataset[date][country] % 256;
                    //colorData[date][country] = 'rgb(' + modulo + ',' + modulo + ',' + modulo + ')';
                    if (timelineDataset[date-1] != undefined) {
                        if (timelineDataset[date][country] > timelineDataset[date-1][country]) {
                            colorData[date][country] = 'rgb(200,230,200)';
                        } else {
                            colorData[date][country] = 'rgb(230,200,200)';
                        }
                    } else {
                        colorData[date][country] = 'rgb(200,200,200)';
                    }
                    // Fix French Guyana with data from France
                    if (country == 'FR') {
                        colorData[date]['GF'] = colorData[date]['FR'];
                    }
                    // Fix Western Sahara with data from Morocco
                    if (country == 'MA') {
                        colorData[date]['EH'] = colorData[date]['MA'];
                    }
                }
            }
        }
        //console.log(colorData);
    }

    // Update timeline chart
    function updateTimeline() {
        if (timelineData[1] != undefined) {
            timelineChart.data.datasets[0].data = [];
            timelineChart.data.datasets[1].data = [];
            for (var date in timelineData[1]) {
                for (var country in timelineData[1][date]) {
                    if (country == detailCountry) {
                        timelineChart.data.datasets[0].data.push(timelineData[0][date][country]);
                        timelineChart.data.datasets[1].data.push(timelineData[1][date][country]);
                    }
                }
            }
            // Sync data = prepend 6 months in prediction
            if (syncData) {
                var length = timelineChart.data.datasets[0].data.length;
                var prepend = [0, 0, 0, 0, 0, 0];
                timelineChart.data.datasets[0].data = prepend.concat(timelineChart.data.datasets[0].data);
                timelineChart.data.datasets[0].data = timelineChart.data.datasets[0].data.slice(0, length);
            }
        } else {
            timelineChart.data.datasets[0].data = [];
            for (var date in timelineData) {
                for (var country in timelineData[date]) {
                    if (country == detailCountry) {
                        timelineChart.data.datasets[0].data.push(timelineData[date][country]);
                    }
                }
            }
        }
        timelineChart.update();
    }

    // Update details
    function updateDetails() {
        if (timelineData[1] != undefined) {
            var date = Object.keys(timelineData[1])[day];
        } else {
            var date = Object.keys(timelineData)[day];
        }
        // Set vertical line
        timelineChart.data.lineAtIndex = day;
        timelineChart.update();
        // Update info
        if (detailCountry == 'World') {
            document.getElementById('timeline-title').innerHTML =  'World';
            document.getElementById('timeline-back').innerHTML =  '(click a country for details)';
        } else {
            document.getElementById('timeline-title').innerHTML = seismographMap.countries[detailCountry].name;
            document.getElementById('timeline-back').innerHTML =  '(<a onclick="mapClick(\'World\')">back to global view</a>)';
        }
        // TODO: Refactor
        var countryinfo = '';
        if (timelineData[0] != undefined && timelineData[0][date] != undefined) {
            countryinfo += '<table><tr><td><b>' + document.getElementById('timeline-title').innerHTML + '</b></td><td><b>' + date + '</b></td></tr>';
            countryinfo += '<tr><td>Probability of Conf.<br><small>(+6 months)</small></td><td>Conflict Intensity<br><small>(ground truth)</small></td></tr>';
            countryinfo += '<tr><td><b>' + timelineData[0][date][detailCountry] + '</b></td><td><b>' + timelineData[1][date][detailCountry] + '</b></td></tr>';
            countryinfo += '</table>';
        } else if (timelineData[date] != undefined) {
            if (seismographMap == undefined || seismographMap.countries[detailCountry].name == undefined) {
                var countryName = 'World';
            } else {
                var countryName = seismographMap.countries[detailCountry].name;
            }
            countryinfo = '<b>' +  countryName + '</b><br><br>' + formatInteger(detailData[detailCountry][date]);
        }
        document.getElementById('details-info').innerHTML = countryinfo;
        if (detailData[detailCountry][date] != undefined && detailData[detailCountry][date].pull != undefined) {
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
        }
        // Update detail chart and country list
        updateDetailChart();
        updateCountryList();
    }

    // Update detail chart
    // Format: [0] = pull, [1] = push
    function updateDetailChart() {
        if (timelineData[1] != undefined) {
            var date = Object.keys(timelineData[1])[day];
            detailChart.data.datasets[0].labels = Object.keys(detailData[detailCountry][date].pull);
            detailChart.data.datasets[1].labels = Object.keys(detailData[detailCountry][date].push);
            detailChart.data.datasets[0].data = changeToNegative(Object.values(detailData[detailCountry][date].pull));
            detailChart.data.datasets[1].data = Object.values(detailData[detailCountry][date].push);
        } else {
            updateTimeline(); // Not good - make better trigger for chart data copy
            detailChart.data.datasets[0].labels = timelineChart.data.datasets[0].labels;
            detailChart.data.datasets[0].data = timelineChart.data.datasets[0].data;
        }
        detailChart.update();
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
        if (timelineData[1] != undefined) {
            timelineDataset = timelineData[1];
        } else {
            timelineDataset = timelineData;
        }
        var date = Object.keys(timelineDataset)[day];
        if (seismographMap != undefined) {
            for (var country in seismographMap.countries) {
                var countryCode = seismographMap.countries[country].id;
                if (timelineDataset[date][countryCode] != undefined) {
                    if (document.getElementById(countryCode) != null) {
                        var conflictday = timelineDataset[date][countryCode];
                        var countryName = document.getElementById(countryCode).dataset.name;
                        if (timelineData[1] != undefined) {
                            var predicitonday = timelineData[0][date][countryCode];
                            if (conflictday > 0) { 
                                document.getElementById(countryCode).dataset.prediciton = predicitonday;
                            } else {
                                document.getElementById(countryCode).dataset.prediciton = '';
                            }
                        }
                        if (conflictday > 0) { 
                            document.getElementById(countryCode).dataset.conflict = conflictday;
                            document.getElementById(countryCode).innerHTML = '<span class="small red">' + formatInteger(conflictday) + '</span>';
                            if (timelineData[1] != undefined) {
                                document.getElementById(countryCode).innerHTML += '<span class="small grey">' + formatInteger(predicitonday) + '</span>';
                            }
                            document.getElementById(countryCode).innerHTML += countryName;
                        } else {
                            document.getElementById(countryCode).dataset.conflict = '';
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
        var input = document.getElementById('countries-search-input');
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
            timelineChart.options.animation.duration = 1000; // Animate lines
            updateTimeline();
            timelineChart.options.animation.duration = 0; // Don't animate lines
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
            // Toggle dark mode
            if (options.darkMode == true) { toggleDarkMode(); }
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
            // Hide info & overlay
            toggleBox('overlay');
            toggleBox('info');
            // Hide elements defined in options
            if (options.showCountryList == false) { toggleBox('countries'); }
            if (options.showDetails == false) { toggleBox('details'); }
            if (options.showTimeline == false) { toggleBox('timeline'); }
            // Load info text
            var infoText = "conflict-prediction-info.html";
            loadFile(infoText, function(infoResponse) { document.getElementById("info-inner").innerHTML = infoResponse; });
            // Set info title
            document.getElementById("details-title").innerHTML = options.infoTitle;
            // Only for Conflict AI Map
            if (options.infoTitle == 'Neural Network SHAP Interpretability') {
                document.getElementById("timeline-info").innerHTML += '<span><input type="checkbox" id="predsync" name="predsync" onclick="syncPrediction()"><label for="predsync">Sync prediction with ground truth</label></span>';
                document.getElementById("timeline-info").innerHTML += '<div id="about"><a onclick="toggleInfo()">About <i class="flaticon-question"></i></a></div>';
            }
        }
    }

    // Init Chart.js prototype options
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
        // Timeline chart
        var timelineCanvas = document.getElementById('timeline-chart-canvas').getContext('2d');
        timelineChart = new Chart(timelineCanvas, options.chartTimelineOptions);
        // Detail chart
        var detailCanvas = document.getElementById('details-chart-canvas').getContext('2d');
        detailChart = new Chart(detailCanvas, options.chartDetailOptions);
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
