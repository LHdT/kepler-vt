import { VectorTile } from '@mapbox/vector-tile';
import Processors from 'kepler.gl/processors';
import Protobuf from 'pbf';

export function processPbfData(layer, x, y, z) {
  return getFeaturesFromPbf(layer, x, y, z)
    .then(features => Processors.processGeojson({
      "type": "FeatureCollection",
      features
    }): null)
    .then(data => { return { data, info: { id: layer } }; });
};

export function getFeaturesFromPbf(layer, x, y, z) {
  const url = `http://b.g18102.s3-eu-west-1.amazonaws.com/catalog_jrc_v0/COP_EMS_DD/EMSN034/01COSTADACAPARICA/v1/${layer}/vector_tiles/${z}/${x}/${y}.pbf`;
  return fetch(url)
    .then(response => response.ok ? response.arrayBuffer() : Promise.reject())
    .then(buffer => vectorTileToGeoJSON(buffer, x, y, z))
};

export const getFeaturesFromBuffer = (buffer, x, y, z) => vectorTileToGeoJSON(buffer, x, y, z);

export function vectorTileToGeoJSON(buffer, x, y, z) {
  const tile = new VectorTile(new Protobuf(buffer));
  const features = [];
  for (const layerName in tile.layers) {
    const vectorTileLayer = tile.layers[layerName];
    for (let i = 0; i < vectorTileLayer.length; i++) {
      const vectorTileFeature = vectorTileLayer.feature(i);
      const feature = vectorTileFeature.toGeoJSON(x, y, z);
      features.push(feature);
    }
  }
  return features;
};
