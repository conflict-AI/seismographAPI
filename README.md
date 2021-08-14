
SeismographAPI
==============

🗺 A Javascript API library built upon [SVG World Map JS](https://github.com/raphaellepuschitz/SVG-World-Map) and [Chart.js](https://github.com/chartjs/Chart.js) for time series data visualization. 

> ***Attention:*** This project is under development and currently in early alpha phase. Detailed installation and integration with more examples will follow soon. 

This API provides a quick integration for the projection of time series data sets on world maps. Use this API library for **Choropleth Maps** for **Data Visualization** of scientific and statistical data, or as **Interactive Map** for your article, paper, website or app. 

The underlying [SVG World Map JS](https://github.com/raphaellepuschitz/SVG-World-Map) is just a small library for fast and simple data projection. If you need more advanced features for data visualization and SVGs, have a look at [d3js](https://github.com/d3/d3).  


Abstract
--------

Effective decision-making for crisis mitigation increasingly relies on visualisation of large amounts of data. While interactive dashboards are more informative than static visualisations, their development is far more time-demanding and requires a range of technical and financial capabilities. There are few open-source libraries available, which is blocking contributions from low-resource environments and impeding rapid crisis responses. To address these limitations, we present **SeismographAPI**, an open-source library for visualising temporal-spatial crisis data on the country- and sub-country-level in two use cases — [Conflict Prediction Map](https://conflict-ai.org/conflict-map/) and [COVID-19 Monitoring Map](https://conflict-ai.org/covid-map/). The library will provide easy-to-use data connectors, broad functionality, clear documentation and run time-efficiency.

> **&raquo; [Read the full Paper](https://arxiv.org/abs/2107.12443)**
>
> **&raquo; [Watch Video](https://www.youtube.com/watch?v=eTeoe8og844)**

[![SeismographAPI Video](https://img.youtube.com/vi/eTeoe8og844/maxresdefault.jpg)](https://www.youtube.com/watch?v=eTeoe8og844 "SeismographAPI")


Showcase
--------

| [Conflict prediction interpretability map](https://conflict-ai.org/conflict-map/) | [COVID-19 Corona virus world map](https://conflict-ai.org/covid-map/) | 
|:---:|:---:|
| ![](https://conflict-ai.org/conflict-map/SeismographAPI-conflict.png) | ![](https://conflict-ai.org/covid-map/SeismographAPI-covid.png) | 


All Demos
---------

* **[Basics](https://conflict-ai.github.io/seismographAPI/basics.html)**
* **[World Bank Data Example](https://conflict-ai.github.io/seismographAPI/worldbank-data.html)**
* **[COVID-19 Corona virus world map](https://conflict-ai.github.io/seismographAPI/covid-map.html)**
* **[Conflict prediction interpretability map](https://conflict-ai.github.io/seismographAPI/conflict-map.html)**


Installation & Basic Setup
--------------------------

<table><tr><td> &raquo; Demo: <a href="https://conflict-ai.github.io/seismographAPI/basics.html">Basics</a></td></tr></table>

> ***Attention:*** As this project is currently under development, the installation may change in future versions. 


Add the `/src/` and `/lib/` folders to your project, include [seismographAPI.js](./src/seismographAPI.js) in your HTML document, add a data source, then call the library:

```html
<script src="src/seismographAPI.js"></script>
<script>
    var myDataPath = 'https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2010:2020&per_page=3000';
    seismographAPI({ dataPath: myDataPath });
</script>
```

This will load the SVG map and Chart.js via Javascript injection and initialize the library.   
So far for the basic setup.


Custom Options
--------------

<table><tr><td> &raquo; Demo: <a href="https://conflict-ai.github.io/seismographAPI/worldbank-data.html">World Bank Data Example</a></td></tr></table>
<table><tr><td> &raquo; Demo: <a href="https://conflict-ai.github.io/seismographAPI/conflict-map.html">Conflict prediction interpretability map</a></td></tr></table>
  
* All default options can be overruled by passing an object of custom options
* Set `dataPath ` to your data source. This is the only parameter which is mandatory!
* `showCountryList`, `showDetails`, `showTimeline` and `darkMode` will toggle these functions
* `svgMapOptions` are passed through, please see [SVG World Map JS](https://github.com/raphaellepuschitz/SVG-World-Map) for more information
* `chartDetailOptions` and `chartTimelineOptions` are passed through, please see [Chart.js](https://github.com/chartjs/Chart.js) for more information

```js
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
```

The custom options are passed as a parameter list to the map at startup. You can either hand them over as an object similar to the one above: 

```js
seismographAPI(options); 
```

Or as inline parameter: 

```js
seismographAPI({ dataPath: 'data/' });
```


Further Development & Changelog
-------------------------------

<details>
<summary><b>TODOs</b></summary>  
  
* Add color options
* Add more charts
* Add more data sources
</details>

<details>
<summary><b>Done</b></summary>  

* 0.2.4
  * Added basic example
  * Added fallback options for Chart.js
  * Updated README
* 0.2.3
  * Improved World Bank data example
* 0.2.2
  * Added external data load
  * Added World Bank data example
  * Added fallback options for SVG World Map library
* 0.2.1
  * Added data path
* 0.2.0
  * Added options
  * Outsourced options for charts and map
  * Renamed charts
* 0.1.9
  * Fixed path bugs in covid map
* 0.1.8
  * Added copy of conflict map and covid map
  * Added covid data
* 0.1.7
  * Modified data import
  * Combined conflict timeline data
* 0.1.6
  * Added UI generator
  * Modified icon font
  * Outsourced info text
* 0.1.5
  * Fixed library path bug
* 0.1.4
  * Converted seismographAPI() to encapsulated function
* 0.1.3
  * Added README and LICENSE
* 0.1.2
  * Rebased JS libraries and source files
  * Base integration for conflict prediction map via seismographAPI
* 0.1.1
  * Rebased /lib and /data folder
* 0.1.0
  * Updated info	
* 0.0.9
  * Added favicon
  * Modified icon font
  * Updated info
* 0.0.8
  * Added dark mode
  * Modified UI
* 0.0.7
  * Added sync prediction function
  * Added overlay for info box
* 0.0.6
  * Added new shapley data
* 0.0.5
  * Added vertical line drag handler to conflict graph
  * Removed time slider drag handler
  * Added keys to shapley graph
  * Modified tooltips and labels
* 0.0.4
  * Added shapley data for countries, added conflict prediction, added shapley and conflict graph, minor changes* 0.0.3
  * Added SVG World Map library to project
  * Added JS and CSS files 
  * moved conflict.json to data folder
* 0.0.2 
  * Minor cleanup and changes
* 0.0.1
  * Base implementation of SVG World Map library
  * Base implementation of conflict data
</details>


About
-----

SeismographAPI is developed by [Niklas Stöhr](https://niklas-stoehr.com/) and [Raphael Lepuschitz](https://lepuschitzmedia.com/).


License
-----------------------------

SeismographAPI is available under the [MIT license](https://opensource.org/licenses/MIT).
