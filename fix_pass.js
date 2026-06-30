const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/visa_portal').then(async () => {
  const schema = new mongoose.Schema({}, { strict: false, collection: 'clients' });
  const Client = mongoose.model('Client', schema);
  await Client.updateOne({ passport: 'KN11223344' }, { $set: { password: 'norway2026' } });
  await Client.updateOne({ passport: 'KO345678' }, { $set: { password: 'serbia2026' } });
  await Client.updateOne({ passport: 'AU998877' }, { $set: { password: 'australia2026' } });
  await Client.updateOne({ passport: 'SK556644' }, { $set: { password: 'slovakia2026' } });
  console.log('All passwords updated to 2026 versions!');
  process.exit(0);
});
