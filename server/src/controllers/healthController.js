import supabase from "../config/supabaseClient.js";

export const healthChecker = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("organizations")
      .select("id")
      .limit(1);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Database connection failed",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Database connected successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};