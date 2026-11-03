// The base products ("blanks") the platform prints on. Every listing and every custom
// design is made from one of these. Prices are in USD.

const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const BASIC_COLORS = ['#FFFFFF', '#121212', '#1D4ED8', '#EFBD48', '#059669', '#DC2626', '#8B5CF6', '#F472B6'];

const CATALOG = [
  {
    type: 'tshirt',
    name: 'T-Shirt',
    description: '180gsm organic cotton tee, front print.',
    baseCost: 12,
    retailPrice: 29,
    sizes: APPAREL_SIZES,
    colors: BASIC_COLORS,
    customizable: true,
  },
  {
    type: 'hoodie',
    name: 'Hoodie',
    description: '400gsm heavyweight fleece hoodie, front print.',
    baseCost: 26,
    retailPrice: 59,
    sizes: APPAREL_SIZES,
    colors: BASIC_COLORS,
    customizable: true,
  },
  {
    type: 'pants',
    name: 'Pants',
    description: 'Relaxed-fit fleece joggers, leg print.',
    baseCost: 22,
    retailPrice: 49,
    sizes: APPAREL_SIZES,
    colors: BASIC_COLORS,
    customizable: true,
  },
  {
    type: 'mug',
    name: 'Mug',
    description: '11oz ceramic mug, wrap-around print, dishwasher safe.',
    baseCost: 6,
    retailPrice: 18,
    sizes: ['11oz', '15oz'],
    colors: ['#FFFFFF', '#121212', '#1D4ED8', '#DC2626'],
    customizable: true,
  },
  {
    type: 'hat',
    name: 'Cap',
    description: 'Six-panel cotton twill cap, front embroidery / print.',
    baseCost: 8,
    retailPrice: 25,
    sizes: ['One size'],
    colors: ['#FFFFFF', '#121212', '#1D4ED8', '#EFBD48', '#059669', '#DC2626'],
    customizable: true,
  },
  {
    type: 'tote',
    name: 'Tote Bag',
    description: 'Heavy canvas tote, front print.',
    baseCost: 7,
    retailPrice: 22,
    sizes: ['One size'],
    colors: ['#F5F0E6', '#121212', '#1D4ED8', '#059669'],
    customizable: true,
  },
];

const BY_TYPE = new Map(CATALOG.map((item) => [item.type, item]));

function getCatalogItem(type) {
  return BY_TYPE.get(String(type)) || null;
}

function isCatalogType(type) {
  return BY_TYPE.has(String(type));
}

module.exports = { CATALOG, getCatalogItem, isCatalogType };
