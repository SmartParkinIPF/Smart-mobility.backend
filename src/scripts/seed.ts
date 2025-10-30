import crypto from "crypto";
import { supabaseDB, supabaseServiceRol } from "../config/database";
import { ENV } from "../config/env";

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function randomName() {
  const names = [
    "Ana",
    "Luis",
    "Carla",
    "Nico",
    "Sofía",
    "Pedro",
    "María",
    "Julián",
    "Valentina",
    "Bruno",
    "Lucía",
    "Agustín",
  ];
  const last = [
    "García",
    "López",
    "Martínez",
    "Pérez",
    "Gómez",
    "Díaz",
    "Fernández",
    "Torres",
    "Sosa",
    "Ramírez",
  ];
  return { name: pick(names), last: pick(last) };
}

function randomEmail(base: string) {
  const n = randInt(1000, 999999);
  return `${base}.${n}@example.com`.toLowerCase();
}

function randomLatLon() {
  // Alrededor de Buenos Aires
  const lat = -26.1 + (Math.random() - 0.5) * 0.2;
  const lon = -58.1 + (Math.random() - 0.5) * 0.2;
  return {
    latitude: Number(lat.toFixed(6)),
    longitude: Number(lon.toFixed(6)),
  };
}

function randomPolygon(center: { latitude: number; longitude: number }) {
  const d = 0.0015; // ~150m
  const pts = [
    { latitude: center.latitude + d, longitude: center.longitude - d },
    { latitude: center.latitude + d, longitude: center.longitude + d },
    { latitude: center.latitude - d, longitude: center.longitude + d },
    { latitude: center.latitude - d, longitude: center.longitude - d },
  ];
  // cerrado
  return [...pts, pts[0]];
}

function toWktPolygon(points: { latitude: number; longitude: number }[]) {
  const coords = points.map((p) => `${p.longitude} ${p.latitude}`).join(", ");
  return `POLYGON((${coords}))`;
}

function toWktPoint(p: { latitude: number; longitude: number }) {
  return `POINT(${p.longitude} ${p.latitude})`;
}

async function ensureAdmin() {
  const email = "gerardoluisvega@gmail.com";
  const password = "geraAdmin";
  // Crea auth user admin si no existe
  const { data: list, error: listErr } =
    await supabaseServiceRol.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) throw listErr;
  const found = list.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  let adminId = found?.id;
  if (!adminId) {
    const { data, error } = await supabaseServiceRol.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "admin",
        name: "Gerardo",
        last_name: "Vega",
        phone: 0,
      },
    });
    if (error) throw error;
    adminId = data.user?.id || undefined;
  }
  if (!adminId) throw new Error("No se pudo obtener el id del admin");

  // upsert en usuarios
  const { data: u, error: uErr } = await supabaseDB
    .from("usuarios")
    .upsert(
      {
        id: adminId,
        name: "Gerardo",
        last_name: "Vega",
        phone: 0,
        email,
        role: "admin",
        created_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select("id")
    .single();
  if (uErr) throw uErr;
  return adminId;
}

async function seedUsuarios(count: number) {
  const rows = [] as any[];
  for (let i = 0; i < count; i++) {
    const { name, last } = randomName();
    const role = i % 10 === 0 ? "provider" : "user"; // ~10% proveedores
    rows.push({
      id: crypto.randomUUID(),
      name,
      last_name: last,
      phone: randInt(100000000, 999999999),
      email: randomEmail(`${name}.${last}`),
      role,
      created_at: new Date().toISOString(),
    });
  }
  const { data, error } = await supabaseDB
    .from("usuarios")
    .insert(rows)
    .select("id");
  if (error) throw error;
  return (data as any[]).map((r) => r.id) as string[];
}

async function seedPoliticas(count: number) {
  const rows = Array.from({ length: count }).map(() => ({
    id: crypto.randomUUID(),
    descripcion_corta: "Cancelación 24h antes",
    reglas_json: {
      ventana_horas: randInt(12, 72),
      penalidad_pct: randInt(0, 100),
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
  const { data, error } = await supabaseDB
    .from("politicas_cancelacion")
    .insert(rows)
    .select("id");
  if (error) throw error;
  return (data as any[]).map((r) => r.id) as string[];
}

async function seedTarifas(count: number) {
  const modos = ["fijo", "fraccion_30m", "por_hora", "por_hora"];
  const rows = Array.from({ length: count }).map(() => ({
    id: crypto.randomUUID(),
    nombre: `Tarifa ${randInt(1, 9999)}`,
    moneda: "ARS",
    modo_calculo: pick(modos),
    precio_base: randInt(0, 500),
    precio_por_hora: randInt(100, 800),
    fraccion_min: 30,
    minimo_cobro_min: 30,
    maximo_diario: randInt(3000, 8000),
    reglas_json: { tolerancia_min: randInt(0, 15) },
    vigencia_desde: new Date().toISOString(),
    vigencia_hasta: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
  const { data, error } = await supabaseDB
    .from("tarifas")
    .insert(rows)
    .select("id");
  if (error) throw error;
  return (data as any[]).map((r) => r.id) as string[];
}

async function seedHorarios(count: number, usuarios: string[]) {
  const rows = Array.from({ length: count }).map(() => ({
    id: crypto.randomUUID(),
    id_usuario: pick(usuarios),
    tipo: pick(["24x7", "rango", "por_dia"]),
    definicion: JSON.stringify({
      L: "08-20",
      M: "08-20",
      X: "08-20",
      J: "08-20",
      V: "08-20",
    }),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
  const { data, error } = await supabaseDB
    .from("horarios")
    .insert(rows)
    .select("id");
  if (error) throw error;
  return (data as any[]).map((r) => r.id) as string[];
}

async function seedEstablecimientos(count: number, propietarios: string[]) {
  const ciudades = [
    "CABA",
    "La Plata",
    "Morón",
    "San Isidro",
    "Lanús",
    "Avellaneda",
  ];
  const rows = [] as any[];
  for (let i = 0; i < count; i++) {
    const owner = pick(propietarios);
    const center = randomLatLon();
    rows.push({
      id: crypto.randomUUID(),
      propietario_id: owner,
      nombre: `Establecimiento ${i + 1}`,
      descripcion: "Playa de estacionamiento",
      direccion_calle: "Calle Falsa",
      direccion_numero: String(randInt(1, 2000)),
      ciudad: pick(ciudades),
      provincia: "Buenos Aires",
      pais: "AR",
      cp: String(randInt(1000, 1999)),
      perimetro: null,
      localizacion: toWktPoint(center),
      estado: pick(["activo", "inactivo"]),
      horario_general: JSON.stringify({ tipo: "24x7" }),
      capacidad_teorica: randInt(20, 200),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
  const { data, error } = await supabaseDB
    .from("establecimientos")
    .insert(rows)
    .select("id");
  if (error) throw error;
  return (data as any[]).map((r) => r.id) as string[];
}

async function seedEstacionamientos(
  count: number,
  establecimientos: string[],
  tarifas: string[],
  horarios: string[],
  politicas: string[]
) {
  const rows = [] as any[];
  for (let i = 0; i < count; i++) {
    const center = randomLatLon();
    const poly = randomPolygon(center);
    rows.push({
      id: crypto.randomUUID(),
      establecimiento_id: pick(establecimientos),
      nombre: `Estacionamiento ${i + 1}`,
      tipo: pick(["reservable", "libre", "mixto"]),
      soporta_discapacidad: Math.random() < 0.5,
      soporta_motos: Math.random() < 0.5,
      soporta_electricos: Math.random() < 0.5,
      tiene_cargadores: Math.random() < 0.3,
      cantidad_cargadores: randInt(0, 10),
      tarifa_id: pick(tarifas),
      horario_id: pick(horarios),
      politica_cancelacion_id: pick(politicas),
      estado: pick(["operativo", "mantenimiento"]),
      ubicacion: toWktPoint(center),
      perimetro_est: toWktPolygon(poly),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
  const { data, error } = await supabaseDB
    .from("estacionamientos")
    .insert(rows)
    .select("id");
  if (error) throw error;
  return (data as any[]).map((r) => r.id) as string[];
}

async function seedSlots(
  count: number,
  estacionamientos: string[],
  tarifas: string[]
) {
  const rows = [] as any[];
  for (let i = 0; i < count; i++) {
    const center = randomLatLon();
    const poly = randomPolygon(center).slice(0, 4); // local polygon json
    rows.push({
      id: crypto.randomUUID(),
      estacionamiento_id: pick(estacionamientos),
      codigo: `S-${randInt(1000, 9999)}`,
      tipo: pick(["auto", "moto", "electrico", "discapacidad"]),
      ancho_cm: randInt(200, 300),
      largo_cm: randInt(400, 600),
      ubicacion_local: poly,
      estado_operativo: pick(["operativo", "bloqueado", "en_mantenimiento"]),
      tarifa_id: pick(tarifas),
      es_reservable: Math.random() < 0.9,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
  const { data, error } = await supabaseDB
    .from("slots")
    .insert(rows)
    .select("id");
  if (error) throw error;
  return (data as any[]).map((r) => r.id) as string[];
}

// async function seedMapMarkers(count: number) {
//   const markerRows = [] as any[];
//   const coordRows = [] as any[];
//   for (let i = 0; i < count; i++) {
//     const id = crypto.randomUUID();
//     const c = randomLatLon();
//     markerRows.push({
//       id,
//       title: `Punto ${i + 1}`,
//       description: "Referencia",
//       category: pick(["poi", "barrera", "entrada", "salida"]),
//       pin_color: pick(["green", "red", "blue", "orange"]),
//       created_at: new Date().toISOString(),
//     });
//     coordRows.push({
//       marker_id: id,
//       latitude: c.latitude,
//       longitude: c.longitude,
//     });
//   }
//   const { error: mErr } = await supabaseDB
//     .from("map_markers")
//     .insert(markerRows);
//   if (mErr) throw mErr;
//   const { error: cErr } = await supabaseDB
//     .from("marker_coordinates")
//     .insert(coordRows);
//   if (cErr) throw cErr;
// }

async function seedReservas(
  count: number,
  usuarios: string[],
  slots: string[]
) {
  const rows = [] as any[];
  for (let i = 0; i < count; i++) {
    const desde = new Date();
    desde.setDate(desde.getDate() + randInt(-5, 5));
    desde.setHours(randInt(8, 18), 0, 0, 0);
    const hasta = new Date(desde.getTime() + randInt(1, 5) * 60 * 60 * 1000);
    rows.push({
      id: crypto.randomUUID(),
      usuario_id: pick(usuarios),
      slot_id: Math.random() < 0.7 ? pick(slots) : null,
      desde: desde.toISOString(),
      hasta: hasta.toISOString(),
      estado: "pendiente_pago",
      precio_total: randInt(1000, 8000),
      moneda: "ARS",
      origen: pick(["web", "mobile"]),
      codigo_qr: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
  const { data, error } = await supabaseDB
    .from("reservas")
    .insert(rows)
    .select("id");
  if (error) throw error;
  return (data as any[]).map((r) => r.id) as string[];
}

async function seedPagos(count: number, reservas: string[]) {
  const estados = [
    "pendiente",
    "aprobado",
    "rechazado",
    "reembolsado",
    "parcial",
  ];
  const rows = Array.from({ length: count }).map(() => ({
    id: crypto.randomUUID(),
    reserva_id: pick(reservas),
    metodo: "mp",
    monto: randInt(1000, 8000),
    moneda: "ARS",
    estado: pick(estados),
    proveedor_tx_id: null,
    recibo_url: null,
    created_at: new Date().toISOString(),
  }));
  const { error } = await supabaseDB.from("pagos").insert(rows);
  if (error) throw error;
}

async function main() {
  console.log(
    "Seeding with",
    ENV.SUPABASE_URL ? "Supabase URL present" : "missing env"
  );
  const adminId = await ensureAdmin();
  console.log("Admin:", adminId);

  // Usuarios
  const userIds = await seedUsuarios(60);
  console.log("Usuarios:", userIds.length);

  // Politicas, Tarifas, Horarios
  const politicas = await seedPoliticas(50);
  console.log("Politicas:", politicas.length);
  const tarifas = await seedTarifas(50);
  console.log("Tarifas:", tarifas.length);
  const horarios = await seedHorarios(50, [adminId, ...userIds]);
  console.log("Horarios:", horarios.length);

  // Establecimientos (dueños: usuarios role provider aprox cada 10)
  const proveedores = userIds.filter((_, idx) => idx % 10 === 0);
  const establecimientos = await seedEstablecimientos(
    50,
    proveedores.length ? proveedores : [adminId]
  );
  console.log("Establecimientos:", establecimientos.length);

  // Estacionamientos, Slots
  const estacionamientos = await seedEstacionamientos(
    50,
    establecimientos,
    tarifas,
    horarios,
    politicas
  );
  console.log("Estacionamientos:", estacionamientos.length);
  const slots = await seedSlots(200, estacionamientos, tarifas);
  console.log("Slots:", slots.length);

  // Map markers
  // await seedMapMarkers(50);
  // console.log("Map markers: 50");

  // Reservas y Pagos
  const reservas = await seedReservas(50, userIds, slots);
  console.log("Reservas:", reservas.length);
  await seedPagos(50, reservas);
  console.log("Pagos: 50");

  console.log("Seed completado.");
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
