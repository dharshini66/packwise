import { PrismaClient, JourneyType, ItemCategory } from "@prisma/client";

export const PRE_MADE_BLUEPRINTS = [
  {
    id: "pm-beach",
    name: "Beach Escape",
    type: JourneyType.BEACH_ESCAPE,
    items: [
      { name: "Passport & Tickets", category: ItemCategory.DOCUMENTS, quantity: 1 },
      { name: "Swimwear", category: ItemCategory.CLOTHING, quantity: 2 },
      { name: "Sunscreen SPF 50", category: ItemCategory.TOILETRIES, quantity: 1 },
      { name: "Beach Towel", category: ItemCategory.ACCESSORIES, quantity: 1 },
      { name: "Sunglasses", category: ItemCategory.ACCESSORIES, quantity: 1 },
      { name: "Light T-Shirts", category: ItemCategory.CLOTHING, quantity: 4 },
      { name: "Shorts", category: ItemCategory.CLOTHING, quantity: 3 },
      { name: "Flip Flops", category: ItemCategory.CLOTHING, quantity: 1 },
      { name: "Hat / Cap", category: ItemCategory.ACCESSORIES, quantity: 1 },
      { name: "After-sun Lotion", category: ItemCategory.TOILETRIES, quantity: 1 },
    ]
  },
  {
    id: "pm-business",
    name: "Business Summit",
    type: JourneyType.BUSINESS,
    items: [
      { name: "Conference Ticket / ID", category: ItemCategory.DOCUMENTS, quantity: 1 },
      { name: "Laptop & Charger", category: ItemCategory.ELECTRONICS, quantity: 1 },
      { name: "Formal Suit", category: ItemCategory.CLOTHING, quantity: 1 },
      { name: "Ironed Shirts", category: ItemCategory.CLOTHING, quantity: 3 },
      { name: "Notebook & Pen", category: ItemCategory.OTHER, quantity: 1 },
      { name: "Business Cards", category: ItemCategory.OTHER, quantity: 20 },
      { name: "Deodorant", category: ItemCategory.TOILETRIES, quantity: 1 },
      { name: "Phone Charger / Powerbank", category: ItemCategory.ELECTRONICS, quantity: 1 },
      { name: "Smart Shoes", category: ItemCategory.CLOTHING, quantity: 1 },
    ]
  },
  {
    id: "pm-mountain",
    name: "Mountain Trek",
    type: JourneyType.ADVENTURE,
    items: [
      { name: "Hiking Boots", category: ItemCategory.CLOTHING, quantity: 1 },
      { name: "Thermal Layers", category: ItemCategory.CLOTHING, quantity: 2 },
      { name: "Windbreaker / Raincoat", category: ItemCategory.CLOTHING, quantity: 1 },
      { name: "First Aid Kit", category: ItemCategory.MEDICINE, quantity: 1 },
      { name: "Compass / GPS Map", category: ItemCategory.ACCESSORIES, quantity: 1 },
      { name: "Water Purification Tablets", category: ItemCategory.MEDICINE, quantity: 1 },
      { name: "Headlamp & Batteries", category: ItemCategory.ELECTRONICS, quantity: 1 },
      { name: "Energy Bars", category: ItemCategory.OTHER, quantity: 6 },
      { name: "Multi-tool Pocket Knife", category: ItemCategory.OTHER, quantity: 1 },
    ]
  },
  {
    id: "pm-city",
    name: "City Explorer",
    type: JourneyType.CITY_BREAK,
    items: [
      { name: "City Guidebook / Map", category: ItemCategory.DOCUMENTS, quantity: 1 },
      { name: "Comfortable Walking Shoes", category: ItemCategory.CLOTHING, quantity: 1 },
      { name: "Camera & Charger", category: ItemCategory.ELECTRONICS, quantity: 1 },
      { name: "Daypack / Small Bag", category: ItemCategory.ACCESSORIES, quantity: 1 },
      { name: "Credit Cards & Small Cash", category: ItemCategory.DOCUMENTS, quantity: 1 },
      { name: "Hand Sanitizer", category: ItemCategory.TOILETRIES, quantity: 1 },
      { name: "Casual Jackets", category: ItemCategory.CLOTHING, quantity: 1 },
      { name: "Powerbank", category: ItemCategory.ELECTRONICS, quantity: 1 },
    ]
  },
  {
    id: "pm-winter",
    name: "Winter Expedition",
    type: JourneyType.SKI_TRIP,
    items: [
      { name: "Heavy Down Coat", category: ItemCategory.CLOTHING, quantity: 1 },
      { name: "Woolen Gloves / Mittens", category: ItemCategory.ACCESSORIES, quantity: 2 },
      { name: "Winter Beanie & Scarf", category: ItemCategory.ACCESSORIES, quantity: 1 },
      { name: "Lip Balm (Chapped prevention)", category: ItemCategory.TOILETRIES, quantity: 1 },
      { name: "Thermal Socks", category: ItemCategory.CLOTHING, quantity: 4 },
      { name: "Snow Goggles", category: ItemCategory.ACCESSORIES, quantity: 1 },
      { name: "Hand Warmers", category: ItemCategory.OTHER, quantity: 4 },
    ]
  },
  {
    id: "pm-safari",
    name: "Safari & Wildlife",
    type: JourneyType.SAFARI,
    items: [
      { name: "Binoculars", category: ItemCategory.ACCESSORIES, quantity: 1 },
      { name: "Insect Repellent Spray", category: ItemCategory.TOILETRIES, quantity: 1 },
      { name: "Khaki / Neutral T-shirts", category: ItemCategory.CLOTHING, quantity: 4 },
      { name: "Wide-brim Safari Hat", category: ItemCategory.ACCESSORIES, quantity: 1 },
      { name: "Vaccination Records / Yellow Card", category: ItemCategory.DOCUMENTS, quantity: 1 },
      { name: "Sunscreen Lotion", category: ItemCategory.TOILETRIES, quantity: 1 },
      { name: "Light Hiking Shoes", category: ItemCategory.CLOTHING, quantity: 1 },
    ]
  },
  {
    id: "pm-cruise",
    name: "Tropical Cruise",
    type: JourneyType.CRUISE,
    items: [
      { name: "Cruise Boarding Pass & ID", category: ItemCategory.DOCUMENTS, quantity: 1 },
      { name: "Swimwear / Trunks", category: ItemCategory.CLOTHING, quantity: 2 },
      { name: "Formal Dinner Outfit", category: ItemCategory.CLOTHING, quantity: 1 },
      { name: "Sea-sickness wristbands/pills", category: ItemCategory.MEDICINE, quantity: 1 },
      { name: "Sunscreen SPF 30", category: ItemCategory.TOILETRIES, quantity: 1 },
      { name: "Sandals / Boat Shoes", category: ItemCategory.CLOTHING, quantity: 1 },
      { name: "Polarized Sunglasses", category: ItemCategory.ACCESSORIES, quantity: 1 },
      { name: "Excursion Daypack", category: ItemCategory.ACCESSORIES, quantity: 1 },
    ]
  },
  {
    id: "pm-roadtrip",
    name: "Scenic Road Trip",
    type: JourneyType.ROAD_TRIP,
    items: [
      { name: "Driver's License & Insurance", category: ItemCategory.DOCUMENTS, quantity: 1 },
      { name: "Car Phone Mount", category: ItemCategory.ACCESSORIES, quantity: 1 },
      { name: "USB Car Charger / Multi-port", category: ItemCategory.ELECTRONICS, quantity: 1 },
      { name: "Offline GPS Maps", category: ItemCategory.DOCUMENTS, quantity: 1 },
      { name: "Travel Pillow & Blanket", category: ItemCategory.OTHER, quantity: 1 },
      { name: "Refillable Water Bottle", category: ItemCategory.OTHER, quantity: 1 },
      { name: "Roadside Emergency Kit", category: ItemCategory.OTHER, quantity: 1 },
      { name: "Snack Box (Nuts, Jerky, Bars)", category: ItemCategory.OTHER, quantity: 1 },
    ]
  },
  {
    id: "pm-backpack",
    name: "Backpacker Explorer",
    type: JourneyType.BACKPACKING,
    items: [
      { name: "Microfiber Travel Towel", category: ItemCategory.ACCESSORIES, quantity: 1 },
      { name: "Combination Padlocks", category: ItemCategory.ACCESSORIES, quantity: 2 },
      { name: "Universal Travel Adapter", category: ItemCategory.ELECTRONICS, quantity: 1 },
      { name: "Hostel Sleep Sheet / Liner", category: ItemCategory.OTHER, quantity: 1 },
      { name: "Quick-dry Underwear", category: ItemCategory.CLOTHING, quantity: 3 },
      { name: "Solid Soap bar", category: ItemCategory.TOILETRIES, quantity: 1 },
      { name: "Passport Photos", category: ItemCategory.DOCUMENTS, quantity: 4 },
    ]
  }
];

export async function seedDefaultBlueprints(prisma: PrismaClient) {
  try {
    // Determine target seeded blueprints list and ensure it includes the new ones
    console.log("[Seeding] Populating default travel blueprints...");
    for (const bp of PRE_MADE_BLUEPRINTS) {
      // Find by ID and upsert to handle new properties or items properly
      await prisma.blueprint.upsert({
        where: { id: bp.id },
        update: {
          name: bp.name,
          type: bp.type,
        },
        create: {
          id: bp.id,
          name: bp.name,
          type: bp.type,
          userId: null,
          items: {
            create: bp.items.map(item => ({
              name: item.name,
              category: item.category,
              quantity: item.quantity
            }))
          }
        }
      });
    }
    console.log("[Seeding] Default blueprints seeded successfully.");
  } catch (err) {
    console.error("[Seeding] Error seeding default blueprints:", err);
  }
}
