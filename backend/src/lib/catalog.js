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
    name: 'Joggers',
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
  {
    type: 'beanie',
    name: 'Beanie',
    description: 'Ribbed acrylic knit beanie with a fold-over cuff, embroidered or patch print.',
    baseCost: 9,
    retailPrice: 24,
    sizes: ['One size'],
    colors: ['#121212', '#FFFFFF', '#1D4ED8', '#DC2626', '#059669', '#EFBD48'],
    customizable: true,
  },
  {
    type: 'cup',
    name: 'Takeaway Cup (50-pack)',
    description: '12oz double-wall paper cups with a printed sleeve, sold in packs of 50. Built for cafés and events.',
    baseCost: 15,
    retailPrice: 35,
    sizes: ['8oz', '12oz', '16oz'],
    colors: ['#C9A77C', '#FFFFFF', '#121212'],
    customizable: true,
  },
  {
    type: 'bottle',
    name: 'Water Bottle',
    description: '750ml insulated stainless steel bottle, laser-engraved or UV-printed wrap.',
    baseCost: 11,
    retailPrice: 32,
    sizes: ['500ml', '750ml'],
    colors: ['#D7DBE0', '#121212', '#FFFFFF', '#1D4ED8', '#059669', '#F472B6'],
    customizable: true,
  },
  {
    type: 'phonecase',
    name: 'Phone Case',
    description: 'Slim impact-resistant case, full-back print.',
    baseCost: 7,
    retailPrice: 24,
    sizes: ['iPhone 15', 'iPhone 15 Pro', 'iPhone 16', 'iPhone 16 Pro', 'Galaxy S24', 'Pixel 9'],
    colors: ['#121212', '#FFFFFF', '#1D4ED8', '#F472B6'],
    customizable: true,
  },
  {
    type: 'poster',
    name: 'Poster',
    description: 'Museum-grade matte paper, optional frame (the product color is the frame).',
    baseCost: 8,
    retailPrice: 25,
    sizes: ['A3', 'A2', '18x24in'],
    colors: ['#121212', '#FFFFFF', '#C9A77C'],
    customizable: true,
  },
  {
    type: 'sticker',
    name: 'Sticker',
    description: 'Die-cut waterproof vinyl sticker.',
    baseCost: 1.5,
    retailPrice: 4,
    sizes: ['3in', '4in', '5in'],
    colors: ['#FFFFFF', '#121212', '#EFBD48', '#8B5CF6'],
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
