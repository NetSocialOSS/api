const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  // Get the port number from the req object
  const portNumber = req.app.get('3000');

  // Send "Hello, World" in JSON format along with the port number
  res.json({ main_site: 'netsocial.app', port: portNumber });
});

module.exports = router;


