/**
 * Normalizes brand names across the application so that casing variations
 * (e.g., "LOGITECH", "logitech", "Logitech") map to a single, clean canonical brand name.
 */
export function normalizeBrandName(brand: string): string {
  if (!brand || !brand.trim()) return "Generic";
  const clean = brand.trim().toLowerCase();

  const brandOverrides: Record<string, string> = {
    hp: "HP",
    "hewlett packard": "HP",
    dell: "Dell",
    lenovo: "Lenovo",
    apple: "Apple",
    samsung: "Samsung",
    epson: "Epson",
    anker: "Anker",
    xiaomi: "Xiaomi",
    huawei: "Huawei",
    asus: "Asus",
    acer: "Acer",
    logitech: "Logitech",
    microsoft: "Microsoft",
    sony: "Sony",
    canon: "Canon",
    lg: "LG",
    jbl: "JBL",
    amd: "AMD",
    intel: "Intel",
    nvidia: "NVIDIA",
    "tp-link": "TP-Link",
    tplink: "TP-Link",
    sandisk: "SanDisk",
    seagate: "Seagate",
    wd: "Western Digital",
    "western digital": "Western Digital",
    ugreen: "UGREEN",
    orico: "Orico",
    google: "Google",
    realme: "Realme",
    oppo: "Oppo",
    oneplus: "OnePlus",
    vivo: "Vivo",
    tecno: "Tecno",
    techno: "Tecno",
    infinix: "Infinix",
    itel: "itel",
    nokia: "Nokia",
    msi: "MSI",
    gigabyte: "Gigabyte",
    corsair: "Corsair",
    kingston: "Kingston",
    hyperx: "HyperX",
    razer: "Razer",
    steelseries: "SteelSeries",
    soundcore: "Soundcore",
    baseus: "Baseus",
    toshiba: "Toshiba",
    brother: "Brother",
    hikvision: "Hikvision",
    dahua: "Dahua",
    "custom rigs": "Custom Rigs",
    "custom pc": "Custom Rigs"
  };

  if (brandOverrides[clean]) {
    return brandOverrides[clean];
  }

  // Convert to Title Case for generic strings (e.g., "LOGITECH G" -> "Logitech G")
  return clean
    .split(/\s+/)
    .map((word) => {
      if (word === "pc" || word === "tv" || word === "usb" || word === "ssd" || word === "hdd" || word === "hdmi") {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}
