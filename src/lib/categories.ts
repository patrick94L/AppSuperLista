export type Category =
  | 'Lácteos'
  | 'Limpieza'
  | 'Cuidado personal'
  | 'Frutas y verduras'
  | 'Abarrotes'
  | 'Carnes'
  | 'Mascotas'
  | 'Bebidas'
  | 'Otros';

export const CATEGORY_ICONS: Record<Category, string> = {
  'Lácteos': '🥛',
  'Limpieza': '🧽',
  'Cuidado personal': '🧴',
  'Frutas y verduras': '🥬',
  'Abarrotes': '🥫',
  'Carnes': '🍗',
  'Mascotas': '🐾',
  'Bebidas': '🍹',
  'Otros': '📦',
};

export const CATEGORY_ORDER: Category[] = [
  'Frutas y verduras',
  'Carnes',
  'Lácteos',
  'Abarrotes',
  'Bebidas',
  'Limpieza',
  'Cuidado personal',
  'Mascotas',
  'Otros',
];

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  'Lácteos': ['leche', 'yogurt', 'yoghurt', 'queso', 'mantequilla', 'manjar', 'crema de leche'],
  'Limpieza': ['cloro', 'detergente', 'paño', 'desinfectante', 'petalos', 'pétalos', 'lavaloza', 'lavavajilla', 'esponja', 'bolsa basura', 'limpiador', 'lejia', 'lejía', 'suavizante'],
  'Cuidado personal': ['toalla higienica', 'toalla higiénica', 'confort', 'papel higienico', 'papel higiénico', 'shampoo', 'champu', 'champú', 'jabon', 'jabón', 'desodorante', 'crema corporal', 'colonia', 'maquina de afeitar', 'máquina para depilar', 'corintios', 'cotonitos', 'pasta dental', 'cepillo dientes', 'crema peinar', 'aceite de pelo', 'toallas humedas', 'toallas húmedas', 'toalla nova', 'protector diario', 'pañal', 'pañales'],
  'Frutas y verduras': ['papa', 'papas', 'cilantro', 'choclo', 'kiwi', 'zapallo', 'platano', 'plátano', 'tomate', 'acelga', 'cebolla', 'palta', 'limon', 'limón', 'manzana', 'naranja', 'lechuga', 'zanahoria', 'pepino', 'apio', 'pimenton', 'pimentón', 'oregano', 'orégano', 'perejil', 'ajo'],
  'Abarrotes': ['mayo', 'mayonesa', 'cereal', 'fajitas', 'atun', 'atún', 'salsa de tomate', 'aceite', 'pan', 'arroz', 'fideos', 'azucar', 'azúcar', 'sal', 'harina', 'galletas', 'colacion', 'colación', 'conserva', 'cafe', 'café', 'nuggets', 'papas duquesa', 'papas fritas congeladas', 'pastelera', 'crema pastelera', 'salsa', 'condimento', 'especia', 'rapiditas'],
  'Carnes': ['churrasco', 'pollo', 'carne', 'vacuno', 'cerdo', 'pescado', 'salchicha', 'jamon', 'jamón', 'longaniza', 'vienesa'],
  'Mascotas': ['heno', 'pellet', 'alimento mascota', 'alimento perro', 'alimento gato', 'arena gato', 'correa'],
  'Bebidas': ['jugo', 'bebida', 'vino', 'cerveza', 'coca cola', 'agua mineral', 'fanta', 'sprite', 'te ', 'té '],
  'Otros': [],
};

export function categorize(name: string): Category {
  const lower = name.toLowerCase().replace(/-/g, ' ');
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [Category, string[]][]) {
    if (keywords.some(k => lower.includes(k))) return category;
  }
  return 'Otros';
}