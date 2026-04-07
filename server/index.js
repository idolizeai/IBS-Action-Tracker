const app = require('./app');
const { sequelize } = require('./models');

<<<<<<< HEAD
const PORT = process.env.PORT || 5010;
=======
const PORT = process.env.PORT || 5000;
>>>>>>> 25cd64f90a730b43cd747e13845932684e835196

sequelize
  .authenticate()
  .then(() => {
    console.log('Connected to SQL Server');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  });
