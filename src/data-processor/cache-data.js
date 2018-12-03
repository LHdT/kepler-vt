const DATA = new Map();

export const getData = (layer, x, y, z) => {
  return DATA.get(`${layer}-${x}-${y}-${z}`);
};

export const insertData = (buffer, layer, x, y, z) => {
  DATA.set(`${layer}-${x}-${y}-${z}`, buffer);
};
