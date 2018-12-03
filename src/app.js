// Copyright (c) 2018 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import React, {Component} from 'react';
import {connect} from 'react-redux';

import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';

import KeplerGl from 'kepler.gl';
import {addDataToMap, updateVisData, updateMap} from 'kepler.gl/actions';
import Processors from 'kepler.gl/processors';
import KeplerGlSchema from 'kepler.gl/schemas';


import nycTrips from './data/nyc-trips.csv';
import nycTripsSubset from './data/nyc-subset.csv';
import nycConfig from './data/nyc-config.json';
import caparicaConfig from './data/caparica-config.json';
import nycConfigCustom from './data/nyc-config-custom.json';

import downloadJsonFile from "./file-download";
import Button from './button';

// import PbfProcessor from "./pbf-processor";
import * as DataProcessor from "./data-processor/data-processor";

// const MAPBOX_TOKEN = process.env.MapboxAccessToken; // eslint-disable-line
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2lnY29ycG9yYXRpdm9qYSIsImEiOiJjaXczZ3hlc2YwMDBrMm9wYnRqd3gyMWQ0In0.wF12VawgDM31l5RcAGb6AA'; // eslint-disable-line

const tilesLoaded_ = (newTileIndices) => false;

class App extends Component {
  constructor(props) {
    super(props);
  }

  onViewportChange = (viewport, tileIndices, z) => {
    DataProcessor.getDatasets(viewport, tileIndices, z)
    .then(datasets => {
        const config = this.getMapConfig();
        this.props.dispatch(addDataToMap({datasets: datasets, config}));
    });
  };

  getTileData = () => {
    const {x, y, z} = this.currentTile_;
    if (this.lastTile_.x !== x || this.lastTile_.y !== y || this.lastTile_.z !== z) {
      this.lastTile_ = this.currentTile_;
      const {tileIndices} = this.currentTile_;

      Promise.all(tileIndices.map(({x, y, z}) => PbfProcessor.processPbfData('AOI_land', x, y, z)))
      .then(datasets => {
        const config = this.getMapConfig();
        this.props.dispatch(addDataToMap({datasets: datasets.flat(), config}))
      });
    }i
  };

  componentDidMount() {
  }

  // This method is used as reference to show how to export the current kepler.gl instance configuration
 // Once exported the configuration can be imported using parseSavedConfig or load method from KeplerGlSchema
 getMapConfig() {
   // retrieve kepler.gl store
   const {keplerGl} = this.props;
   // retrieve current kepler.gl instance store
   const {map} = keplerGl;
   // create the config object
   return KeplerGlSchema.getConfigToSave(map);
   // return KeplerGlSchema.getConfigToSave(this.props.keplerGl.map);
 }

  // This method is used as reference to show how to export the current kepler.gl instance configuration
  // Once exported the configuration can be imported using parseSavedConfig or load method from KeplerGlSchema
  exportMapConfig = () => {
   // create the config object
   const mapConfig = this.getMapConfig();
   // save it as a json file
   downloadJsonFile(mapConfig, 'kepler.gl.json');
 };

  replaceData = () => {
    // Use processCsvData helper to convert csv file into kepler.gl structure {fields, rows}
    const data = Processors.processCsvData(nycTripsSubset);
    // Create dataset structure
    const dataset = {
      data,
      info: {
        id: 'my_data'
        // this is used to match the dataId defined in nyc-config.json. For more details see API documentation.
        // It is paramount that this id mathces your configuration otherwise the configuration file will be ignored.
      }
    };
    // read the current configuration
    const config = this.getMapConfig();
    // addDataToMap action to inject dataset into kepler.gl instance
    this.props.dispatch(addDataToMap({datasets: dataset, config}));
  };

  render() {
        return (
      <div style={{position: 'absolute', width: '100%', height: '100%', minHeight: '70vh'}}>
        <h2>Copernicus CEMS Viewer</h2>
        <Button onClick={this.replaceData}>Export Config</Button>
        <AutoSizer>
          {({height, width}) => (
            <KeplerGl
              mapboxApiAccessToken={MAPBOX_TOKEN}
              id="map"
              width={width}
              height={height}
              onViewportChange={this.onViewportChange}
            />
          )}
        </AutoSizer>
      </div>
    );
  }
}

const mapStateToProps = state => state;
const dispatchToProps = dispatch => ({dispatch});

export default connect(mapStateToProps, dispatchToProps)(App);
