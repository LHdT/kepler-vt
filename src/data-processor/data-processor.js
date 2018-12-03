import Processors from 'kepler.gl/processors';

import * as PbfProcessor from "./pbf-processor";
import * as __Cache__ from './cache-data';

const PBF_SERVER_URL = 'http://b.g18102.s3-eu-west-1.amazonaws.com/catalog_jrc_v0/COP_EMS_DD/EMSN034/01COSTADACAPARICA/v1';
const LAYERS = [
  'AOI_land',
  'M2_Vulnerability_Phys'
];

const tileUrl_ = (layer, x, y, z) => `${PBF_SERVER_URL}/${layer}/vector_tiles/${z}/${x}/${y}.pbf`;

const requestData_ = (layer, x, y, z) => {
  return fetch(tileUrl_(layer, x, y, z))
    .then(response => response.ok ? response.arrayBuffer() : Promise.reject());
};

const getLayerFeatures_ = (layer, viewport, tileIndices, z) => Promise.all(
  tileIndices.map(tile => new Promise(success => {
    const {x, y, z} = tile;
    let features = __Cache__.getData(layer, x, y, z);
    if (!features) {
      requestData_(layer, x, y, z)
      .then(buffer => PbfProcessor.getFeaturesFromBuffer(buffer, x, y, z))
      .then(features => {
        __Cache__.insertData(features, layer, x, y, z);
        return features;
      })
      .catch(e => {
        __Cache__.insertData([], layer, x, y, z);
      });
    }
    else {
      success(features);
    }
  }))
);

// export const getDatasets = (viewport, tileIndices, z) => new Promise(s => s);


export const getDatasets = (viewport, tileIndices, z) => Promise.all(
  LAYERS.map(layer =>
    getLayerFeatures_(layer, viewport, tileIndices, z)
    .then(featuresArr => {
      let features = [];
      featuresArr.forEach(f => {
        if (f.length > 0) {
          features = features.concat(f);
        }
      });
      return {
        "type": "FeatureCollection",
        features
      };
    })
    .then(geojson => Processors.processGeojson(geojson))
    .then(data => { return { data, info: { id: layer } };})
  )
);