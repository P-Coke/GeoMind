var collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED');
var derived = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
Export.image.toDrive({

