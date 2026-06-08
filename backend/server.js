const express = require('express');
const cors = require('cors');

const eventsRoutes = require('./routes/events');
const catalogsRoutes = require('./routes/catalogs');
const usersRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const simulatorRoutes = require('./routes/simulator');
const configRoutes = require('./routes/config');
const reportsRoutes = require('./routes/reports'); // 👈 ESTE FALTABA

const eventSimulator = require('./services/eventSimulator');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/events', eventsRoutes);
app.use('/api/catalogs', catalogsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/simulator', simulatorRoutes);
app.use('/api/config', configRoutes);
app.use('/api/reports', reportsRoutes); // 👈 ESTE FALTABA

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);

  const ENABLE_SIMULATOR = true;

  if (ENABLE_SIMULATOR) {
    eventSimulator.start();
    console.log("Simulador de eventos activo");
  }
});