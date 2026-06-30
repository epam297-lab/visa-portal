const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/visa_portal')
  .then(async () => {
    console.log("Connected to MongoDB - Seeding database...");
    
    const schema = new mongoose.Schema({}, { strict: false, collection: 'clients' });
    const Client = mongoose.model('Client', schema);
    
    const clients = [
      {
        name: "Peter Ochieng",
        passport: "KO345678",
        country: "Serbia",
        amount: "2500",
        step: "Confirmation of documents",
        password: "serbia2026",
        visaType: "Tourist",
        visaSubType: "Single Entry",
        remainingDays: 15,
        cancelled: false,
        cancelReason: "",
        processingOffice: "Embassy of Serbia, Addis Ababa",
        applicationRef: "SRB-2026-0189",
        trackingId: "VISA-SRB-C3D4E5F6-7G8H",
        notes: "Business conference in Belgrade",
        createdAt: new Date("2026-05-25")
      },
      {
        name: "Kibungei Nickson",
        passport: "KN11223344",
        country: "Norway",
        amount: "6500",
        step: "Pending",
        password: "norway2026",
        visaType: "Work Visa",
        visaSubType: "Skilled Worker",
        remainingDays: 45,
        cancelled: false,
        cancelReason: "",
        processingOffice: "Norwegian Embassy, Nairobi",
        applicationRef: "NRS-2026-0456",
        trackingId: "NRS123456789",
        notes: "Software developer position",
        createdAt: new Date("2026-06-18")
      },
      {
        name: "James Kamau",
        passport: "AU998877",
        country: "Australia",
        amount: "3500",
        step: "Pending",
        password: "australia2026",
        visaType: "Visitor",
        visaSubType: "Tourist (600)",
        remainingDays: 30,
        cancelled: false,
        cancelReason: "",
        processingOffice: "Australian High Commission, Nairobi",
        applicationRef: "AUS-2026-0789",
        trackingId: "AUSTRACK-998877",
        notes: "Tourist visit to Sydney",
        createdAt: new Date("2026-06-20")
      },
      {
        name: "Mary Wanjiku",
        passport: "SK556644",
        country: "Slovakia",
        amount: "2000",
        step: "Pending",
        password: "slovakia2026",
        visaType: "Schengen",
        visaSubType: "Tourist",
        remainingDays: 20,
        cancelled: false,
        cancelReason: "",
        processingOffice: "Embassy of Slovakia, Nairobi",
        applicationRef: "SVK-2026-0321",
        trackingId: "SVKTRACK-556644",
        notes: "Tourist visit to Bratislava",
        createdAt: new Date("2026-06-22")
      }
    ];
    
    let created = 0;
    for (const c of clients) {
      const existing = await Client.findOne({ passport: c.passport }).lean();
      if (!existing) {
        await new Client(c).save();
        console.log("  + Created: " + c.name + " (" + c.country + ")");
        created++;
      } else {
        console.log("  = Already exists: " + c.name + " (" + c.country + ")");
      }
    }
    
    console.log("\nSeed complete! " + created + " new clients created.");
    console.log("\n=== Test Credentials ===");
    console.log("Serbia:   Passport KO345678 / Password serbia2026");
    console.log("Norway:   Passport KN11223344 / Password norway2026");
    console.log("Australia: Passport AU998877 / Password australia2026");
    console.log("Slovakia: Passport SK556644 / Password slovakia2026");
    console.log("\nAdmin login: admin / admin123");
    
    process.exit(0);
  })
  .catch(err => {
    console.error("Error:", err);
    process.exit(1);
  });
