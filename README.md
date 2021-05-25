
SeismographAPI
==============

🗺 A Javascript API library built upon [SVG World Map JS](https://github.com/raphaellepuschitz/SVG-World-Map) and [Chart.js](https://github.com/chartjs/Chart.js) for time series data visualization. 

> ***Attention:*** This project is under development and currently in early alpha phase. Detailed installation and integration with more examples will follow soon. 

This API provides a quick integration for the projection of time series data sets on world maps. Use this API library for **Choropleth Maps** for **Data Visualization** of scientific and statistical data, or as **Interactive Map** for your article, paper, website or app. 

The underlying [SVG World Map JS](https://github.com/raphaellepuschitz/SVG-World-Map) is just a small library for fast and simple data projection. If you need more advanced features for data visualization and SVGs, have a look at [d3js](https://github.com/d3/d3).  


Abstract
--------

Effective decision-making for crisis mitigation increasingly relies on visualisation of large amounts of data. While interactive dashboards are more informative than static visualisations, their development is far more time-demanding and requires a range of technical and financial capabilities. There are few open-source libraries available, which is blocking contributions from low-resource environments and impeding rapid crisis responses. To address these limitations, we present **SeismographAPI**, an open-source library for visualising temporal-spatial crisis data on the country- and sub-country-level in two use cases — [Conflict Prediction Map](https://conflict-ai.org/conflict-map/) and [COVID-19 Monitoring Map](https://conflict-ai.org/covid-map/). The library will provide easy-to-use data connectors, broad functionality, clear documentation and run time-efficiency.


Showcase
--------

| [Conflict prediction interpretability map](https://conflict-ai.org/conflict-map/) | [COVID-19 Corona virus world map](https://conflict-ai.org/covid-map/) | 
|:---:|:---:|
| ![](https://conflict-ai.org/conflict-map/SeismographAPI-conflict.png) | ![](https://conflict-ai.org/covid-map/SeismographAPI-covid.png) | 


Installation
------------

> ***Attention:*** As this project is currently under development, the installation may change in future versions. 


Add the `/src/` and `/lib/` folders to your project, include [seismographAPI.js](./src/seismographAPI.js) in your HTML document, then call the library:

```html
<script src="src/seismographAPI.js"></script>
<script>seismographAPI()</script>
```

This will load the SVG map and Chart.js via Javascript injection and initialize the library.   
So far for the basic setup.


Further Development & Changelog
-------------------------------

<details>
<summary><b>TODOs</b></summary>  
  
* Add more examples
* Improve data conversion
</details>

<details>
<summary><b>Done</b></summary>  

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


License
-----------------------------

SeismographAPI is available under the [MIT license](https://opensource.org/licenses/MIT).
