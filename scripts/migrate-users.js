const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function migrateUsers() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('avance');
    const users = db.collection('users');
    
    // Get all existing users
    const existingUsers = await users.find({}).toArray();
    console.log(`Found ${existingUsers.length} existing users`);
    
    // Update each user to add the new fields
    for (const user of existingUsers) {
      const updateFields = {};
      
      // Add role field if missing (default to 'user', but you can manually set admin)
      if (!user.role) {
        // Set first user as superadmin, others as users
        updateFields.role = existingUsers.indexOf(user) === 0 ? 'superadmin' : 'user';
      }
      
      // Add isActive field if missing
      if (user.isActive === undefined) {
        updateFields.isActive = true;
      }
      
      // Add lastLogin field if missing (set to null initially)
      if (!user.lastLogin) {
        updateFields.lastLogin = null;
      }
      
      // Add createdBy field if missing (set to own userId)
      if (!user.createdBy) {
        updateFields.createdBy = user._id;
      }
      
      if (Object.keys(updateFields).length > 0) {
        await users.updateOne(
          { _id: user._id },
          { $set: updateFields }
        );
        
        console.log(`Updated user ${user.email}:`, updateFields);
      }
    }
    
    // Show final user list
    const updatedUsers = await users.find({}).toArray();
    console.log('\nFinal user list:');
    updatedUsers.forEach(user => {
      console.log(`- ${user.email}: ${user.role} (active: ${user.isActive})`);
    });
    
    console.log('\nMigration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

migrateUsers();