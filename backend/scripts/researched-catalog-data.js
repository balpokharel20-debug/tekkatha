const priceCheckedAt = '2026-10-20T12:00:00.000Z';
const imageByType = {
  Smartphones: '/assets/phone.svg',
  Laptops: '/assets/laptop.svg',
  'PC Components': '/assets/components.svg',
  Gaming: '/assets/gaming.svg',
  Accessories: '/assets/accessory.svg',
};

function product(data) {
  const highlights = [data.display, data.processor, data.memory, data.storage, data.battery, data.camera]
    .filter(Boolean)
    .join('; ');
  return {
    brand: data.brand,
    name: data.name,
    type: data.type,
    price: data.price,
    priceStatus: 'unverified',
    priceSource: '',
    priceCheckedAt,
    availability: 'in-stock',
    variant: data.variant || '',
    image: imageByType[data.type],
    display: data.display || '',
    processor: data.processor || '',
    battery: data.battery || '',
    memory: data.memory || '',
    storage: data.storage || '',
    camera: data.camera || '',
    source: '',
    note: data.note || `Nepal listing snapshot for ${data.variant || data.name}. Confirm the exact configuration and current price before deciding.`,
    description: data.description || `${data.brand} ${data.name} is listed in Nepal in the ${data.variant || 'listed configuration'}.${highlights ? ` Key listed details: ${highlights}.` : ''} The price shown is a dated listing snapshot; check the seller for current stock, warranty and final pricing.`,
    review: '',
    reviewBlocks: data.review ? [{ type: 'text', heading: 'Specification-based assessment', text: data.review }] : [],
    variants: [],
  };
}

export const products = [
  // Smartphones
  product({ brand: 'Apple', name: 'iPhone 17', type: 'Smartphones', price: 173499, variant: '8GB RAM · 256GB', display: '6.3-inch OLED · 120Hz', processor: 'Apple A19', memory: '8GB', storage: '256GB', camera: '48MP main + 48MP ultrawide', note: 'A compact flagship-sized screen, 120Hz refresh and 256GB storage in the listed configuration.', review: 'The 6.3-inch 120Hz panel and 256GB base storage make this the most balanced standard iPhone configuration in this shortlist. The main tradeoff is price: it sits well above midrange Android options, so the case for it rests on iOS, Apple’s ecosystem and long-term software support rather than raw value per rupee.' }),
  product({ brand: 'Apple', name: 'iPhone 16', type: 'Smartphones', price: 146599, variant: '8GB RAM · 128GB', display: '6.1-inch OLED', processor: 'Apple A18', memory: '8GB', storage: '128GB', camera: '48MP main + 12MP ultrawide', note: 'A lower-cost route into the current iPhone feature set, with 128GB storage.' }),
  product({ brand: 'Apple', name: 'iPhone 15', type: 'Smartphones', price: 127499, variant: '128GB', display: '6.1-inch OLED', processor: 'Apple A16', memory: '6GB', storage: '128GB', camera: '48MP main + 12MP ultrawide', note: 'The least expensive iPhone in this researched group; check the 128GB limit against your photo and video use.' }),
  product({ brand: 'Apple', name: 'iPhone 17 Pro', type: 'Smartphones', price: 236899, variant: '12GB RAM · 256GB', display: '6.3-inch OLED · 120Hz', processor: 'Apple A19 Pro', memory: '12GB', storage: '256GB', camera: 'Triple rear camera system', note: 'A small-screen Pro option for buyers who want the advanced camera tier and 256GB storage.' }),
  product({ brand: 'Apple', name: 'iPhone 17 Pro Max', type: 'Smartphones', price: 257999, variant: '12GB RAM · 256GB', display: '6.9-inch OLED · 120Hz', processor: 'Apple A19 Pro', memory: '12GB', storage: '256GB', camera: 'Triple rear camera system', note: 'The large-screen Pro configuration; compare the size and price premium with the regular Pro.' }),
  product({ brand: 'Samsung', name: 'Galaxy S26 Ultra', type: 'Smartphones', price: 224999, variant: '12GB RAM · 256GB', display: '6.9-inch AMOLED · 120Hz', processor: 'Snapdragon 8 Elite Gen 5', memory: '12GB', storage: '256GB', camera: 'Multi-camera system with 200MP main camera', note: 'A premium large-screen Samsung with a high-resolution camera system and 256GB storage.' }),
  product({ brand: 'Samsung', name: 'Galaxy Z Fold7', type: 'Smartphones', price: 279999, variant: '12GB RAM · 256GB', display: 'Foldable AMOLED · 120Hz', processor: 'Snapdragon 8 Elite', memory: '12GB', storage: '256GB', camera: 'Triple rear camera system', note: 'A foldable phone priced for buyers who will use its larger inner display regularly.' }),
  product({ brand: 'Samsung', name: 'Galaxy S26 FE', type: 'Smartphones', price: 119999, variant: '8GB RAM · 256GB', display: 'AMOLED · 120Hz', processor: 'Samsung Exynos platform', memory: '8GB', storage: '256GB', camera: 'Multi-camera system', note: 'A lower-cost S-series option with 256GB storage; confirm the exact local configuration.' }),
  product({ brand: 'Samsung', name: 'Galaxy A57 5G', type: 'Smartphones', price: 84999, variant: '8GB RAM · 256GB', display: '6.7-inch AMOLED · 120Hz', processor: 'Exynos 1680', memory: '8GB', storage: '256GB', battery: '5000mAh', camera: '50MP + 12MP + 5MP', note: 'Large 120Hz AMOLED, 256GB storage and a 5,000mAh battery in the listed version.', review: 'The listed combination is straightforward: a large 120Hz AMOLED display, 8GB memory, 256GB storage and a 5,000mAh battery. That makes the A57 a useful all-rounder on paper. Before choosing it, compare the current offer against phones with faster chipsets or longer zoom cameras; its value depends on the final price and local warranty.' }),
  product({ brand: 'Xiaomi', name: '17T', type: 'Smartphones', price: 99999, variant: '12GB RAM · 512GB', display: '6.59-inch 1.5K AMOLED · 120Hz', processor: 'MediaTek Dimensity 8500 Ultra', memory: '12GB', storage: '512GB', battery: '6500mAh · 67W charging', camera: '50MP main + 50MP 5× periscope + 12MP ultrawide', note: 'High storage, a large battery and a 5× periscope camera at a price close to NPR 1 lakh.', review: 'The specification mix stands out for this price band: 512GB storage, a 6.59-inch 120Hz AMOLED display, a 6,500mAh battery and a dedicated 5× periscope camera. Those are concrete advantages for people who shoot zoom photos or keep large offline libraries. Check that the exact 12GB/512GB variant and the stated camera configuration match the local unit.' }),
  product({ brand: 'Xiaomi', name: '17 Ultra', type: 'Smartphones', price: 200000, variant: '16GB RAM · 512GB', display: '6.9-inch AMOLED · 120Hz', processor: 'Snapdragon 8 Elite Gen 5', memory: '16GB', storage: '512GB', battery: '6000mAh', camera: '50MP + 200MP + 50MP', note: 'A photography-focused flagship listing with 16GB memory and 512GB storage.' }),
  product({ brand: 'Honor', name: '600 Pro', type: 'Smartphones', price: 129999, variant: '12GB RAM · 256GB', display: 'AMOLED · 120Hz', processor: 'Qualcomm Snapdragon platform', memory: '12GB', storage: '256GB', note: 'The higher-tier Honor 600 listing, with more memory than the standard model.' }),
  product({ brand: 'Honor', name: 'X9d', type: 'Smartphones', price: 54999, variant: '8GB RAM · 256GB', display: 'AMOLED · 120Hz', processor: 'Qualcomm Snapdragon platform', memory: '8GB', storage: '256GB', note: 'A sub-NPR 55,000 listing with 256GB storage; verify chipset and warranty for the exact Nepal variant.' }),
  product({ brand: 'OnePlus', name: 'Nord CE5', type: 'Smartphones', price: 59999, variant: 'Midrange configuration', memory: '8GB RAM', storage: '256GB', note: 'A midrange OnePlus listing around NPR 60,000; verify the exact Nepal configuration and warranty.' }),
  product({ brand: 'Vivo', name: 'V70', type: 'Smartphones', price: 84999, variant: '8GB RAM · 256GB', display: 'AMOLED · 120Hz', processor: 'Qualcomm Snapdragon platform', memory: '8GB', storage: '256GB', camera: 'Multi-camera system', note: 'A midrange phone listing with 256GB storage; compare camera priorities and support coverage.' }),
  product({ brand: 'Infinix', name: 'GT 30 Pro', type: 'Smartphones', price: 65999, variant: '8GB RAM · 256GB · Gaming Kit', display: 'AMOLED · 144Hz', processor: 'MediaTek Dimensity platform', memory: '8GB', storage: '256GB', note: 'A gaming-oriented phone listing that includes the gaming kit in the stated configuration.' }),

  // Laptops
  product({ brand: 'Lenovo', name: 'LOQ 15IRX9', type: 'Laptops', price: 176500, variant: 'Core i7-13650HX · RTX 4060 · 16GB · 512GB SSD', processor: 'Intel Core i7-13650HX', memory: '16GB RAM', storage: '512GB SSD', camera: 'NVIDIA GeForce RTX 4060', note: 'The RTX 4060 configuration targets demanding 1080p gaming and GPU-heavy creative work.', review: 'Among the listed laptops, this configuration gives the strongest graphics tier in the set, paired with a 14-core-class HX processor. It is the most expensive option here, so it suits workloads that can use the RTX 4060 rather than everyday browsing or office tasks. Check the panel, memory upgrade options and warranty terms before comparing final value.' }),
  product({ brand: 'Lenovo', name: 'LOQ 15 Ryzen 7', type: 'Laptops', price: 154999, variant: 'Ryzen 7 7840HS · RTX 4050 · 24GB · 512GB SSD', processor: 'AMD Ryzen 7 7840HS', memory: '24GB RAM', storage: '512GB SSD', camera: 'NVIDIA GeForce RTX 4050', note: 'A gaming laptop configuration with 24GB memory and an RTX 4050.' , review: 'This listing pairs a capable Ryzen 7 processor with an RTX 4050 and 24GB of system memory. That larger memory amount can help multitasking and creative applications, while the RTX 4050 sits below the RTX 4060 option in graphics headroom. It is a sensible middle choice if its price remains below the 4060 model and the display meets your needs.'}),
  product({ brand: 'Acer', name: 'Nitro 16 Ryzen 7', type: 'Laptops', price: 168999, variant: 'Ryzen 7 8845HS · RTX 4060 · 16GB RAM', processor: 'AMD Ryzen 7 8845HS', memory: '16GB RAM', camera: 'NVIDIA GeForce RTX 4060', note: 'An RTX 4060 gaming laptop option from Acer; confirm included storage and panel details.' }),
  product({ brand: 'Acer', name: 'Nitro 5 Ryzen 7', type: 'Laptops', price: 139999, variant: 'Ryzen 7 6800H · RTX 3060 · 16GB RAM', processor: 'AMD Ryzen 7 6800H', memory: '16GB RAM', camera: 'NVIDIA GeForce RTX 3060', note: 'A previous-generation gaming configuration that may offer value if the stock and warranty are confirmed.' }),
  product({ brand: 'Acer', name: 'Nitro V15', type: 'Laptops', price: 118500, variant: 'Core i5-13420H · RTX 3050 · 16GB RAM', processor: 'Intel Core i5-13420H', memory: '16GB RAM', camera: 'NVIDIA GeForce RTX 3050', note: 'The lowest-priced dedicated-GPU laptop in this shortlist; check game requirements against the RTX 3050.' }),
  product({ brand: 'ASUS', name: 'Vivobook 14X', type: 'Laptops', price: 89999, variant: 'Core i5-12500H · 16GB · 512GB SSD', processor: 'Intel Core i5-12500H', memory: '16GB RAM', storage: '512GB SSD', note: 'A portable everyday-work configuration with a performance-class H-series processor.' }),
  product({ brand: 'ASUS', name: 'Vivobook Go 15', type: 'Laptops', price: 74999, variant: 'Ryzen 5 7520U · 16GB · 512GB SSD', processor: 'AMD Ryzen 5 7520U', memory: '16GB RAM', storage: '512GB SSD', note: 'A more affordable everyday laptop listing with 16GB memory and a 512GB SSD.' }),
  product({ brand: 'Lenovo', name: 'LOQ 15 Core i5', type: 'Laptops', price: 102000, variant: 'Core i5-12450HX · RTX 2050 · 12GB RAM', processor: 'Intel Core i5-12450HX', memory: '12GB RAM', camera: 'NVIDIA GeForce RTX 2050', note: 'An entry gaming configuration; compare its RTX 2050 against the RTX 3050 Nitro before purchase.' }),
  product({ brand: 'ASUS', name: 'Vivobook 15 OLED', type: 'Laptops', price: 112000, variant: 'Core i7-1355U · 16GB · 1TB SSD', processor: 'Intel Core i7-1355U', memory: '16GB RAM', storage: '1TB SSD', display: 'OLED display', note: 'An OLED everyday laptop with 1TB storage in the listed configuration.' }),

  // PC components
  product({ brand: 'PNY', name: 'GeForce RTX 5050 Dual Fan', type: 'PC Components', price: 73999, variant: '8GB GDDR6 · Dual Fan', processor: 'PNY GeForce RTX 5050', memory: '8GB GDDR6', camera: 'Dual-fan graphics card', note: 'A current-generation 8GB graphics-card listing; compare workload benchmarks and PSU requirements before building.' }),
  product({ brand: 'MSI', name: 'RTX 3060 Ventus 2X', type: 'PC Components', price: 86000, variant: '12GB GDDR6 · Ventus 2X', processor: 'MSI GeForce RTX 3060 Ventus 2X', memory: '12GB GDDR6', camera: 'Dual-fan graphics card', note: 'A 12GB graphics-card listing; its memory capacity differs from the RTX 5050 listing in this comparison.' }),
  product({ brand: 'MSI', name: 'PRO B840M-B', type: 'PC Components', price: 20500, variant: 'AMD AM5 · DDR5 · Micro-ATX', display: 'AMD AM5 platform', processor: 'MSI PRO B840M-B motherboard', memory: 'DDR5 · up to 128GB', storage: '2× M.2 PCIe 4.0', battery: 'AMD B840 chipset', camera: 'Micro-ATX', note: 'An AM5 DDR5 motherboard with two M.2 PCIe 4.0 slots in the listed specification.' }),
  product({ brand: 'MSI', name: 'PRO B550M-P WIFI6E', type: 'PC Components', price: 21000, variant: 'AMD AM4 · DDR4 · Wi-Fi 6E', display: 'AMD AM4 platform', processor: 'MSI PRO B550M-P WIFI6E motherboard', memory: 'DDR4 · up to 128GB', storage: '2× M.2 PCIe 4.0 / 3.0', battery: 'AMD B550 chipset · Wi-Fi 6E', camera: 'Micro-ATX', note: 'An AM4 DDR4 board with onboard Wi-Fi 6E and two M.2 slots.' }),
  product({ brand: 'MSI', name: 'B550M-A PRO', type: 'PC Components', price: 17000, variant: 'AMD AM4 · DDR4 · Micro-ATX', display: 'AMD AM4 platform', processor: 'MSI B550M-A PRO motherboard', memory: 'DDR4 · up to 64GB', storage: '1× M.2', battery: 'AMD B550 chipset', camera: 'Micro-ATX', note: 'A basic AM4 board listing with one M.2 slot; confirm CPU support and BIOS version.' }),
  product({ brand: 'MSI', name: 'B450M-A PRO MAX II', type: 'PC Components', price: 13000, variant: 'AMD AM4 · DDR4 · Micro-ATX', display: 'AMD AM4 platform', processor: 'MSI B450M-A PRO MAX II motherboard', memory: 'DDR4 · up to 64GB', storage: '1× M.2 PCIe 3.0', battery: 'AMD B450 chipset', camera: 'Micro-ATX', note: 'An entry AM4 motherboard listing; confirm processor compatibility before choosing it.' }),
  product({ brand: 'Corsair', name: 'Vengeance LPX 16GB DDR4', type: 'PC Components', price: 15000, variant: '16GB · DDR4-3200 desktop memory', processor: 'Desktop memory module', memory: '16GB DDR4-3200', note: 'A single 16GB DDR4 desktop memory listing; verify whether the kit is one module or a matched pair.' }),
  product({ brand: 'Hiksemi', name: 'E1000 1TB NVMe SSD', type: 'PC Components', price: 22000, variant: '1TB · PCIe 3.0 · M.2 NVMe', processor: 'Hiksemi E1000 solid-state drive', storage: '1TB PCIe 3.0 NVMe M.2', note: 'A 1TB PCIe 3.0 M.2 NVMe storage listing; check device slot compatibility.' }),

  // Accessories
  product({ brand: 'Anker Soundcore', name: 'R50i NC', type: 'Accessories', price: 4999, variant: 'Wireless earbuds · noise cancelling', display: 'Wireless earbuds', processor: 'Active noise cancellation', storage: 'Bluetooth audio', note: 'An affordable pair of noise-cancelling true wireless earbuds.' }),
  product({ brand: 'Xiaomi', name: 'Redmi Buds 5A', type: 'Accessories', price: 1999, variant: 'Wireless earbuds', display: 'Wireless earbuds', processor: 'Bluetooth earbuds', storage: 'Bluetooth audio', note: 'A low-cost entry point for wireless listening; check the included warranty.' }),
  product({ brand: 'Ultima', name: 'Prime 1.0', type: 'Accessories', price: 2449, variant: 'True wireless earbuds', display: 'Wireless earbuds', processor: 'Bluetooth earbuds', storage: 'Bluetooth audio', note: 'A locally listed true wireless earbud option at an entry-level price.' }),
  product({ brand: 'Anker Soundcore', name: 'Liberty 4 NC', type: 'Accessories', price: 14499, variant: 'Wireless earbuds · adaptive noise cancelling', display: 'Wireless earbuds', processor: 'Adaptive noise cancellation', storage: 'Bluetooth audio', note: 'A higher-tier noise-cancelling earbud listing; compare current offer and replacement tips.' }),
  product({ brand: 'Samsung', name: 'Galaxy Watch 6 Classic 47mm', type: 'Accessories', price: 64999, variant: '47mm smartwatch', display: 'Smartwatch', processor: 'Health and fitness tracking', memory: '47mm case', storage: 'Android phone compatibility', note: 'A large-case Samsung smartwatch listing; confirm phone compatibility and warranty.' }),
  product({ brand: 'Samsung', name: 'Galaxy Watch 7 40mm', type: 'Accessories', price: 28500, variant: '40mm smartwatch', display: 'Smartwatch', processor: 'Health and fitness tracking', memory: '40mm case', storage: 'Android phone compatibility', note: 'A compact Samsung smartwatch listing at a reduced stock-clearance price.' }),
  product({ brand: 'Samsung', name: 'Galaxy Watch FE 40mm', type: 'Accessories', price: 22500, variant: '40mm smartwatch', display: 'Smartwatch', processor: 'Health and fitness tracking', memory: '40mm case', storage: 'Android phone compatibility', note: 'A more affordable Samsung wearable listing with a compact 40mm case.' }),
  product({ brand: 'Apple', name: 'Watch Series 11 46mm', type: 'Accessories', price: 83000, variant: '46mm · Aluminium', display: 'Smartwatch', processor: 'Health and fitness tracking', memory: '46mm aluminium case', storage: 'iPhone compatibility', note: 'A large-case Apple Watch listing; it is designed to pair with an iPhone.' }),
  product({ brand: 'JBL', name: 'GO 5', type: 'Accessories', price: 8999, variant: 'Portable Bluetooth speaker', display: 'Portable Bluetooth speaker', processor: 'Compact wireless audio', storage: 'Bluetooth audio', note: 'A compact JBL speaker listing for portable listening.' }),
  product({ brand: 'JBL', name: 'Clip 5', type: 'Accessories', price: 11000, variant: 'Portable Bluetooth speaker', display: 'Portable Bluetooth speaker', processor: 'Clip-on portable audio', storage: 'Bluetooth audio', note: 'A portable speaker listing with a clip-on form for carrying.' }),
  product({ brand: 'Xiaomi', name: 'Sound Pocket 5W', type: 'Accessories', price: 3999, variant: '5W portable speaker', display: 'Portable Bluetooth speaker', processor: 'Wireless audio', memory: '5W output', storage: 'Bluetooth audio', note: 'A small 5W speaker listing for personal listening and travel.' }),
  product({ brand: 'JBL', name: 'PartyBox 120', type: 'Accessories', price: 60000, variant: 'Party speaker', display: 'Portable party speaker', processor: 'High-output wireless audio', storage: 'Bluetooth audio', note: 'A larger party speaker listing; check weight and power needs for your setup.' }),
  product({ brand: 'Xiaomi', name: 'Sound Outdoor 30W', type: 'Accessories', price: 9799, variant: '30W portable speaker', display: 'Portable Bluetooth speaker', processor: 'Wireless outdoor audio', memory: '30W output', storage: 'Bluetooth audio', note: 'A 30W portable speaker listing; compare size and battery details before choosing.' }),
  product({ brand: 'Ultima', name: 'Soundbox S50', type: 'Accessories', price: 6449, variant: 'Portable Bluetooth speaker', display: 'Portable Bluetooth speaker', processor: 'Wireless audio', storage: 'Bluetooth audio', note: 'A compact locally available speaker listing for everyday use.' }),
  product({ brand: 'JBL', name: 'Flip 7', type: 'Accessories', price: 22499, variant: 'Portable Bluetooth speaker', display: 'Portable Bluetooth speaker', processor: 'Wireless portable audio', storage: 'Bluetooth audio', note: 'A mid-size JBL speaker listing; verify the exact model, warranty and stock.' }),

  // Gaming displays
  product({ brand: 'Dahua', name: 'DHI-LM25-E231B', type: 'Gaming', price: 22000, variant: '24.5-inch · FHD IPS · 180Hz', display: '24.5-inch FHD IPS · 180Hz', processor: '180Hz · 1ms MPRT / 0.5ms OD', memory: '3-year warranty', storage: 'DisplayPort 1.4 · HDMI 2.0', note: 'A 24.5-inch 180Hz IPS monitor listed with a three-year warranty and HDMI/DisplayPort.' }),
  product({ brand: 'MSI', name: 'MAG 321CQF E18', type: 'Gaming', price: 52000, variant: '31.5-inch · WQHD Rapid VA · 180Hz · curved', display: '31.5-inch WQHD Rapid VA · 180Hz · 1500R', processor: '180Hz · 0.5ms GtG', storage: 'HDMI · DisplayPort', note: 'A curved 31.5-inch WQHD 180Hz monitor listing for buyers who prefer a larger, sharper gaming display.' }),
];
const guide = ({ title, category, excerpt, image, read, kind, body, productIds, guideProducts = [] }) => ({
  title,
  category,
  excerpt,
  image,
  read,
  author: 'Tekkatha Editorial',
  kind,
  status: 'published',
  isSample: false,
  body,
  productIds,
  guideProducts,
});

const picks = (entries) => entries.map(([productId, description]) => ({ productId, description }));

export const articles = [
  guide({
    title: 'Best Phones Under NPR 100,000 in Nepal: What to Prioritize in 2026',
    category: 'Buying Guides',
    excerpt: 'A shortlist built around current Nepal listing snapshots, with clear tradeoffs in display, storage, battery and camera hardware.',
    image: '/assets/phone.svg', read: 6, kind: 'Buying Guide',
    productIds: ['honor-x9d', 'samsung-galaxy-a57-5g', 'oneplus-nord-ce5', 'xiaomi-17t'],
    guideProducts: picks([
      ['honor-x9d', 'A lower-cost pick in this group with 256GB listed storage. Confirm the exact chipset and warranty on the Nepal variant.'],
      ['samsung-galaxy-a57-5g', 'The large-screen option, with a 6.7-inch 120Hz AMOLED panel and 5,000mAh battery in the listed model.'],
      ['oneplus-nord-ce5', 'A midrange alternative for buyers who want a clean balance of performance and battery; check the exact storage and local support.'],
      ['xiaomi-17t', 'The camera-and-storage pick on paper: 512GB listed storage, a 6,500mAh battery and a dedicated 5× periscope camera.'],
    ]),
    body: [
      { heading: 'Start with the feature you will notice every day', text: 'Under NPR 100,000, the strongest choice depends on what you use most. A bright, smooth screen matters for daily scrolling; storage matters if you keep photos and video offline; battery and charging matter if you are away from a desk. A single “best phone” label hides those differences.' },
      { heading: 'The tradeoffs in this shortlist', text: 'The Honor X9d starts at the lowest listed price here. Samsung’s Galaxy A57 5G gives you a larger 120Hz AMOLED display and a 5,000mAh battery. Xiaomi’s 17T asks close to NPR 1 lakh but pairs 512GB storage with a 6,500mAh battery and a 5× periscope camera. The OnePlus Nord CE5 is a balanced alternative, but confirm its exact Nepal configuration before comparing it.' },
      { heading: 'A quick way to choose', text: 'Choose the A57 if display size and familiar Samsung support matter most. Consider the 17T if zoom photography, storage and battery capacity are priorities. Choose the X9d to spend less, after checking the local version. Pick the Nord CE5 only after confirming the exact variant and warranty that the seller is offering.' },
      { heading: 'Prices and stock change', text: 'Prices shown below are retailer listing snapshots checked on 20 October 2026. Offers, stock and configuration can change; confirm the final Nepal price and warranty with a seller before making a decision. No retailer checkout links are attached to these listings.' },
    ],
  }),
  guide({
    title: 'Gaming Laptops from NPR 118,500 to 176,500: RTX 3050, 4050 or 4060?',
    category: 'Buying Guides',
    excerpt: 'Compare three Nepal-listed laptops by graphics tier, processor and memory before spending more on a gaming machine.',
    image: '/assets/laptop.svg', read: 6, kind: 'Buying Guide',
    productIds: ['acer-nitro-v15', 'lenovo-loq-15-ryzen-7', 'lenovo-loq-15irx9'],
    guideProducts: picks([
      ['acer-nitro-v15', 'The entry point: Core i5-13420H, RTX 3050 and 16GB memory in the listing.'],
      ['lenovo-loq-15-ryzen-7', 'The middle tier: Ryzen 7 7840HS, RTX 4050 and a listed 24GB of memory.'],
      ['lenovo-loq-15irx9', 'The highest graphics tier here: Core i7-13650HX, RTX 4060, 16GB memory and a 512GB SSD.'],
    ]),
    body: [
      { heading: 'Pay for the graphics tier you can use', text: 'The RTX 3050, RTX 4050 and RTX 4060 sit in distinct price brackets in these local listings. The cheaper Nitro V15 is for lighter gaming and GPU-accelerated tasks. The RTX 4050 LOQ raises the graphics tier and lists 24GB of memory. The RTX 4060 LOQ is the most expensive, but it gives the strongest GPU configuration in this three-way comparison.' },
      { heading: 'Check the parts beyond the GPU', text: 'Gaming performance also depends on the laptop’s display, cooling, GPU power limit, memory layout and whether storage can be upgraded. Those details are not complete in every listing here, so ask for the exact panel resolution and refresh rate, installed SSD size, RAM slots, warranty and power limit before comparing final prices.' },
      { heading: 'Who should choose each one?', text: 'The Nitro V15 makes sense when the budget is fixed near NPR 120,000. The Ryzen 7 LOQ sits between the other two and has the largest listed memory amount. The i7/RTX 4060 LOQ is the pick for heavier games or GPU workloads, provided the extra spend is justified by your use.' },
      { heading: 'Listing snapshot', text: 'The prices in the comparison are Nepal retailer listing snapshots checked on 20 October 2026. They are not a live price feed. Confirm stock, panel configuration and warranty before buying.' },
    ],
  }),
  guide({
    title: 'Samsung Galaxy A57 vs Xiaomi 17T vs OnePlus Nord CE5: A Nepal Phone Comparison',
    category: 'Smartphones',
    excerpt: 'Three midrange phones, three different strengths: screen and support, camera hardware, or everyday balance.',
    image: '/assets/phone.svg', read: 5, kind: 'Comparison',
    productIds: ['samsung-galaxy-a57-5g', 'xiaomi-17t', 'oneplus-nord-ce5'],
    body: [
      { heading: 'The short version', text: 'The Galaxy A57 5G emphasizes a large 120Hz AMOLED display and a familiar Samsung experience. The Xiaomi 17T brings the largest listed storage, a 6,500mAh battery and a dedicated 5× periscope camera. The Nord CE5 belongs in the same shortlist, but verify its exact Nepal configuration before treating the price as directly comparable.' },
      { heading: 'Screen, camera and battery', text: 'Samsung lists a 6.7-inch 120Hz AMOLED panel and 5,000mAh battery for the A57. Xiaomi lists a 6.59-inch 1.5K 120Hz AMOLED screen, 512GB storage, a 6,500mAh battery and a 50MP periscope lens with 5× optical reach. Those are concrete hardware differences; the better fit depends on whether you prefer Samsung’s large panel or Xiaomi’s zoom and capacity.' },
      { heading: 'Which one should you shortlist?', text: 'Choose the A57 if you prefer a larger display and Samsung’s local support ecosystem. Choose the 17T if zoom photos, lots of storage and a larger battery matter more. Compare the Nord CE5 after confirming its processor, camera configuration, storage and warranty for the unit actually offered in Nepal.' },
      { heading: 'Snapshot prices', text: 'The prices below were collected from Nepal retailer listings checked on 20 October 2026. The displayed prices and availability can change, and the retailer links are intentionally not attached yet.' },
    ],
  }),
  guide({
    title: 'RTX 5050 vs RTX 3060 in Nepal: Newer 8GB Card or Older 12GB Card?',
    category: 'PC Components',
    excerpt: 'A spec-led comparison of two locally listed graphics cards, with a reminder to check benchmarks, power and actual stock.',
    image: '/assets/components.svg', read: 5, kind: 'Comparison',
    productIds: ['pny-geforce-rtx-5050-dual-fan', 'msi-rtx-3060-ventus-2x'],
    body: [
      { heading: 'The headline difference is memory capacity', text: 'The PNY listing is for an RTX 5050 with 8GB GDDR6, while the MSI RTX 3060 Ventus 2X listing has 12GB GDDR6. More memory can help with larger textures and some creator workloads, but it does not determine performance on its own.' },
      { heading: 'Compare benchmarks for your workload', text: 'The newer generation can bring updated features, but the two models should be compared using benchmarks for the games, rendering tools or AI workloads you actually run. Check current driver support, card dimensions, power connectors, power supply requirements and warranty before selecting either card.' },
      { heading: 'Build compatibility matters', text: 'A graphics card is only one part of a balanced PC. Confirm case clearance, PSU capacity, motherboard slot, monitor resolution and CPU pairing. The prices in the table are listing snapshots and should not be treated as a performance score.' },
      { heading: 'Price note', text: 'These Nepal prices were checked on 20 October 2026. The listings showed the cards as available at the time; inventory and seller pricing can change.' },
    ],
  }),
  guide({
    title: 'Dahua 180Hz IPS vs MSI 180Hz WQHD: Which Gaming Monitor Fits Your Desk?',
    category: 'Gaming',
    excerpt: 'Compare an affordable 24.5-inch Full HD IPS monitor with a larger curved WQHD display.',
    image: '/assets/gaming.svg', read: 4, kind: 'Comparison',
    productIds: ['dahua-dhi-lm25-e231b', 'msi-mag-321cqf-e18'],
    body: [
      { heading: 'Similar refresh rate, different experience', text: 'Both listings specify a 180Hz refresh rate. The Dahua is a 24.5-inch Full HD IPS monitor; the MSI is a 31.5-inch curved WQHD Rapid VA panel. The Dahua is the lower-cost option for compact desks and competitive play. The MSI offers more screen area and a sharper 2560×1440 resolution.' },
      { heading: 'Consider your graphics card', text: 'Driving a WQHD display at high frame rates takes more GPU power than Full HD. If your PC is built around an entry-level graphics card, the Dahua’s resolution may be easier to use at high refresh rates. A stronger GPU makes the MSI’s extra resolution more appealing.' },
      { heading: 'Check the stand and connections', text: 'The Dahua listing specifies DisplayPort 1.4 and HDMI 2.0, plus a three-year warranty. The MSI listing shows HDMI and DisplayPort. Confirm exact port versions, stand adjustment, dead-pixel policy and warranty coverage with the seller before comparing the final price.' },
      { heading: 'Listing snapshot', text: 'Prices shown are Nepal listing snapshots checked on 20 October 2026. Availability and prices may change.' },
    ],
  }),
  guide({
    title: 'Choosing an AM4 or AM5 Motherboard for a Nepal PC Build',
    category: 'PC Builds',
    excerpt: 'Compare socket, memory generation and storage expansion before choosing a motherboard for a new build or upgrade.',
    image: '/assets/components.svg', read: 5, kind: 'Build Guide',
    productIds: ['msi-pro-b840m-b', 'msi-pro-b550m-p-wifi6e', 'msi-b550m-a-pro'],
    body: [
      { heading: 'Choose the CPU platform first', text: 'The MSI PRO B840M-B is an AM5 board built for DDR5 memory. The two B550 boards are AM4 and use DDR4. Those sockets are not interchangeable: pick the motherboard that matches the processor you plan to install, and verify the supported CPU list and BIOS version.' },
      { heading: 'Compare memory and storage expansion', text: 'The B840M-B listing supports DDR5 up to 128GB and has two M.2 PCIe 4.0 slots. The PRO B550M-P WIFI6E listing supports DDR4 up to 128GB and has two M.2 slots. The B550M-A PRO listing supports DDR4 up to 64GB and has one M.2 slot. That can affect later memory and SSD upgrades.' },
      { heading: 'Budget for the whole platform', text: 'The motherboard price is only one part of the build cost. An AM5/DDR5 setup may require a new CPU and memory, while AM4/DDR4 can make sense for an existing compatible system. Also include the power supply, case, cooling and storage in the budget.' },
      { heading: 'Before checkout', text: 'These listed prices were checked on 20 October 2026. Confirm stock, warranty, chipset, exact revision and processor compatibility with the seller before purchasing.' },
    ],
  }),
];
