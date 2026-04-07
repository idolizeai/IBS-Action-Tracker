const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5010;

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
