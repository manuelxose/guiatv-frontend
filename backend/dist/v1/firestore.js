"use strict";
// Legacy v1 firestore utilities removed during migration to MongoDB.
// Keep stubs so any accidental imports fail clearly at runtime.
Object.defineProperty(exports, "__esModule", { value: true });
exports.guardarCanalesEnFirestore = guardarCanalesEnFirestore;
exports.guardarProgramasEnFirestore = guardarProgramasEnFirestore;
exports.datosInicialesCargados = datosInicialesCargados;
exports.moverCanalesEspana = moverCanalesEspana;
async function guardarCanalesEnFirestore() {
    throw new Error('guardarCanalesEnFirestore removed: use the v2 MongoDB-based repositories.');
}
async function guardarProgramasEnFirestore() {
    throw new Error('guardarProgramasEnFirestore removed: use v2 migration scripts.');
}
async function datosInicialesCargados() {
    throw new Error('datosInicialesCargados removed: use v2 migration scripts.');
}
async function moverCanalesEspana() {
    throw new Error('moverCanalesEspana removed: use v2 migration scripts.');
}
//# sourceMappingURL=firestore.js.map