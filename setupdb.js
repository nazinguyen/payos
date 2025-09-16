const mongoose = require('mongoose');

main().catch(err => console.log(err));
require('dotenv').config();
async function main() {
  await mongoose.connect(process.env.DB);

  console.log('connect with database...');
}

module.exports = mongoose;