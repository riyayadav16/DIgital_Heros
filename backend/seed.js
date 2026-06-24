import { supabase } from "./lib/supabaseClient.js";

const seedData = async () => {
  try {
    // USERS
    const { data: users, error: userError } = await supabase
      .from("users")
      .insert([
        {
          name: "Admin",
          email: "admin@digitalheros.com",
          role: "admin"
        },
        {
          name: "Demo User",
          email: "demo@digitalheros.com",
          role: "user"
        }
      ]);

    if (userError) throw userError;

    // CHARITIES
    const { data: charities, error: charityError } = await supabase
      .from("charities")
      .insert([
        {
          name: "Education Fund",
          description: "Help students get education",
          goal_amount: 10000,
          raised_amount: 2500
        },
        {
          name: "Health Support",
          description: "Medical assistance for needy people",
          goal_amount: 20000,
          raised_amount: 8000
        }
      ]);

    if (charityError) throw charityError;

    console.log("✅ Seed completed successfully");
  } catch (err) {
    console.error("❌ Seed error:", err.message);
  }
};

seedData();